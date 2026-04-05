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
      if (!question.sequence_items || sequenceOrder.length !== question.sequence_items.length) return;
      setIsLocked(true);
      onSubmit(sequenceOrder.map((i) => i + 1).join(','));
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
      {/* Player indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: playerColour }} />
        <span className="font-display text-lg tracking-wide text-text-primary">{playerName}'s turn</span>
        {isLocked && (
          <span className="ml-auto text-xs text-neon-green font-medium px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20">
            LOCKED IN
          </span>
        )}
      </div>

      {/* Multiple Choice */}
      {(question.type === 'multiple_choice' || question.type === 'image_based') && question.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((option, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleMultipleChoice(idx)}
              disabled={isLocked || disabled}
              className={`relative py-3.5 px-4 rounded-xl text-left font-medium transition-all duration-200 border ${
                selected === idx
                  ? isLocked
                    ? 'bg-neon-cyan/20 border-neon-cyan/60 text-neon-cyan box-glow-cyan'
                    : 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan'
                  : 'bg-bg-elevated border-white/5 text-text-secondary hover:border-white/15 hover:text-text-primary'
              } ${isLocked || disabled ? 'cursor-default' : 'cursor-pointer'}`}
              whileHover={!isLocked && !disabled ? { scale: 1.02 } : {}}
              whileTap={!isLocked && !disabled ? { scale: 0.98 } : {}}
            >
              <span className="text-xs text-text-muted mr-2">{String.fromCharCode(65 + idx)}</span>
              {option}
            </motion.button>
          ))}
        </div>
      )}

      {/* Numeric Input */}
      {question.type === 'numeric_input' && (
        <div className="flex gap-3">
          <input
            type="number"
            value={numericValue}
            onChange={(e) => !isLocked && setNumericValue(e.target.value)}
            disabled={isLocked || disabled}
            placeholder="Type your answer..."
            className="flex-1 py-3 px-4 rounded-xl bg-bg-elevated border border-white/10 text-text-primary text-lg font-score outline-none focus:border-neon-cyan/50 transition-colors disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && handleLockIn()}
          />
        </div>
      )}

      {/* Sequence */}
      {question.type === 'sequence' && question.sequence_items && (
        <div>
          <p className="text-xs text-text-muted mb-3">Tap items in the correct order:</p>
          <div className="flex flex-wrap gap-2">
            {question.sequence_items.map((item, idx) => {
              const orderPos = sequenceOrder.indexOf(idx);
              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSequenceToggle(idx)}
                  disabled={isLocked || disabled}
                  className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                    orderPos >= 0
                      ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan'
                      : 'bg-bg-elevated border-white/5 text-text-secondary hover:border-white/15'
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
          disabled={disabled || (question.type === 'multiple_choice' && selected === null) || (question.type === 'numeric_input' && !numericValue.trim())}
          className="mt-4 w-full py-3 rounded-xl font-display text-lg tracking-wide bg-neon-gold/15 border border-neon-gold/40 text-neon-gold hover:bg-neon-gold/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          LOCK IN
        </motion.button>
      )}
    </div>
  );
}
