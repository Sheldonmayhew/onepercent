import { useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, generateRoomCode } from '../lib/supabase';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useGameStore } from '../stores/gameStore';
import type { GameBroadcast, BroadcastPlayer } from '../stores/multiplayerStore';
import { PLAYER_COLOURS, PLAYER_AVATARS, AVAILABLE_EMOJIS } from '../types';
import { generateId } from '../utils/helpers';

// ──────────────────────────────────────────
// Module-level channels — persist across component mount/unmount cycles.
// ──────────────────────────────────────────
let hostChannel: RealtimeChannel | null = null;
let playerChannel: RealtimeChannel | null = null;
const readyPlayers = new Set<string>();
let readyPlayersRound = -1;

let lastBroadcastRoute: string | null = null;

let hostBeforeUnloadHandler: (() => void) | null = null;
let playerBeforeUnloadHandler: (() => void) | null = null;

// ──────────────────────────────────────────
// Standalone broadcast — called from App.tsx useEffect and player_join handler.
// ──────────────────────────────────────────
export function broadcastHostState(route?: string) {
  if (!hostChannel) return;
  const store = useGameStore.getState();
  if (!store.session) return;

  const s = store.session;

  const playerRoute = route ?? lastBroadcastRoute ?? '/player/lobby';
  lastBroadcastRoute = playerRoute;

  if (playerRoute.includes('/play') && !s.timerStarted && s.currentRound !== readyPlayersRound) {
    readyPlayers.clear();
    readyPlayersRound = s.currentRound;
  }

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
    hasAnswered: p.hasAnswered,
  }));

  const currentQ = s.selectedQuestions[s.currentRound];
  const lastRound = s.roundHistory[s.roundHistory.length - 1];

  const broadcast: GameBroadcast = {
    route: playerRoute,
    players,
    timerStarted: s.timerStarted,
    packName: s.pack.name,
    teamMode: s.settings.teamMode,
    teams: s.teams,
  };

  if (playerRoute.includes('/play') && currentQ) {
    broadcast.round = {
      index: s.currentRound,
      difficulty,
      points,
      totalRounds: tiers.length,
      timerDuration: 30,
      question: {
        question: currentQ.question,
        type: currentQ.type,
        options: currentQ.options,
        image_url: currentQ.image_url,
        sequence_items: currentQ.sequence_items,
      },
    };
  }

  if (playerRoute.includes('/reveal') && lastRound) {
    const correctAnswer =
      lastRound.question.type === 'multiple_choice' || lastRound.question.type === 'image_based'
        ? lastRound.question.options?.[Number(lastRound.question.correct_answer)] ??
          String(lastRound.question.correct_answer)
        : String(lastRound.question.correct_answer);

    broadcast.reveal = {
      correctAnswer,
      explanation: lastRound.question.explanation,
      correctPlayerIds: lastRound.correctPlayers,
      incorrectPlayerIds: lastRound.incorrectPlayers,
    };
  }

  hostChannel.send({ type: 'broadcast', event: 'game_state', payload: broadcast });
}

// ──────────────────────────────────────────
// End the game
// ──────────────────────────────────────────
export function endHostGame() {
  if (hostBeforeUnloadHandler) {
    window.removeEventListener('beforeunload', hostBeforeUnloadHandler);
    hostBeforeUnloadHandler = null;
  }

  if (!hostChannel) return;
  const channel = hostChannel;
  hostChannel = null;
  channel.send({ type: 'broadcast', event: 'game_ended', payload: {} });
  setTimeout(() => supabase.removeChannel(channel), 300);
}

