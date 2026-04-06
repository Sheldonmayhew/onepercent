import { useState } from 'react';
import { motion } from 'framer-motion';

const EMOJI_CATEGORIES = {
  Animals: ['🦁', '🐆', '🦏', '🐘', '🦒', '🦓', '🐊', '🦅', '🐍', '🦈', '🐺', '🦊', '🐻', '🐼', '🦄', '🐲'],
  Faces: ['😎', '🤓', '🥸', '🤠', '🥳', '🤩', '😈', '👻', '💀', '🤖', '👽', '🎃'],
  Objects: ['🔥', '⚡', '💎', '👑', '🎯', '🏆', '🎪', '🚀', '💣', '🎸'],
  Symbols: ['⭐', '💫', '✨', '🌟', '💥', '🎵', '🌈', '💜'],
} as const;

export const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

interface EmojiPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
  takenEmojis?: Set<string>;
}

export default function EmojiPicker({ selected, onSelect, takenEmojis = new Set() }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Animals');
  const categories = Object.keys(EMOJI_CATEGORIES) as (keyof typeof EMOJI_CATEGORIES)[];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-soft p-3">
      {/* Category tabs */}
      <div className="flex gap-1 mb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-indigo-50 text-neon-cyan border border-indigo-300'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => {
          const isTaken = takenEmojis.has(emoji);
          const isSelected = selected === emoji;

          return (
            <motion.button
              key={emoji}
              onClick={() => !isTaken && onSelect(emoji)}
              disabled={isTaken}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-indigo-50 border-2 border-neon-cyan ring-1 ring-indigo-200'
                  : isTaken
                    ? 'opacity-20 cursor-not-allowed'
                    : 'hover:bg-gray-50 cursor-pointer'
              }`}
              whileTap={!isTaken ? { scale: 0.9 } : {}}
            >
              {emoji}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
