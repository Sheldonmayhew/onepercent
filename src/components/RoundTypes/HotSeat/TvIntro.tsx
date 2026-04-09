import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvIntroProps } from '../../../roundTypes/types';

export default function TvIntro({ roundIndex, totalRounds, difficulty, points, roundName, tagline }: TvIntroProps) {
  const [visible, setVisible] = useState(true);
  const diffColour = getDifficultyColour(difficulty);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Spotlight beam */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0.15, 0.25, 0.2] }}
        transition={{ duration: 2, delay: 0.3 }}
      >
        <div className="w-full h-full bg-gradient-to-b from-neon-gold/40 via-neon-gold/10 to-transparent"
          style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }}
        />
      </motion.div>

      {/* Round counter */}
      <motion.span
        className="text-text-muted text-sm uppercase tracking-widest mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Round {roundIndex + 1} of {totalRounds}
      </motion.span>

      {/* Icon */}
      <motion.div
        className="text-5xl mb-3"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
      >
        🔥
      </motion.div>

      {/* Round name */}
      <motion.h1
        className="font-display text-4xl md:text-5xl font-bold text-neon-gold tracking-wider mb-2"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.7 }}
      >
        {roundName || 'HOT SEAT'}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-text-secondary text-lg mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        {tagline || 'All eyes on you!'}
      </motion.p>

      {/* Difficulty */}
      <motion.h2
        className="font-display text-7xl md:text-8xl font-bold mb-3"
        style={{ color: diffColour }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.9 }}
      >
        {difficulty}%
      </motion.h2>

      {/* Points */}
      <motion.span
        className="font-score text-3xl text-neon-gold mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        {formatRands(points)}
      </motion.span>

      {/* Progress bar */}
      <div className="w-56 h-2 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-neon-gold"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 3, ease: 'linear', delay: 1.3 }}
        />
      </div>
    </motion.div>
  );
}
