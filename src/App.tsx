import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './stores/gameStore';
import { useMultiplayerStore } from './stores/multiplayerStore';
import { broadcastHostState } from './hooks/useMultiplayer';
import { loadAllPacks } from './data/loadPacks';
import Landing from './components/Landing/Landing';
import Lobby from './components/Lobby/Lobby';
import GameScreen from './components/Game/GameScreen';
import RevealScreen from './components/Game/RevealScreen';
import BankingPhase from './components/Game/BankingPhase';
import Results from './components/Results/Results';
import JoinGame from './components/Player/JoinGame';
import PlayerView from './components/Player/PlayerView';
import JoinModal from './components/Player/JoinModal';

function getJoinCodeFromHash(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/^#join=([A-Z0-9]{5})$/i);
  return match ? match[1].toUpperCase() : null;
}

export default function App() {
  const { session, setPacks } = useGameStore();
  const { role, isConnected, gameState } = useMultiplayerStore();
  const [joinCode, setJoinCode] = useState<string | null>(getJoinCodeFromHash);

  useEffect(() => {
    const packs = loadAllPacks();
    setPacks(packs);
  }, [setPacks]);

  // Clear the hash from the URL after reading it
  useEffect(() => {
    if (joinCode) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [joinCode]);

  // Broadcast game state to all players whenever the host's session changes.
  // This effect lives here (App never unmounts) so it survives screen transitions.
  useEffect(() => {
    if (role === 'host' && session) {
      broadcastHostState();
    }
  }, [session, role]);

  // Player mode — show player experience
  if (role === 'player') {
    if (!isConnected || !gameState) {
      return <JoinGame />;
    }
    return <PlayerView />;
  }

  // Join via URL — show name modal (before any host/landing screen)
  if (joinCode && !role) {
    return (
      <JoinModal
        roomCode={joinCode}
        onClose={() => setJoinCode(null)}
      />
    );
  }

  // Host mode (or local play)
  const screen = session?.screen ?? 'landing';

  return (
    <AnimatePresence mode="wait">
      {screen === 'landing' && <Landing key="landing" />}
      {screen === 'lobby' && <Lobby key="lobby" />}
      {screen === 'playing' && <GameScreen key="playing" />}
      {screen === 'reveal' && <RevealScreen key="reveal" />}
      {screen === 'banking' && <BankingPhase key="banking" />}
      {screen === 'results' && <Results key="results" />}
    </AnimatePresence>
  );
}
