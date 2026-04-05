import { useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, generateRoomCode } from '../lib/supabase';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useGameStore } from '../stores/gameStore';
import type { GameBroadcast, BroadcastPlayer } from '../stores/multiplayerStore';
import type { GameSettings } from '../types';
import { TIMER_DURATIONS, PLAYER_COLOURS, PLAYER_AVATARS } from '../types';
import { generateId } from '../utils/helpers';

// ──────────────────────────────────────────
// Module-level channels — persist across component mount/unmount cycles.
// Without this, channels are destroyed when Landing unmounts → Lobby
// mounts (host) or JoinGame unmounts → PlayerView mounts (player).
// ──────────────────────────────────────────
let hostChannel: RealtimeChannel | null = null;
let playerChannel: RealtimeChannel | null = null;
const readyPlayers = new Set<string>();
let readyPlayersRound = -1;

// Module-level references for beforeunload cleanup
let hostBeforeUnloadHandler: (() => void) | null = null;
let playerBeforeUnloadHandler: (() => void) | null = null;

// ──────────────────────────────────────────
// Standalone broadcast — called from App.tsx useEffect and player_join handler.
// Must be a plain function (not a hook) so it can live in a persistent component.
// ──────────────────────────────────────────
export function broadcastHostState() {
  if (!hostChannel) return;
  const store = useGameStore.getState();
  if (!store.session) return;

  const s = store.session;

  // #16: Clear readyPlayers only when the round actually changes
  if (s.screen === 'playing' && !s.timerStarted && s.currentRound !== readyPlayersRound) {
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
    isEliminated: p.isEliminated,
    isBanked: p.isBanked,
    hasAnswered: p.hasAnswered,
  }));

  const currentQ = s.selectedQuestions[s.currentRound];
  const lastRound = s.roundHistory[s.roundHistory.length - 1];

  const broadcast: GameBroadcast = {
    screen: s.screen,
    players,
    timerStarted: s.timerStarted,
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

  hostChannel.send({ type: 'broadcast', event: 'game_state', payload: broadcast });
}

// ──────────────────────────────────────────
// End the game — notifies players and tears down the host channel.
// Called from Results, Lobby back button, or any host "end game" action.
// ──────────────────────────────────────────
export function endHostGame() {
  // Clean up beforeunload listener
  if (hostBeforeUnloadHandler) {
    window.removeEventListener('beforeunload', hostBeforeUnloadHandler);
    hostBeforeUnloadHandler = null;
  }

  if (!hostChannel) return;
  const channel = hostChannel;
  hostChannel = null;
  channel.send({ type: 'broadcast', event: 'game_ended', payload: {} });
  // Brief delay so the broadcast reaches players before we tear down
  setTimeout(() => supabase.removeChannel(channel), 300);
}

