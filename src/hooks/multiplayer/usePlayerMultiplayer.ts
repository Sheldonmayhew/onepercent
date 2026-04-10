import { useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { useGameStore } from '../../stores/gameStore';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { generateId } from '../../utils/helpers';

let playerChannel: RealtimeChannel | null = null;
let playerBeforeUnloadHandler: (() => void) | null = null;

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

  const sendJoinTeam = useCallback((playerId: string, teamId: string) => {
    playerChannel?.send({
      type: 'broadcast',
      event: 'join_team',
      payload: { playerId, teamId },
    });
  }, []);

  const sendAnswer = useCallback((playerId: string, answer: string | number) => {
    const mpStore = useMultiplayerStore.getState();
    if (mpStore.mockMode && mpStore.gameState) {
      // In mock mode, mark this player as answered in both stores
      useMultiplayerStore.setState({
        gameState: {
          ...mpStore.gameState,
          players: mpStore.gameState.players.map((p) =>
            p.id === playerId ? { ...p, hasAnswered: true } : p
          ),
        },
      });
      // Also submit to game store so scoring works correctly
      useGameStore.getState().submitAnswer(playerId, answer);
      return;
    }
    playerChannel?.send({
      type: 'broadcast',
      event: 'answer',
      payload: { playerId, answer },
    });
  }, []);

  const sendBuzzIn = useCallback((playerId: string, timestamp: number, answer: string | number) => {
    const mpStore = useMultiplayerStore.getState();
    if (mpStore.mockMode && mpStore.gameState) {
      useMultiplayerStore.setState({
        gameState: {
          ...mpStore.gameState,
          players: mpStore.gameState.players.map((p) =>
            p.id === playerId ? { ...p, hasAnswered: true, answerTimestamp: timestamp } : p
          ),
        },
      });
      useGameStore.getState().submitAnswer(playerId, answer);
      return;
    }
    playerChannel?.send({
      type: 'broadcast',
      event: 'buzz_in',
      payload: { playerId, timestamp, answer },
    });
  }, []);

  const sendCategoryPick = useCallback((playerId: string, category: string) => {
    playerChannel?.send({
      type: 'broadcast',
      event: 'category_pick',
      payload: { playerId, category },
    });
  }, []);

  const sendStealTarget = useCallback((playerId: string, targetId: string) => {
    playerChannel?.send({
      type: 'broadcast',
      event: 'steal_target',
      payload: { playerId, targetId },
    });
  }, []);

  const sendGrabBagSubmit = useCallback((playerId: string, selectedIndices: number[]) => {
    playerChannel?.send({
      type: 'broadcast',
      event: 'grab_bag_submit',
      payload: { playerId, selectedIndices },
    });
  }, []);

  const sendRankingSubmit = useCallback((playerId: string, order: number[]) => {
    playerChannel?.send({
      type: 'broadcast',
      event: 'ranking_submit',
      payload: { playerId, order },
    });
  }, []);

  const disconnect = useCallback(() => {
    if (useMultiplayerStore.getState().mockMode) return;

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

  return {
    joinRoom,
    sendReady,
    sendAnswer,
    sendJoinTeam,
    sendBuzzIn,
    sendCategoryPick,
    sendStealTarget,
    sendGrabBagSubmit,
    sendRankingSubmit,
    disconnect,
  };
}
