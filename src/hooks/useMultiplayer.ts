import { useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, generateRoomCode } from '../lib/supabase';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useGameStore } from '../stores/gameStore';
import type { GameBroadcast, BroadcastPlayer } from '../stores/multiplayerStore';
import type { GameSettings } from '../types';
import { TIMER_DURATIONS, PLAYER_COLOURS, PLAYER_AVATARS } from '../types';
import { generateId } from '../utils/helpers';

// ──────────────────────────────────────────
// Host-side hook
// ──────────────────────────────────────────
export function useHostMultiplayer() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { session, submitAnswer, bankPlayer } = useGameStore();
  const { roomCode, setRoomCode, setRole, setConnected, setError } = useMultiplayerStore();

  // Create a room and broadcast channel
  const createRoom = useCallback(async (settings: GameSettings) => {
    const code = generateRoomCode();

    try {
      // Insert room record into database
      const { error: dbError } = await supabase.from('game_rooms').insert({
        room_code: code,
        pack_id: settings.packId,
        settings,
        status: 'lobby',
      });

      if (dbError) {
        console.warn('DB insert failed (may not be set up yet), continuing with broadcast only:', dbError.message);
      }

      // Create realtime channel
      const channel = supabase.channel(`room:${code}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'player_join' }, (msg) => {
          const { name, playerId } = msg.payload as { name: string; playerId: string };
          // Add player to game store
          const store = useGameStore.getState();
          if (!store.session) return;
          const existing = store.session.players.find(
            (p) => p.name.toLowerCase() === name.toLowerCase()
          );
          if (existing) return;

          const idx = store.session.players.length;
          const player = {
            id: playerId,
            name,
            colour: PLAYER_COLOURS[idx % PLAYER_COLOURS.length],
            avatar: PLAYER_AVATARS[idx % PLAYER_AVATARS.length],
            score: 0,
            isEliminated: false,
            isBanked: false,
            currentAnswer: null,
            hasAnswered: false,
            lastCorrectRound: -1,
          };
          useGameStore.setState({
            session: {
              ...store.session,
              players: [...store.session.players, player],
            },
          });

          // Broadcast updated player list
          broadcastState();
        })
        .on('broadcast', { event: 'answer' }, (msg) => {
          const { playerId, answer } = msg.payload as {
            playerId: string;
            answer: string | number;
          };
          submitAnswer(playerId, answer);
        })
        .on('broadcast', { event: 'bank_decision' }, (msg) => {
          const { playerId, banked } = msg.payload as {
            playerId: string;
            banked: boolean;
          };
          if (banked) {
            bankPlayer(playerId);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
          }
        });

      channelRef.current = channel;
      setRoomCode(code);
      setRole('host');

      return code;
    } catch (err) {
      setError('Failed to create room');
      console.error(err);
      return null;
    }
  }, [setRoomCode, setRole, setConnected, setError, submitAnswer, bankPlayer]);

  // Broadcast current game state to all players
  const broadcastState = useCallback(() => {
    const channel = channelRef.current;
    const store = useGameStore.getState();
    if (!channel || !store.session) return;

    const s = store.session;
    const tiers =
      s.settings.mode === 'quick' ? [90, 70, 50, 20, 1] : [90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1];
    const difficulty = tiers[s.currentRound] ?? 90;
    const pointsMap: Record<number, number> = {
      90: 100, 80: 200, 70: 300, 60: 500, 50: 1000,
      40: 2000, 30: 5000, 20: 10000, 10: 25000, 5: 50000, 1: 100000,
    };
    const points = pointsMap[difficulty] ?? 0;

    const players: BroadcastPlayer[] = s.players.map((p) => ({
      id: p.id,
      name: p.name,
      colour: p.colour,
      avatar: p.avatar,
      score: p.score,
      isEliminated: p.isEliminated,
      isBanked: p.isBanked,
      hasAnswered: p.hasAnswered,
    }));

    const currentQ = s.selectedQuestions[s.currentRound];
    const lastRound = s.roundHistory[s.roundHistory.length - 1];

    const broadcast: GameBroadcast = {
      screen: s.screen,
      players,
      packName: s.pack.name,
      modeName: s.settings.mode,
    };

    if (s.screen === 'playing' && currentQ) {
      broadcast.round = {
        index: s.currentRound,
        difficulty,
        points,
        totalRounds: tiers.length,
        timerDuration: currentQ.time_limit_seconds ?? TIMER_DURATIONS[s.settings.timerSpeed],
        question: {
          question: currentQ.question,
          type: currentQ.type,
          options: currentQ.options,
          image_url: currentQ.image_url,
          sequence_items: currentQ.sequence_items,
        },
      };
    }

    if (s.screen === 'reveal' && lastRound) {
      const correctAnswer =
        lastRound.question.type === 'multiple_choice' || lastRound.question.type === 'image_based'
          ? lastRound.question.options?.[Number(lastRound.question.correct_answer)] ??
            String(lastRound.question.correct_answer)
          : String(lastRound.question.correct_answer);

      broadcast.reveal = {
        correctAnswer,
        explanation: lastRound.question.explanation,
        correctPlayerIds: lastRound.correctPlayers,
        eliminatedPlayerIds: lastRound.eliminatedPlayers,
      };
    }

    if (s.screen === 'banking') {
      broadcast.banking = { difficulty, points };
    }

    channel.send({ type: 'broadcast', event: 'game_state', payload: broadcast });
  }, []);

  // Broadcast whenever session changes
  useEffect(() => {
    if (channelRef.current && session) {
      broadcastState();
    }
  }, [session, broadcastState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return { createRoom, broadcastState, roomCode };
}

// ──────────────────────────────────────────
// Player-side hook
// ──────────────────────────────────────────
export function usePlayerMultiplayer() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const {
    setRole,
    setRoomCode,
    setPlayerInfo,
    setConnected,
    setError,
    setGameState,
  } = useMultiplayerStore();

  const joinRoom = useCallback(
    async (code: string, name: string) => {
      const upperCode = code.toUpperCase().trim();

      // Verify room exists (optional — may fail if DB not set up)
      await supabase
        .from('game_rooms')
        .select('room_code')
        .eq('room_code', upperCode)
        .single();

      // Create channel and join
      const playerId = generateId();
      const channel = supabase.channel(`room:${upperCode}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'game_state' }, (msg) => {
          const state = msg.payload as GameBroadcast;
          setGameState(state);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
            // Announce ourselves to the host
            channel.send({
              type: 'broadcast',
              event: 'player_join',
              payload: { name, playerId },
            });
          }
        });

      channelRef.current = channel;
      setRole('player');
      setRoomCode(upperCode);
      setPlayerInfo(playerId, name);
    },
    [setRole, setRoomCode, setPlayerInfo, setConnected, setError, setGameState]
  );

  const sendAnswer = useCallback((playerId: string, answer: string | number) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'answer',
      payload: { playerId, answer },
    });
  }, []);

  const sendBankDecision = useCallback((playerId: string, banked: boolean) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'bank_decision',
      payload: { playerId, banked },
    });
  }, []);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { joinRoom, sendAnswer, sendBankDecision, disconnect };
}
