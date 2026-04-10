import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { PlayerInputProps } from '../../../roundTypes/types';
import type { LookBeforeYouLeapState } from '../../../roundTypes/definitions/lookBeforeYouLeap';
import { useBottomNav } from '../../Game/BottomNavContext';

const MULTIPLIERS = ['3x', '2x', '1.5x', '1x'];

export default function PlayerInput({
  question,
  onSubmit,
  onBuzzIn,
  playerId,
  allAnswersIn,
  roundState,
}: PlayerInputProps<LookBeforeYouLeapState>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const bottomNav = useBottomNav();

  const revealChunks: string[] = question.reveal_chunks ?? [];
  const revealedCount: number = roundState?.revealedChunks ?? 1;
  const visibleText = revealChunks.slice(0, revealedCount).join(' ');

  // Determine current multiplier based on reveal progress
  const totalChunks = Math.max(revealChunks.length, 1);
  const multiplierIndex = Math.min(
    Math.floor((revealedCount / totalChunks) * MULTIPLIERS.length),
    MULTIPLIERS.length - 1,
  );
  const currentMultiplier = MULTIPLIERS[multiplierIndex];

  const handleSelect = (idx: number) => {
    if (isLocked || allAnswersIn) return;
    setSelected(idx);
  };

  const handleBuzz = useCallback(() => {
    if (selected === null || hasBuzzed) return;
    const timestamp = Date.now();
    setHasBuzzed(true);
    setIsLocked(true);
    onBuzzIn?.(playerId, timestamp, selected);
    onSubmit(playerId, selected);
  }, [selected, hasBuzzed, playerId, onBuzzIn, onSubmit]);

  // Register CTA state in bottom nav when present
  useEffect(() => {
    bottomNav?.setCTAState({
      canLockIn: selected !== null && !hasBuzzed && !allAnswersIn,
      isLocked: hasBuzzed,
      lockIn: handleBuzz,
      label: 'BUZZ IN & LOCK',
      lockedLabel: `LOCKED IN at ${currentMultiplier}`,
    });
  }, [selected, hasBuzzed, allAnswersIn, handleBuzz, currentMultiplier, bottomNav]);

  return (
    <div className="w-full space-y-4">
      {/* Revealed question text */}
      <div className="bg-bg-card rounded-2xl p-5">
        <p className="text-lg font-medium text-text-primary leading-relaxed min-h-[3rem]">
          {visibleText || '...'}
          {revealedCount < totalChunks && (
            <motion.span
              className="inline-block ml-1 text-text-muted"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              ...
            </motion.span>
          )}
        </p>
      </div>

      {/* Multiplier indicator */}
      <motion.div
        className="flex items-center justify-center gap-2 py-2"
        key={currentMultiplier}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
      >
        <span className="text-sm text-text-muted">Current bonus:</span>
        <span className={`font-score text-2xl font-bold ${
          multiplierIndex === 0 ? 'text-neon-gold' :
          multiplierIndex === 1 ? 'text-neon-green' :
          multiplierIndex === 2 ? 'text-neon-cyan' :
          'text-text-secondary'
        }`}>
          {currentMultiplier}
        </span>
      </motion.div>

      {/* MC options */}
      {question.options && (
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, idx) => {
            const isSelected = selected === idx;
            return (
              <motion.button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isLocked || allAnswersIn}
                className={`relative flex items-center py-3.5 px-4 rounded-full text-left font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-neon-cyan text-white shadow-primary'
                    : 'bg-bg-elevated text-text-primary hover:bg-bg-deep'
                } ${isLocked || allAnswersIn ? 'cursor-default' : 'cursor-pointer'}`}
                whileHover={!isLocked && !allAnswersIn ? { scale: 1.02 } : {}}
                whileTap={!isLocked && !allAnswersIn ? { scale: 0.98 } : {}}
              >
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-primary-container/20 text-neon-cyan'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{option}</span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Locked-in text shown only when bottom nav not managing CTA */}
      {hasBuzzed && !(bottomNav?.externalCTA) && (
        <motion.div
          className="text-center py-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-neon-green font-display tracking-wider">LOCKED IN at {currentMultiplier}</span>
        </motion.div>
      )}
    </div>
  );
}
