import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { formatRands, getDifficultyColour } from '../../utils/helpers';

interface RoundIntroProps {
  roundIndex: number;
  difficulty: number;
  points: number;
  totalRounds: number;
  onComplete: () => void;
}

export default function RoundIntro({ roundIndex, difficulty, points, totalRounds, onComplete }: RoundIntroProps) {
  const [visible, setVisible] = useState(true);
  const diffColour = getDifficultyColour(difficulty);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onCompleteRef.current();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <span className="text-text-muted text-sm uppercase tracking-wider block mb-2">
          Round {roundIndex + 1} of {totalRounds}
        </span>
        <h2 className="font-display text-6xl md:text-7xl font-bold mb-3" style={{ color: diffColour }}>
          {difficulty}%
        </h2>
        <span className="font-score text-2xl text-neon-gold block mb-6">
          {formatRands(points)}
        </span>

        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-bg-elevated rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: diffColour }}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
