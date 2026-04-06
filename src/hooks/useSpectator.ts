import { useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import type { GameBroadcast } from '../stores/multiplayerStore';

let spectatorChannel: RealtimeChannel | null = null;

export function useSpectator() {
  const { setRole, setRoomCode, setConnected, setError, setGameState } =
    useMultiplayerStore();

  const connect = useCallback(
    async (code: string) => {
      const upperCode = code.toUpperCase().trim();

      // Clean up any existing connection
      if (spectatorChannel) {
        supabase.removeChannel(spectatorChannel);
        spectatorChannel = null;
      }

      const channel = supabase.channel(`room:${upperCode}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'game_state' }, (msg) => {
          const state = msg.payload as GameBroadcast;
          setGameState(state);
        })
        .on('broadcast', { event: 'game_ended' }, () => {
          useMultiplayerStore.getState().reset();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
          }
        });

      spectatorChannel = channel;
      setRole('spectator');
      setRoomCode(upperCode);
    },
    [setRole, setRoomCode, setConnected, setError, setGameState]
  );

  const disconnect = useCallback(() => {
    if (spectatorChannel) {
      supabase.removeChannel(spectatorChannel);
      spectatorChannel = null;
    }
    useMultiplayerStore.getState().reset();
  }, []);

  return { connect, disconnect };
}