// ──────────────────────────────────────────
// Host-side hook
// ──────────────────────────────────────────
export function useHostMultiplayer() {
  const { submitAnswer, recordBankingDecision } = useGameStore();
  const { roomCode, setRoomCode, setRole, setConnected, setError } = useMultiplayerStore();

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

      // Clean up any existing channel before creating a new one
      if (hostChannel) {
        supabase.removeChannel(hostChannel);
        hostChannel = null;
      }

      // Clean up any existing beforeunload handler
      if (hostBeforeUnloadHandler) {
        window.removeEventListener('beforeunload', hostBeforeUnloadHandler);
        hostBeforeUnloadHandler = null;
      }

      // Create realtime channel
      const channel = supabase.channel(`room:${code}`, {
        config: { broadcast: { self: false }, presence: { key: 'host' } },
      });

      channel
        .on('broadcast', { event: 'player_join' }, (msg) => {
          const { name, playerId } = msg.payload as { name: string; playerId: string };
          const store = useGameStore.getState();
          if (!store.session) return;
          // Only allow joins during lobby phase
          if (store.session.screen !== 'lobby') return;

          // #7: Reconnection — if a player with the same name exists, update their id
          const existing = store.session.players.find(
            (p) => p.name.toLowerCase() === name.toLowerCase()
          );
          if (existing) {
            // Update the existing player's id to the new playerId (reconnection)
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
          const avatar = PLAYER_AVATARS.find(a => !usedAvatars.has(a)) ?? PLAYER_AVATARS[0];

          const player = {
            id: playerId,
            name,
            colour,
            avatar,
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

          // Broadcast updated player list immediately
          broadcastHostState();
        })
        .on('broadcast', { event: 'player_ready' }, (msg) => {
          const { playerId, roundIndex } = msg.payload as { playerId: string; roundIndex: number };
          const store = useGameStore.getState();
          if (!store.session) return;
          if (store.session.currentRound !== roundIndex) return;
          if (store.session.timerStarted) return;

          readyPlayers.add(playerId);

          const active = store.session.players.filter((p) => !p.isEliminated && !p.isBanked);
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
        .on('broadcast', { event: 'bank_decision' }, (msg) => {
          const { playerId, banked } = msg.payload as {
            playerId: string;
            banked: boolean;
          };
          recordBankingDecision(playerId, banked);
        })
        // #14: Listen for graceful player_leave broadcasts
        .on('broadcast', { event: 'player_leave' }, (msg) => {
          const { playerId } = msg.payload as { playerId: string };
          useGameStore.getState().removePlayer(playerId);
          readyPlayers.delete(playerId);
          broadcastHostState();
        })
        // #3: Presence tracking — detect when players disconnect ungracefully
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
            // #3: Track host presence
            channel.track({ role: 'host' });
          }
        });

      hostChannel = channel;
      setRoomCode(code);
      setRole('host');

      // #12: Browser close cleanup — end game on tab close
      hostBeforeUnloadHandler = () => endHostGame();
      window.addEventListener('beforeunload', hostBeforeUnloadHandler);

      return code;
    } catch (err) {
      setError('Failed to create room');
      console.error(err);
      return null;
    }
  }, [setRoomCode, setRole, setConnected, setError, submitAnswer, recordBankingDecision]);

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
    async (code: string, name: string) => {
      const upperCode = code.toUpperCase().trim();

      // #10: Validate room exists before joining
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
        // DB may not be set up — skip validation and try to join anyway
        console.warn('Room validation skipped (DB may not be set up)');
      }

      // Clean up any existing channel before creating a new one
      if (playerChannel) {
        supabase.removeChannel(playerChannel);
        playerChannel = null;
      }

      // Clean up any existing beforeunload handler
      if (playerBeforeUnloadHandler) {
        window.removeEventListener('beforeunload', playerBeforeUnloadHandler);
        playerBeforeUnloadHandler = null;
      }

      // Create channel and join
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
          // Host ended the game — clean up and return to landing
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
            // #3: Track player presence
            channel.track({ playerId, name, role: 'player' });
            // Announce ourselves to the host
            channel.send({
              type: 'broadcast',
              event: 'player_join',
              payload: { name, playerId },
            });

            // #9: Join confirmation — retry if no game state received
            setTimeout(() => {
              const store = useMultiplayerStore.getState();
              if (!store.gameState) {
                // Retry sending player_join once
                channel.send({
                  type: 'broadcast',
                  event: 'player_join',
                  payload: { name, playerId },
                });

                // Final check after another 3 seconds
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

      // #12: Browser close cleanup — send player_leave on tab close
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

  const sendBankDecision = useCallback((playerId: string, banked: boolean) => {
    playerChannel?.send({
      type: 'broadcast',
      event: 'bank_decision',
      payload: { playerId, banked },
    });
  }, []);

  // #14: Send player_leave before disconnecting
  const disconnect = useCallback(() => {
    // Clean up beforeunload listener
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

  return { joinRoom, sendReady, sendAnswer, sendBankDecision, disconnect };
}
