import { motion } from 'framer-motion';
import type { BroadcastRound } from '../../stores/multiplayerStore';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { formatRands } from '../../utils/helpers';

interface TvRevealAnswerProps {
  lastRound: BroadcastRound | null;
  reveal: NonNullable<GameBroadcast['reveal']>;
  points: number;
}

export default function TvRevealAnswer({ lastRound, reveal, points }: TvRevealAnswerProps) {
  return (
    <motion.div
      key="answer-card"
      className="bg-bg-card shadow-soft rounded-3xl p-8 lg:p-10 flex flex-col items-center gap-4"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
    >
      {/* Question text (compact) */}
      {lastRound && (
        <p className="text-text-muted text-center text-sm max-w-2xl leading-relaxed mb-2">
          {lastRound.question.question}
        </p>
      )}

      <span className="text-sm text-text-muted tracking-[0.2em] uppercase">
        Correct Answer
      </span>
      <motion.h2
        className="text-5xl lg:text-6xl font-display font-bold text-neon-green text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 15 }}
      >
        {reveal.correctAnswer}
      </motion.h2>
      {reveal.explanation && (
        <motion.p
          className="text-lg text-text-secondary text-center leading-relaxed max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {reveal.explanation}
        </motion.p>
      )}
      <span className="font-score text-xl text-neon-gold">
        Worth {formatRands(points)}
      </span>
    </motion.div>
  );
}
