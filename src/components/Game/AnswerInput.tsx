import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Question } from '../../types';

interface AnswerInputProps {
  question: Question;
  onSubmit: (answer: string | number) => void;
  disabled?: boolean;
  playerName: string;
  playerColour: string;
}

export default function AnswerInput({ question, onSubmit, disabled, playerName, playerColour }: AnswerInputProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [numericValue, setNumericValue] = useState('');
  const [sequenceOrder, setSequenceOrder] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const handleMultipleChoice = (index: number) => {
    if (isLocked || disabled) return;
    setSelected(index);
  };

  const handleLockIn = () => {
    if (isLocked || disabled) return;

    if (question.type === 'multiple_choice' || question.type === 'image_based') {
      if (selected === null) return;
      setIsLocked(true);
      onSubmit(selected);
    } else if (question.type === 'numeric_input') {
      if (!numericValue.trim()) return;
      setIsLocked(true);
      onSubmit(Number(numericValue));
    } else if (question.type === 'sequence') {
      const items = question.sequence_items ?? question.options;
      if (!items || sequenceOrder.length !== items.length) return;
      setIsLocked(true);
      onSubmit(sequenceOrder.join(','));
    }
  };

  const handleSequenceToggle = (index: number) => {
    if (isLocked || disabled) return;
    setSequenceOrder((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  return (
    <div className="w-full">
      {/* Locked-in indicator */}
      {isLocked && (
        <div className="flex items-center justify-center mb-4">
          <span className="text-xs text-green-600 font-medium px-3 py-1 rounded-full bg-neon-green/10">
            LOCKED IN
          </span>
        </div>
      )}

      {/* Multiple Choice */}
      {(question.type === 'multiple_choice' || question.type === 'image_based') && question.options && (
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, idx) => {
            const isSelected = selected === idx;
            return (
              <motion.button
                key={idx}
                onClick={() => handleMultipleChoice(idx)}
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
      )}

      {/* Numeric Input */}
      {question.type === 'numeric_input' && (
        <div className="flex gap-3">
          <input
            type="number"
            inputMode="numeric"
            value={numericValue}
            onChange={(e) => !isLocked && setNumericValue(e.target.value)}
            disabled={isLocked || disabled}
            placeholder="Type your answer..."
            className="flex-1 py-3 px-4 rounded-xl bg-bg-card text-text-primary text-lg font-score outline-none focus:ring-2 focus:ring-neon-cyan/20 transition-colors disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && handleLockIn()}
          />
        </div>
      )}

      {/* Sequence */}
      {question.type === 'sequence' && (question.sequence_items ?? question.options) && (
        <div>
          <p className="text-xs text-text-muted mb-3">Tap items in the correct order:</p>
          <div className="flex flex-wrap gap-2">
            {(question.sequence_items ?? question.options)!.map((item, idx) => {
              const orderPos = sequenceOrder.indexOf(idx);
              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSequenceToggle(idx)}
                  disabled={isLocked || disabled}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    orderPos >= 0
                      ? 'bg-bg-elevated text-neon-cyan'
                      : 'bg-bg-surface text-text-secondary hover:bg-bg-elevated'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {orderPos >= 0 && <span className="text-xs mr-1.5 text-neon-gold">{orderPos + 1}.</span>}
                  {item}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lock In Button */}
      {!isLocked && (
        <motion.button
          onClick={handleLockIn}
          disabled={disabled || (question.type === 'multiple_choice' && selected === null) || (question.type === 'numeric_input' && !numericValue.trim()) || (question.type === 'sequence' && sequenceOrder.length !== (question.sequence_items ?? question.options ?? []).length)}
          className="mt-4 w-full py-3 rounded-full font-display text-lg tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          LOCK IN
        </motion.button>
      )}
    </div>
  );
}
