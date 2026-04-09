import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoundDefinition } from '../../../roundTypes/registry';
import { formatPoints, getDifficultyColour } from '../../../utils/helpers';
import { ROUND_TYPE_SEQUENCE } from '../../../roundTypes/sequence';
import { DIFFICULTY_TIERS, POINTS_PER_ROUND } from '../../../types';
import type { BroadcastPlayer } from '../../../stores/multiplayerStore';
import DifficultyMeter from './DifficultyMeter';

interface RoundTransitionProps {
  roundIndex: number;             // Just-completed round (0-based)
  players: BroadcastPlayer[];
  scoreUpdates?: { playerId: string; delta: number }[];
  onComplete: () => void;         // Called when transition finishes
}

type Phase = 'complete' | 'scores' | 'difficulty' | 'preview' | 'done';

const PHASE_TIMING: Record<Phase, number> = {
  complete: 2000,
  scores: 4000,
  difficulty: 2000,
  preview: 3000,
  done: 0,
};

export default function RoundTransition({
  roundIndex,
  players,
  scoreUpdates,
  onComplete,
}: RoundTransitionProps) {
  const [phase, setPhase] = useState<Phase>('complete');
  // Stable ref so the effect never needs to re-run if the parent re-renders
  // with a new inline callback reference (advanced-use-latest)
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  const completedDef = getRoundDefinition(ROUND_TYPE_SEQUENCE[roundIndex]);
  const nextRoundIndex = roundIndex + 1;
  const hasNext = nextRoundIndex < ROUND_TYPE_SEQUENCE.length;
  const nextDef = hasNext ? getRoundDefinition(ROUND_TYPE_SEQUENCE[nextRoundIndex]) : null;

  // Find MVP (highest delta this round)
  const mvp = scoreUpdates?.length
    ? scoreUpdates.reduce((best, u) => (u.delta > best.delta ? u : best), scoreUpdates[0])
    : null;
  const mvpPlayer = mvp ? players.find((p) => p.id === mvp.playerId) : null;

  // Sorted leaderboard
  const sorted = [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    const sequence: Phase[] = ['complete', 'scores', 'difficulty', 'preview'];
    let current = 0;
    let timer: ReturnType<typeof setTimeout>;

    function advance() {
      current++;
      if (current >= sequence.length) {
        onCompleteRef.current();
        return;
      }
      setPhase(sequence[current]);
      timer = setTimeout(advance, PHASE_TIMING[sequence[current]]);
    }

    timer = setTimeout(advance, PHASE_TIMING[sequence[0]]);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {/* Phase 1: Round Complete */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <p className="text-lg font-display tracking-[0.3em] text-white/50 mb-2">
              ROUND {roundIndex + 1}
            </p>
            <h1
              className="text-6xl font-display font-bold tracking-wide"
              style={{ color: completedDef.theme.primary }}
            >
              COMPLETE
            </h1>
            <p className="text-2xl mt-3 text-white/70">{completedDef.theme.icon} {completedDef.name}</p>
          </motion.div>
        )}

        {/* Phase 2: Score Summary */}
        {phase === 'scores' && (
          <motion.div
            key="scores"
            className="w-full max-w-lg px-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {mvpPlayer && (
              <motion.div
                className="text-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 300 }}
              >
                <p className="text-xs font-display tracking-[0.3em] text-neon-cyan mb-1">
                  ROUND MVP
                </p>
                <p className="text-3xl">
                  {mvpPlayer.avatar} {mvpPlayer.name}
                </p>
                <p className="text-xl font-bold text-green-400 mt-1">
                  +{formatPoints(mvp!.delta)}
                </p>
              </motion.div>
            )}

            <div className="space-y-2">
              {sorted.map((player, i) => {
                const update = scoreUpdates?.find((u) => u.playerId === player.id);
                return (
                  <motion.div
                    key={player.id}
                    className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <span className="w-6 text-center text-sm font-bold text-white/40">
                      {i + 1}
                    </span>
                    <span className="text-lg">{player.avatar}</span>
                    <span className="flex-1 text-sm text-white">{player.name}</span>
                    {update && (
                      <span
                        className={`text-sm font-bold ${
                          update.delta >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {update.delta >= 0 ? '+' : ''}
                        {formatPoints(update.delta)}
                      </span>
                    )}
                    <span className="text-sm font-display font-bold text-white w-20 text-right">
                      {formatPoints(player.score)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Phase 3: Difficulty Meter */}
        {phase === 'difficulty' && (
          <motion.div
            key="difficulty"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-sm font-display tracking-[0.2em] text-white/50 mb-6">
              PROGRESS
            </p>
            <DifficultyMeter currentRound={nextRoundIndex} />
          </motion.div>
        )}

        {/* Phase 4: Next Round Preview */}
        {phase === 'preview' && nextDef && (
          <motion.div
            key="preview"
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <p className="text-sm font-display tracking-[0.3em] text-white/40 mb-2">
              NEXT UP
            </p>
            <p className="text-5xl mb-3">{nextDef.theme.icon}</p>
            <h2
              className="text-4xl font-display font-bold tracking-wide mb-2"
              style={{ color: nextDef.theme.primary }}
            >
              {nextDef.name}
            </h2>
            <p className="text-lg text-white/60 mb-4">{nextDef.tagline}</p>
            <p className="text-sm font-display text-white/40">
              <span
                className="font-bold"
                style={{ color: getDifficultyColour(DIFFICULTY_TIERS[nextRoundIndex]) }}
              >
                {DIFFICULTY_TIERS[nextRoundIndex]}%
              </span>
              {' '}&middot;{' '}
              <span className="text-neon-cyan">
                {formatPoints(POINTS_PER_ROUND[DIFFICULTY_TIERS[nextRoundIndex]])} pts
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
