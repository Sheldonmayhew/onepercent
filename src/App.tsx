import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './stores/gameStore';
import { useMultiplayerStore } from './stores/multiplayerStore';
import { broadcastHostState } from './hooks/useMultiplayer';
import { loadAllPacks } from './data/loadPacks';
import { useMockDriver } from './mock/useMockDriver';

export default function App() {
  const { session, setPacks } = useGameStore();
  const { role, mockMode } = useMultiplayerStore();
  const location = useLocation();

  useEffect(() => {
    const packs = loadAllPacks();
    setPacks(packs);
  }, [setPacks]);

  // Broadcast game state to players whenever session changes (host only, not in mock mode)
  useEffect(() => {
    if (role === 'host' && session && !mockMode) {
      broadcastHostState();
    }
  }, [session, role, mockMode]);

  // Mock driver — drives state transitions locally for player/TV mock testing
  useMockDriver();

  return (
    <AnimatePresence mode="wait">
      <Outlet key={location.pathname} />
    </AnimatePresence>
  );
}
