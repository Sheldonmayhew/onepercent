import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../../types';

interface StealPickerProps {
  opponents: Player[];
  onSteal: (targetId: string) => void;
  disabled?: boolean;
}

export default function StealPicker({ opponents, onSteal, disabled }: StealPickerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSelect = (id: string) => {
    if (isLocked || disabled) return;
    setSelected(id);
  };

  const handleLockIn = () => {
    if (!selected || isLocked || disabled) return;
    setIsLocked(true);
    onSteal(selected);
  };

  return (
    <div className="w-full">
      <p className="text-sm text-neon-pink font-display tracking-wide text-center mb-4">
        STEAL FROM WHO?
      </p>

      <div className="grid grid-cols-2 gap-3">
        {opponents.map((player) => {
          const isSelected = selected === player.id;
          return (
            <motion.button
              key={player.id}
              onClick={() => handleSelect(player.id)}
              disabled={isLocked || disabled}
              className={`flex flex-col items-center py-4 px-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-neon-pink/20 ring-2 ring-neon-pink'
                  : 'bg-bg-elevated hover:bg-bg-deep'
              } ${isLocked || disabled ? 'cursor-default' : 'cursor-pointer'}`}
              whileHover={!isLocked && !disabled ? { scale: 1.03 } : {}}
              whileTap={!isLocked && !disabled ? { scale: 0.97 } : {}}
            >
              <span className="text-3xl mb-2">{player.avatar}</span>
              <span className="text-sm font-medium text-text-primary truncate w-full text-center">
                {player.name}
              </span>
              <span className="text-xs text-text-muted mt-1">
                {player.score.toLocaleString()} pts
              </span>
            </motion.button>
          );
        })}
      </div>

      {!isLocked && (
        <motion.button
          onClick={handleLockIn}
          disabled={disabled || !selected}
          className="mt-4 w-full py-3 rounded-full font-display text-lg tracking-wide bg-gradient-to-r from-neon-pink to-neon-cyan text-white shadow-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          STEAL
        </motion.button>
      )}
    </div>
  );
}
