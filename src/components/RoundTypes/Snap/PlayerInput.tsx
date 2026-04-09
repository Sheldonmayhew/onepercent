import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BuzzButton from '../Shared/BuzzButton';

export default function PlayerInput({ question, onSubmit, onBuzzIn, playerId, players: _players, roundState, allAnswersIn }: any) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasBuzzed, setHasBuzzed] = useState(false);

  const revealedOptions: number[] = roundState?.revealedOptions ?? [];

  const handleOptionSelect = (idx: number) => {
    if (hasBuzzed || allAnswersIn) return;
    setSelectedOption(idx);
  };

  const handleBuzz = (timestamp: number) => {
    if (selectedOption === null || hasBuzzed) return;
    setHasBuzzed(true);
    onBuzzIn?.(playerId, timestamp, selectedOption);
    onSubmit(playerId, selectedOption);
  };

  return (
    <div className="w-full">
      {/* Revealed options */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <AnimatePresence>
          {question.options &&
            revealedOptions.map((optIdx: number) => {
              const option = question.options[optIdx];
              if (!option) return null;
              const isSelected = selectedOption === optIdx;

              return (
                <motion.button
                  key={optIdx}
                  onClick={() => handleOptionSelect(optIdx)}
                  disabled={hasBuzzed || allAnswersIn}
                  className={`relative flex items-center py-3.5 px-4 rounded-full text-left font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-neon-cyan text-white shadow-primary'
                      : 'bg-bg-elevated text-text-primary hover:bg-bg-deep'
                  } ${hasBuzzed || allAnswersIn ? 'cursor-default' : 'cursor-pointer'}`}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  whileTap={!hasBuzzed && !allAnswersIn ? { scale: 0.98 } : {}}
                >
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-primary-container/20 text-neon-cyan'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {isSelected && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 shrink-0 ml-3">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </motion.button>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Buzz button */}
      {!hasBuzzed && selectedOption !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        >
          <BuzzButton
            onBuzz={handleBuzz}
            disabled={allAnswersIn}
            label="SNAP!"
            color="from-amber-500 to-orange-500"
          />
        </motion.div>
      )}

      {hasBuzzed && (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-neon-green font-display text-lg tracking-wide">SNAPPED!</span>
        </motion.div>
      )}
    </div>
  );
}