// ──────────────────────────────────────────
// Host-side hook
// ──────────────────────────────────────────
export function useHostMultiplayer() {
  const { submitAnswer } = useGameStore();
  const { roomCode, setRoomCode, setRole, setConnected, setError } = useMultiplayerStore();

  const createRoom = useCallback(async () => {
    const store = useGameStore.getState();
    if (!store.session) return null;
    const settings = store.session.settings;

    const code = generateRoomCode();

    try {
      const { error: dbError } = await supabase.from('game_rooms').insert({
        room_code: code,
        pack_id: settings.packIds[0],
        settings,
        status: 'lobby',
      });

      if (dbError) {
        console.warn('DB insert failed (may not be set up yet), continuing with broadcast only:', dbError.message);
      }

      if (hostChannel) {
        supabase.removeChannel(hostChannel);
        hostChannel = null;
      }

      if (hostBeforeUnloadHandler) {
        window.removeEventListener('beforeunload', hostBeforeUnloadHandler);
        hostBeforeUnloadHandler = null;
      }

      const channel = supabase.channel(`room:${code}`, {
        config: { broadcast: { self: false }, presence: { key: 'host' } },
      });

      channel
        .on('broadcast', { event: 'player_join' }, (msg) => {
          const { name, playerId, avatar: requestedAvatar } = msg.payload as { name: string; playerId: string; avatar?: string };
          const store = useGameStore.getState();
          if (!store.session) return;
          if (store.session.screen !== 'lobby') return;

          const existing = store.session.players.find(
            (p) => p.name.toLowerCase() === name.toLowerCase()
          );
          if (existing) {
            useGameStore.setState({
              session: {
                ...store.session,
                players: store.session.players.map((p) =>
                  p.id === existing.id ? { ...p, id: playerId } : p
                ),
              },
            });
            broadcastHostState();
            return;
          }

          const usedColours = new Set(store.session.players.map(p => p.colour));
          const usedAvatars = new Set(store.session.players.map(p => p.avatar));
          const colour = PLAYER_COLOURS.find(c => !usedColours.has(c)) ?? PLAYER_COLOURS[0];

          // Use player's requested avatar if available, otherwise auto-assign
          let avatar: string;
          if (requestedAvatar && !usedAvatars.has(requestedAvatar)) {
            avatar = requestedAvatar;
          } else {
            avatar = AVAILABLE_EMOJIS.find(a => !usedAvatars.has(a)) ?? PLAYER_AVATARS[0];
          }

          const player = {
            id: playerId,
            name,
            colour,
            avatar,
            score: 0,
            currentAnswer: null,
            hasAnswered: false,
          };
          useGameStore.setState({
            session: {
              ...store.session,
              players: [...store.session.players, player],
            },
          });

          broadcastHostState();
        })
        .on('broadcast', { event: 'player_ready' }, (msg) => {
          const { playerId, roundIndex } = msg.payload as { playerId: string; roundIndex: number };
          const store = useGameStore.getState();
          if (!store.session) return;
          if (store.session.currentRound !== roundIndex) return;
          if (store.session.timerStarted) return;

          readyPlayers.add(playerId);

          const active = store.session.players;
          if (active.length > 0 && active.every((p) => readyPlayers.has(p.id))) {
            readyPlayers.clear();
            useGameStore.setState({
              session: { ...store.session, timerStarted: true },
            });
          }
        })
        .on('broadcast', { event: 'answer' }, (msg) => {
          const { playerId, answer } = msg.payload as {
            playerId: string;
            answer: string | number;
          };
          submitAnswer(playerId, answer);
        })
        .on('broadcast', { event: 'player_leave' }, (msg) => {
          const { playerId } = msg.payload as { playerId: string };
          useGameStore.getState().removePlayer(playerId);
          readyPlayers.delete(playerId);
          broadcastHostState();
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          for (const presence of leftPresences) {
            const { playerId, role } = presence as { playerId?: string; role?: string };
            if (role === 'player' && playerId) {
              useGameStore.getState().removePlayer(playerId);
              readyPlayers.delete(playerId);
            }
          }
          broadcastHostState();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
            channel.track({ role: 'host' });
          }
        });

      hostChannel = channel;
      setRoomCode(code);
      setRole('host');

      hostBeforeUnloadHandler = () => endHostGame();
      window.addEventListener('beforeunload', hostBeforeUnloadHandler);

      return code;
    } catch (err) {
      setError('Failed to create room');
      console.error(err);
      return null;
    }
  }, [setRoomCode, setRole, setConnected, setError, submitAnswer]);

  return { createRoom, broadcastState: broadcastHostState, roomCode };
}

