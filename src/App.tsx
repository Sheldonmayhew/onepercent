import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './stores/gameStore';
import { useMultiplayerStore } from './stores/multiplayerStore';
import { loadAllPacks } from './data/loadPacks';
import Landing from './components/Landing/Landing';
import Lobby from './components/Lobby/Lobby';
import GameScreen from './components/Game/GameScreen';
import RevealScreen from './components/Game/RevealScreen';
import BankingPhase from './components/Game/BankingPhase';
import Results from './components/Results/Results';
import JoinGame from './components/Player/JoinGame';
import PlayerView from './components/Player/PlayerView';

export default function App() {
  const { session, setPacks } = useGameStore();
  const { role, isConnected, gameState } = useMultiplayerStore();

  useEffect(() => {
    const packs = loadAllPacks();
    setPacks(packs);
  }, [setPacks]);

  // Player mode — show player experience
  if (role === 'player') {
    if (!isConnected || !gameState) {
      return <JoinGame />;
    }
    return <PlayerView />;
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
