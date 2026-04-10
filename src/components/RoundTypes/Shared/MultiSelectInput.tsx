import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBottomNav } from '../../Game/BottomNavContext';

interface MultiSelectInputProps {
  options: string[];
  onSubmit: (selectedIndices: number[]) => void;
  disabled?: boolean;
  maxSelections?: number;
}

export default function MultiSelectInput({ options, onSubmit, disabled, maxSelections }: MultiSelectInputProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isLocked, setIsLocked] = useState(false);
  const bottomNav = useBottomNav();

  const toggleOption = (index: number) => {
    if (isLocked || disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (maxSelections && next.size >= maxSelections) return prev;
        next.add(index);
      }
      return next;
    });
  };

  const handleLockIn = useCallback(() => {
    if (isLocked || disabled || selected.size === 0) return;
    setIsLocked(true);
    onSubmit([...selected].sort((a, b) => a - b));
  }, [isLocked, disabled, selected, onSubmit]);

  // Register CTA state in bottom nav when present
  useEffect(() => {
    bottomNav?.setCTAState({
      canLockIn: !isLocked && !disabled && selected.size > 0,
      isLocked,
      lockIn: handleLockIn,
      label: `LOCK IN (${selected.size} selected)`,
      lockedLabel: 'LOCKED IN',
    });
  }, [selected.size, isLocked, disabled, handleLockIn, bottomNav]);

  const hideButton = bottomNav?.externalCTA ?? false;

  return (
    <div className="w-full">
      {isLocked && !hideButton && (
        <div className="flex items-center justify-center mb-4">
          <span className="text-xs text-green-600 font-medium px-3 py-1 rounded-full bg-neon-green/10">
            LOCKED IN
          </span>
        </div>
      )}

      <p className="text-xs text-text-muted mb-3">
        Select all correct answers{maxSelections ? ` (max ${maxSelections})` : ''}:
      </p>

      <div className="grid grid-cols-1 gap-3">
        {options.map((option, idx) => {
          const isSelected = selected.has(idx);
          return (
            <motion.button
              key={idx}
              onClick={() => toggleOption(idx)}
              disabled={isLocked || disabled}
              className={`relative flex items-center py-3.5 px-4 rounded-full text-left font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-neon-cyan text-white shadow-primary'
                  : 'bg-bg-elevated text-text-primary hover:bg-bg-deep'
              } ${isLocked || disabled ? 'cursor-default' : 'cursor-pointer'}`}
              whileHover={!isLocked && !disabled ? { scale: 1.02 } : {}}
              whileTap={!isLocked && !disabled ? { scale: 0.98 } : {}}
            >
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 shrink-0 ${
                isSelected ? 'bg-white/20 text-white' : 'bg-primary-container/20 text-neon-cyan'
              }`}>{String.fromCharCode(65 + idx)}</span>
              <span className="flex-1">{option}</span>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ml-3 ${
                isSelected ? 'bg-white/20' : 'bg-outline-variant/30'
              }`}>
                {isSelected && (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {!isLocked && !hideButton && (
        <motion.button
          onClick={handleLockIn}
          disabled={disabled || selected.size === 0}
          className="mt-4 w-full py-3 rounded-full font-display text-lg tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          LOCK IN ({selected.size} selected)
        </motion.button>
      )}
    </div>
  );
}
