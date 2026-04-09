import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvIntroProps } from '../../../roundTypes/types';

export default function TvIntro({ roundIndex, totalRounds, difficulty, points, roundName, tagline }: TvIntroProps) {
  const [visible, setVisible] = useState(true);
  const diffColour = getDifficultyColour(difficulty);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/98 backdrop-blur-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Red pulsing vignette */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(220,38,38,0.3) 100%)',
          }}
        />
      </motion.div>

      {/* Fire flicker effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        <div className="w-full h-full bg-gradient-to-t from-red-600/40 via-orange-500/10 to-transparent" />
      </motion.div>

      {/* Round counter */}
      <motion.span
        className="text-text-muted text-sm uppercase tracking-widest mb-4 relative z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Round {roundIndex + 1} of {totalRounds}
      </motion.span>

      {/* Icon */}
      <motion.div
        className="text-6xl mb-3 relative z-10"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: [0, 1.3, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.2, delay: 0.5 }}
      >
        💀
      </motion.div>

      {/* Round name — slow zoom */}
      <motion.h1
        className="font-display text-4xl md:text-6xl font-bold text-red-500 tracking-wider mb-2 text-center relative z-10"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 12, delay: 0.8 }}
      >
        {roundName || 'FINAL ROUND'}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-text-secondary text-lg mb-8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      >
        {tagline || 'One wrong and you\'re OUT!'}
      </motion.p>

      {/* Difficulty — maximum drama */}
      <motion.h2
        className="font-display text-8xl md:text-9xl font-bold mb-3 relative z-10"
        style={{ color: diffColour }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.2, 1], opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.0, ease: 'easeOut' }}
      >
        {difficulty}%
      </motion.h2>

      {/* Points */}
      <motion.span
        className="font-score text-4xl text-neon-gold mb-8 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        {formatRands(points)}
      </motion.span>

      {/* Progress bar */}
      <div className="w-56 h-2 bg-bg-elevated rounded-full overflow-hidden relative z-10">
        <motion.div
          className="h-full rounded-full bg-red-500"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 3.5, ease: 'linear', delay: 1.6 }}
        />
      </div>
    </motion.div>
  );
}
