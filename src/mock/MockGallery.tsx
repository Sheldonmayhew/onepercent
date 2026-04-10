import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import {
  MOCK_PLAYERS,
  MOCK_PACK,
  buildMockSession,
  buildBroadcastFromSession,
} from './mockData';
import type { MockPersonaRole, MockPersona } from './mockData';

// ── Role definitions ─────────────────────────────────────────

interface RoleOption {
  id: MockPersonaRole;
  label: string;
  description: string;
  colour: string;
  icon: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: 'quick-play', label: 'Quick Play', description: 'Solo player — full game flow', colour: '#4a6cf7', icon: '1' },
  { id: 'host', label: 'Host', description: 'Host view — full game flow', colour: '#7C3AED', icon: 'H' },
  { id: 'player', label: 'Player', description: 'Player view — mock host drives flow', colour: '#EAB308', icon: 'P' },
  { id: 'tv', label: 'TV Display', description: 'Spectator view — auto-advances', colour: '#22C55E', icon: 'TV' },
];

// ── Launch helpers ───────────────────────────────────────────

function useMockLaunch() {
  const navigate = useNavigate();

  return (role: MockPersonaRole, persona: MockPersona | null) => {
    switch (role) {
      case 'quick-play': {
        const session = buildMockSession({ roundIndex: 0, playerCount: 1 });
        useGameStore.setState({ session });
        useGameStore.getState().setPacks([MOCK_PACK]);
        useGameStore.getState().startGame();
        useMultiplayerStore.setState({
          role: null,
          mockMode: false,
          roomCode: null,
          playerId: session.players[0].id,
          playerName: session.players[0].name,
          isConnected: false,
          error: null,
          gameState: null,
        });
        navigate('/quick-play/round-intro');
        break;
      }

      case 'host': {
        const session = buildMockSession({ roundIndex: 0, playerCount: 6 });
        useGameStore.setState({ session });
        useGameStore.getState().setPacks([MOCK_PACK]);
        useGameStore.getState().startGame();
        useMultiplayerStore.setState({
          role: 'host',
          mockMode: false,
          roomCode: 'MOCK42',
          playerId: null,
          playerName: null,
          isConnected: true,
          error: null,
          gameState: null,
        });
        navigate('/host/round-intro');
        break;
      }

      case 'player': {
        const pid = persona?.playerId ?? 'p2';
        const pname = persona?.playerName ?? 'Naledi';

        // Build a full session so the mock driver can use game store actions
        const session = buildMockSession({ roundIndex: 0, playerCount: 6 });
        useGameStore.setState({ session });
        useGameStore.getState().setPacks([MOCK_PACK]);
        useGameStore.getState().startGame();

        // Build initial broadcast state (lobby)
        const updatedSession = useGameStore.getState().session!;
        const broadcast = buildBroadcastFromSession(updatedSession, '/player/lobby');

        useMultiplayerStore.setState({
          role: 'player',
          mockMode: true,
          roomCode: 'MOCK42',
          playerId: pid,
          playerName: pname,
          isConnected: true,
          error: null,
          gameState: broadcast,
        });
        navigate('/player/lobby');
        break;
      }

      case 'tv': {
        // Build a full session so the mock driver can drive game logic
        const session = buildMockSession({ roundIndex: 0, playerCount: 6 });
        useGameStore.setState({ session });
        useGameStore.getState().setPacks([MOCK_PACK]);
        useGameStore.getState().startGame();

        const updatedSession = useGameStore.getState().session!;
        const broadcast = buildBroadcastFromSession(updatedSession, '/host/lobby');

        useMultiplayerStore.setState({
          role: 'spectator',
          mockMode: true,
          roomCode: 'MOCK42',
          playerId: updatedSession.players[0].id,
          playerName: 'TV',
          isConnected: true,
          error: null,
          gameState: broadcast,
        });
        navigate('/tv/display');
        break;
      }
    }
  };
}

// ── Step indicator ───────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current
                ? 'bg-accent-primary text-white'
                : i === current
                  ? 'bg-accent-primary/20 text-accent-primary ring-2 ring-accent-primary'
                  : 'bg-bg-card text-text-muted'
            }`}
          >
            {i < current ? '\u2713' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-0.5 rounded ${i < current ? 'bg-accent-primary' : 'bg-outline-variant/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main gallery component ───────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const launch = useMockLaunch();

  const [selectedRole, setSelectedRole] = useState<MockPersonaRole | null>(null);

  const needsPersona = selectedRole === 'player';
  const totalSteps = needsPersona ? 2 : 1;
  const currentStep = selectedRole === null ? 0 : totalSteps - 1;

  function handleRoleSelect(role: MockPersonaRole) {
    if (role === 'player') {
      setSelectedRole(role);
    } else {
      // Launch immediately for non-player roles
      launch(role, null);
    }
  }

  function handlePersonaSelect(player: typeof MOCK_PLAYERS[number]) {
    const persona: MockPersona = {
      role: 'player',
      playerId: player.id,
      playerName: player.name,
      avatar: player.avatar,
      colour: player.colour,
    };
    launch('player', persona);
  }

  function handleBack() {
    setSelectedRole(null);
  }

  return (
    <div className="min-h-dvh bg-bg-primary pb-12">
      <motion.div
        className="w-full max-w-2xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <motion.button
            onClick={() => (selectedRole ? handleBack() : navigate('/'))}
            className="text-text-muted hover:text-text-primary transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </motion.button>
          <h1 className="font-display text-2xl text-text-primary tracking-tight">Mock Flow Test</h1>
        </div>
        <p className="text-sm text-text-muted mb-6 ml-8">
          {selectedRole === null
            ? 'Choose a role to test the full game flow end-to-end.'
            : 'Choose which player you are.'}
        </p>

        {needsPersona && <StepIndicator current={currentStep} total={totalSteps} />}

        <AnimatePresence mode="wait">
          {/* ── Step 1: Role picker ── */}
          {selectedRole === null && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {ROLE_OPTIONS.map((role) => (
                <motion.button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="w-full text-left rounded-2xl bg-bg-card shadow-soft p-5 border border-transparent hover:border-outline-variant/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: role.colour }}
                    >
                      {role.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-text-primary tracking-wide">{role.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{role.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ── Step 2: Persona picker (player only) ── */}
          {needsPersona && (
            <motion.div
              key="personas"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {MOCK_PLAYERS.map((player) => (
                <motion.button
                  key={player.id}
                  onClick={() => handlePersonaSelect(player)}
                  className="w-full text-center rounded-2xl bg-bg-card shadow-soft p-4 border border-transparent hover:border-outline-variant/20 transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
                    style={{ backgroundColor: player.colour + '22', border: `2px solid ${player.colour}` }}
                  >
                    {player.avatar}
                  </div>
                  <p className="font-display text-sm font-bold text-text-primary">{player.name}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{player.avatar} {player.colour}</p>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
