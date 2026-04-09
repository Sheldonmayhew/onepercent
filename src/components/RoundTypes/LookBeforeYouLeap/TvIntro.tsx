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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary/95 backdrop-blur-md overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Dark red pulsing vignette */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-red-900/30" />
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

      {/* Icon — heartbeat pulse */}
      <motion.div
        className="text-5xl mb-3"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.15, 1, 1.1, 1] }}
        transition={{
          scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
        }}
      >
        👀
      </motion.div>

      {/* Round name */}
      <motion.h1
        className="font-display text-3xl md:text-5xl font-bold text-red-500 tracking-wider mb-2 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14, delay: 0.6 }}
      >
        {roundName || 'LOOK BEFORE YOU LEAP'}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-text-secondary text-lg mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        {tagline || 'Risk it for a bigger reward!'}
      </motion.p>

      {/* Difficulty — extra dramatic */}
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
          className="h-full rounded-full bg-red-500"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 3, ease: 'linear', delay: 1.3 }}
        />
      </div>
    </motion.div>
  );
}