// ──────────────────────────────────────────
// Player-side hook
// ──────────────────────────────────────────
export function usePlayerMultiplayer() {
  const {
    setRole,
    setRoomCode,
    setPlayerInfo,
    setConnected,
    setError,
    setGameState,
  } = useMultiplayerStore();

  const joinRoom = useCallback(
    async (code: string, name: string, avatar?: string) => {
      const upperCode = code.toUpperCase().trim();

      try {
        const { data, error: dbError } = await supabase
          .from('game_rooms')
          .select('room_code')
          .eq('room_code', upperCode)
          .single();

        if (dbError || !data) {
          setError('Room not found');
          return;
        }
      } catch {
        console.warn('Room validation skipped (DB may not be set up)');
      }

      if (playerChannel) {
        supabase.removeChannel(playerChannel);
        playerChannel = null;
      }

      if (playerBeforeUnloadHandler) {
        window.removeEventListener('beforeunload', playerBeforeUnloadHandler);
        playerBeforeUnloadHandler = null;
      }

      const playerId = generateId();
      const channel = supabase.channel(`room:${upperCode}`, {
        config: { broadcast: { self: false }, presence: { key: playerId } },
      });

      channel
        .on('broadcast', { event: 'game_state' }, (msg) => {
          const state = msg.payload as GameBroadcast;
          setGameState(state);
        })
        .on('broadcast', { event: 'game_ended' }, () => {
          if (playerBeforeUnloadHandler) {
            window.removeEventListener('beforeunload', playerBeforeUnloadHandler);
            playerBeforeUnloadHandler = null;
          }
          if (playerChannel) {
            supabase.removeChannel(playerChannel);
            playerChannel = null;
          }
          useMultiplayerStore.getState().reset();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
            channel.track({ playerId, name, role: 'player' });
            channel.send({
              type: 'broadcast',
              event: 'player_join',
              payload: { name, playerId, avatar },
            });

            setTimeout(() => {
              const store = useMultiplayerStore.getState();
              if (!store.gameState) {
                channel.send({
                  type: 'broadcast',
                  event: 'player_join',
                  payload: { name, playerId },
                });

                setTimeout(() => {
                  const storeRetry = useMultiplayerStore.getState();
                  if (!storeRetry.gameState) {
                    setError('Failed to join room - no response from host');
                  }
                }, 3000);
              }
            }, 3000);
          }
        });

      playerChannel = channel;
      setRole('player');
      setRoomCode(upperCode);
      setPlayerInfo(playerId, name);

      playerBeforeUnloadHandler = () => {
        if (playerChannel) {
          playerChannel.send({
            type: 'broadcast',
            event: 'player_leave',
            payload: { playerId },
          });
          supabase.removeChannel(playerChannel);
          playerChannel = null;
        }
      };
      window.addEventListener('beforeunload', playerBeforeUnloadHandler);
    },
    [setRole, setRoomCode, setPlayerInfo, setConnected, setError, setGameState]
  );

  const sendReady = useCallback((playerId: string, roundIndex: number) => {
    playerChannel?.send({
      type: 'broadcast',
      event: 'player_ready',
      payload: { playerId, roundIndex },
    });
  }, []);

  const sendAnswer = useCallback((playerId: string, answer: string | number) => {
    playerChannel?.send({
      type: 'broadcast',
      event: 'answer',
      payload: { playerId, answer },
    });
  }, []);

  const disconnect = useCallback(() => {
    if (playerBeforeUnloadHandler) {
      window.removeEventListener('beforeunload', playerBeforeUnloadHandler);
      playerBeforeUnloadHandler = null;
    }

    if (playerChannel) {
      const pId = useMultiplayerStore.getState().playerId;
      if (pId) {
        playerChannel.send({
          type: 'broadcast',
          event: 'player_leave',
          payload: { playerId: pId },
        });
      }
      supabase.removeChannel(playerChannel);
      playerChannel = null;
    }
  }, []);

  return { joinRoom, sendReady, sendAnswer, disconnect };
}
