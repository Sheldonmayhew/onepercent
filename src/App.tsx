import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './stores/gameStore';
import { useMultiplayerStore } from './stores/multiplayerStore';
import { broadcastHostState } from './hooks/useMultiplayer';
import { loadAllPacks } from './data/loadPacks';

export default function App() {
  const { session, setPacks } = useGameStore();
  const { role } = useMultiplayerStore();
  const location = useLocation();

  useEffect(() => {
    const packs = loadAllPacks();
    setPacks(packs);
  }, [setPacks]);

  // Broadcast game state to players whenever session changes (host only)
  useEffect(() => {
    if (role === 'host' && session) {
      broadcastHostState();
    }
  }, [session, role]);

  return (
    <AnimatePresence mode="wait">
      <Outlet key={location.pathname} />
    </AnimatePresence>
  );
}
