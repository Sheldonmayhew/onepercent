import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvIntroProps } from '../../../roundTypes/types';

export default function TvIntro({ roundIndex, totalRounds, difficulty, points, roundName, tagline }: TvIntroProps) {
  const [visible, setVisible] = useState(true);
  const diffColour = getDifficultyColour(difficulty);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        className="text-text-muted text-sm uppercase tracking-widest mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        Round {roundIndex + 1} of {totalRounds}
      </motion.span>

      {/* Icon with pulse */}
      <motion.div
        className="text-5xl mb-3"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        🎯
      </motion.div>

      {/* Round name */}
      <motion.h1
        className="font-display text-4xl md:text-5xl font-bold text-purple-400 tracking-wider mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.35 }}
      >
        {roundName || 'SWITCHAGORIES'}
      </motion.h1>

      <motion.p
        className="text-text-secondary text-lg mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {tagline || 'Pick your category, own your fate!'}
      </motion.p>

      {/* Difficulty */}
      <motion.h2
        className="font-display text-7xl md:text-8xl font-bold mb-3"
        style={{ color: diffColour }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.5 }}
      >
        {difficulty}%
      </motion.h2>

      <motion.span
        className="font-score text-3xl text-neon-gold mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {formatRands(points)}
      </motion.span>

      {/* Progress bar */}
      <div className="w-56 h-2 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-purple-400"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'linear', delay: 0.9 }}
        />
      </div>
    </motion.div>
  );
}
