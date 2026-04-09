import { useState } from 'react';
import { motion } from 'framer-motion';

interface CategoryPickerProps {
  categories: string[];
  onPick: (category: string) => void;
  disabled?: boolean;
}

const CATEGORY_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
];

export default function CategoryPicker({ categories, onPick, disabled }: CategoryPickerProps) {
  const [picked, setPicked] = useState<string | null>(null);

  const handlePick = (category: string) => {
    if (picked || disabled) return;
    setPicked(category);
    onPick(category);
  };

  return (
    <div className="w-full">
      <p className="text-sm text-neon-gold font-display tracking-wide text-center mb-4">
        PICK YOUR CATEGORY
      </p>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((category, idx) => {
          const isPicked = picked === category;
          const gradient = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

          return (
            <motion.button
              key={category}
              onClick={() => handlePick(category)}
              disabled={!!picked || disabled}
              className={`py-6 px-4 rounded-xl font-display text-lg text-white text-center transition-all ${
                isPicked
                  ? `bg-gradient-to-br ${gradient} ring-2 ring-white/30 shadow-lg`
                  : picked
                  ? 'bg-bg-elevated text-text-muted opacity-40 cursor-default'
                  : `bg-gradient-to-br ${gradient} opacity-80 hover:opacity-100 cursor-pointer`
              }`}
              whileHover={!picked && !disabled ? { scale: 1.05 } : {}}
              whileTap={!picked && !disabled ? { scale: 0.95 } : {}}
              animate={isPicked ? { scale: [1, 1.1, 1] } : {}}
            >
              {category}
            </motion.button>
          );
        })}
      </div>

      {picked && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-neon-green mt-4 font-medium"
        >
          Locked in: {picked}
        </motion.p>
      )}
    </div>
  );
}
