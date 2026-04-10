import { useCallback } from 'react';
import { supabase, generateRoomCode } from '../../lib/supabase';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { useGameStore } from '../../stores/gameStore';
import { PLAYER_COLOURS, PLAYER_AVATARS, AVAILABLE_EMOJIS } from '../../types';
import {
  getHostChannel,
  setHostChannel,
  getHostBeforeUnloadHandler,
  setHostBeforeUnloadHandler,
  readyPlayers,
} from './hostChannel';
import { broadcastHostState, endHostGame, resetBroadcastRoute } from './broadcastHostState';

export function useHostMultiplayer() {
  const { submitAnswer } = useGameStore();
  const { roomCode, setRoomCode, setRole, setConnected, setError } = useMultiplayerStore();

  const createRoom = useCallback(async () => {
    const store = useGameStore.getState();
    if (!store.session) return null;
    const settings = store.session.settings;

    const code = generateRoomCode();
    resetBroadcastRoute();

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

      const prevChannel = getHostChannel();
      if (prevChannel) {
        supabase.removeChannel(prevChannel);
        setHostChannel(null);
      }

      const prevHandler = getHostBeforeUnloadHandler();
      if (prevHandler) {
        window.removeEventListener('beforeunload', prevHandler);
        setHostBeforeUnloadHandler(null);
      }

      const channel = supabase.channel(`room:${code}`, {
        config: { broadcast: { self: false }, presence: { key: 'host' } },
      });

      channel
        .on('broadcast', { event: 'player_join' }, (msg) => {
          const { name, playerId, avatar: requestedAvatar } = msg.payload as { name: string; playerId: string; avatar?: string };
          const store = useGameStore.getState();
          if (!store.session) return;
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
        .on('broadcast', { event: 'join_team' }, (msg) => {
          const { playerId, teamId } = msg.payload as { playerId: string; teamId: string };
          useGameStore.getState().assignPlayerToTeam(playerId, teamId);
          broadcastHostState();
        })
        .on('broadcast', { event: 'buzz_in' }, (msg) => {
          const { playerId, timestamp, answer } = msg.payload as {
            playerId: string;
            timestamp: number;
            answer: string | number;
          };
          const store = useGameStore.getState();
          if (!store.session) return;
          // Store timestamp and submit answer
          useGameStore.setState({
            session: {
              ...store.session,
              players: store.session.players.map((p) =>
                p.id === playerId ? { ...p, answerTimestamp: timestamp } : p
              ),
            },
          });
          submitAnswer(playerId, answer);
          broadcastHostState();
        })
        .on('broadcast', { event: 'category_pick' }, (msg) => {
          const { playerId, category } = msg.payload as { playerId: string; category: string };
          const store = useGameStore.getState();
          if (!store.session) return;
          useGameStore.setState({
            session: {
              ...store.session,
              players: store.session.players.map((p) =>
                p.id === playerId ? { ...p, selectedCategory: category } : p
              ),
            },
          });
          broadcastHostState();
        })
        .on('broadcast', { event: 'steal_target' }, (msg) => {
          const { playerId, targetId } = msg.payload as { playerId: string; targetId: string };
          const store = useGameStore.getState();
          if (!store.session) return;
          useGameStore.setState({
            session: {
              ...store.session,
              players: store.session.players.map((p) =>
                p.id === playerId ? { ...p, stealTarget: targetId } : p
              ),
            },
          });
          broadcastHostState();
        })
        .on('broadcast', { event: 'grab_bag_submit' }, (msg) => {
          const { playerId, selectedIndices } = msg.payload as {
            playerId: string;
            selectedIndices: number[];
          };
          // Store as comma-separated string to fit existing answer format
          submitAnswer(playerId, selectedIndices.join(','));
          broadcastHostState();
        })
        .on('broadcast', { event: 'ranking_submit' }, (msg) => {
          const { playerId, order } = msg.payload as {
            playerId: string;
            order: number[];
          };
          // Store as comma-separated string
          submitAnswer(playerId, order.join(','));
          broadcastHostState();
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

      setHostChannel(channel);
      setRoomCode(code);
      setRole('host');

      setHostBeforeUnloadHandler(() => endHostGame());
      const handler = () => endHostGame();
      setHostBeforeUnloadHandler(handler);
      window.addEventListener('beforeunload', handler);

      return code;
    } catch (err) {
      setError('Failed to create room');
      console.error(err);
      return null;
    }
  }, [setRoomCode, setRole, setConnected, setError, submitAnswer]);

  return { createRoom, broadcastState: broadcastHostState, roomCode };
}
