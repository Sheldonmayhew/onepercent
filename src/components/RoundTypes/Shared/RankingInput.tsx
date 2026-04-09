import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';

interface RankingInputProps {
  items: string[];
  criterion: string;
  onSubmit: (order: number[]) => void;
  disabled?: boolean;
}

interface RankItem {
  originalIndex: number;
  text: string;
}

export default function RankingInput({ items, criterion, onSubmit, disabled }: RankingInputProps) {
  const [rankItems, setRankItems] = useState<RankItem[]>(
    items.map((text, originalIndex) => ({ originalIndex, text }))
  );
  const [isLocked, setIsLocked] = useState(false);

  const handleLockIn = () => {
    if (isLocked || disabled) return;
    setIsLocked(true);
    onSubmit(rankItems.map((item) => item.originalIndex));
  };

  return (
    <div className="w-full">
      {isLocked && (
        <div className="flex items-center justify-center mb-4">
          <span className="text-xs text-green-600 font-medium px-3 py-1 rounded-full bg-neon-green/10">
            LOCKED IN
          </span>
        </div>
      )}

      <p className="text-xs text-text-muted mb-3">
        Drag to rank: <span className="text-neon-gold font-medium">{criterion}</span>
      </p>

      <Reorder.Group
        axis="y"
        values={rankItems}
        onReorder={isLocked || disabled ? () => {} : setRankItems}
        className="space-y-2"
      >
        {rankItems.map((item, idx) => (
          <Reorder.Item
            key={item.originalIndex}
            value={item}
            className={`flex items-center py-3.5 px-4 rounded-xl font-medium transition-all ${
              isLocked || disabled
                ? 'bg-bg-elevated text-text-primary cursor-default'
                : 'bg-bg-elevated text-text-primary cursor-grab active:cursor-grabbing hover:bg-bg-deep'
            }`}
            whileDrag={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-container/20 text-neon-cyan text-sm font-bold mr-3 shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1">{item.text}</span>
            {!isLocked && !disabled && (
              <span className="text-text-muted ml-2">⠿</span>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {!isLocked && (
        <motion.button
          onClick={handleLockIn}
          disabled={disabled}
          className="mt-4 w-full py-3 rounded-full font-display text-lg tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          LOCK IN ORDER
        </motion.button>
      )}
    </div>
  );
}
