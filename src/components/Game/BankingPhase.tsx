import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { useSound } from '../../hooks/useSound';
import { formatRands, getDifficultyColour } from '../../utils/helpers';

export default function BankingPhase() {
  const {
    session,
    recordBankingDecision,
    setScreen,
    getCurrentDifficulty,
    getCurrentPoints,
  } = useGameStore();
  const { play } = useSound();

  const isMultiplayer = !!useMultiplayerStore((s) => s.roomCode);

  if (!session) return null;

  const activePlayers = session.players.filter((p) => !p.isEliminated && !p.isBanked);
  const difficulty = getCurrentDifficulty();
  const points = getCurrentPoints();
  const diffColour = getDifficultyColour(difficulty);

  if (isMultiplayer) {
    return (
      <MultiplayerBanking
        session={session}
        activePlayers={activePlayers}
        difficulty={difficulty}
        points={points}
        diffColour={diffColour}
      />
    );
  }

  return (
    <LocalBanking
      activePlayers={activePlayers}
      difficulty={difficulty}
      points={points}
      diffColour={diffColour}
      recordBankingDecision={recordBankingDecision}
      setScreen={setScreen}
      play={play}
    />
  );
}

// ─── Multiplayer: host waits for all remote decisions ───────────────

function MultiplayerBanking({
  session,
  activePlayers,
  difficulty,
  points,
  diffColour,
}: {
  session: NonNullable<ReturnType<typeof useGameStore.getState>['session']>;
  activePlayers: ReturnType<typeof useGameStore.getState>['getActivePlayers'] extends () => infer R ? R : never;
  difficulty: number;
  points: number;
  diffColour: string;
}) {
  const { setScreen } = useGameStore();
  const decidedCount = Object.keys(session.bankingDecisions).length;
  const totalCount = activePlayers.length;

  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-gold/5 blur-[100px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setScreen('results')}
            className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1"
          >
            End Game
          </button>
        </div>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <h1 className="font-display text-4xl text-neon-gold glow-gold tracking-wide mb-2">BANKING TIME</h1>
          <p className="text-text-secondary">
            Next question is{' '}
            <span className="font-bold" style={{ color: diffColour }}>
              {difficulty}%
            </span>{' '}
            — worth <span className="font-score text-neon-gold">{formatRands(points)}</span>
          </p>
        </motion.div>

        {/* Waiting card */}
        <div className="bg-bg-surface/80 backdrop-blur border border-white/5 rounded-2xl p-6 md:p-8 mb-6">
          <div className="w-10 h-10 border-2 border-neon-gold border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="text-text-secondary text-lg mb-1">Waiting for players to decide...</p>
          <p className="font-score text-2xl text-neon-gold font-bold">
            {decidedCount} / {totalCount}
          </p>

          {/* Per-player status */}
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {activePlayers.map((p) => {
              const hasDecided = session.bankingDecisions[p.id] !== undefined;
              return (
                <span
                  key={p.id}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm transition-all ${
                    hasDecided
                      ? 'bg-neon-green/10 text-neon-green'
                      : 'bg-bg-elevated text-text-muted'
                  }`}
                >
                  {p.avatar} {hasDecided ? '✓' : '...'}
                </span>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Local pass-and-play: sequential per-player decisions ───────────

function LocalBanking({
  activePlayers,
  difficulty,
  points,
  diffColour,
  recordBankingDecision,
  setScreen,
  play,
}: {
  activePlayers: ReturnType<typeof useGameStore.getState>['getActivePlayers'] extends () => infer R ? R : never;
  difficulty: number;
  points: number;
  diffColour: string;
  recordBankingDecision: (playerId: string, banked: boolean) => void;
  setScreen: (screen: import('../../types').GameScreen) => void;
  play: (sound: 'tick' | 'correct' | 'wrong' | 'eliminate' | 'bank' | 'reveal' | 'fanfare' | 'countdown') => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentPlayer = activePlayers[currentIdx];

  const handleBank = () => {
    if (!currentPlayer) return;
    play('bank');
    recordBankingDecision(currentPlayer.id, true);
    advance();
  };

  const handleContinue = () => {
    if (!currentPlayer) return;
    recordBankingDecision(currentPlayer.id, false);
    advance();
  };

  const advance = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= activePlayers.length) {
      // recordBankingDecision handles the transition to 'playing' when all
      // decisions are in — but for local mode the last call above will
      // trigger it. Nothing else needed here.
      return;
    }
    setCurrentIdx(nextIdx);
  };

  if (!currentPlayer) {
    // Safety fallback — should not normally reach here
    setScreen('playing');
    return null;
  }

  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-gold/5 blur-[100px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setScreen('results')}
            className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1"
          >
            End Game
          </button>
        </div>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <h1 className="font-display text-4xl text-neon-gold glow-gold tracking-wide mb-2">BANKING TIME</h1>
          <p className="text-text-secondary">
            Next question is{' '}
            <span className="font-bold" style={{ color: diffColour }}>
              {difficulty}%
            </span>{' '}
            — worth <span className="font-score text-neon-gold">{formatRands(points)}</span>
          </p>
        </motion.div>

        {/* Current Player Decision */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPlayer.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-bg-surface/80 backdrop-blur border border-white/5 rounded-2xl p-6 md:p-8 mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl">{currentPlayer.avatar}</span>
              <span
                className="font-display text-2xl tracking-wide"
                style={{ color: currentPlayer.colour }}
              >
                {currentPlayer.name}
              </span>
            </div>

            <div className="bg-bg-elevated rounded-xl p-4 mb-6">
              <span className="text-xs text-text-muted block mb-1">Current Score</span>
              <span className="font-score text-3xl text-neon-gold font-bold">
                {formatRands(currentPlayer.score)}
              </span>
            </div>

            <p className="text-text-secondary mb-6 text-sm">
              Bank now to keep your {formatRands(currentPlayer.score)}, or risk it on the next question?
            </p>

            <div className="flex gap-3">
              <motion.button
                onClick={handleBank}
                className="flex-1 py-3.5 rounded-xl font-display text-lg tracking-wide bg-neon-gold/15 border border-neon-gold/40 text-neon-gold hover:bg-neon-gold/25 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                BANK IT
              </motion.button>
              <motion.button
                onClick={handleContinue}
                className="flex-1 py-3.5 rounded-xl font-display text-lg tracking-wide bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/25 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                RISK IT
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress through players */}
        <div className="flex gap-2 justify-center">
          {activePlayers.map((p, i) => (
            <div
              key={p.id}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < currentIdx ? 'bg-neon-gold' : i === currentIdx ? 'bg-neon-cyan scale-125' : 'bg-bg-elevated'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
