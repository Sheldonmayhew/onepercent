import { motion } from 'framer-motion';
import type { BroadcastRound } from '../../stores/multiplayerStore';

interface TvRevealQuestionProps {
  lastRound: BroadcastRound | null;
}

export default function TvRevealQuestion({ lastRound }: TvRevealQuestionProps) {
  if (!lastRound) {
    return (
      <motion.div
        key="question-loading"
        className="flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.p
          className="text-text-muted text-xl"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          Revealing answer...
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="question-recap"
      className="flex flex-col items-center gap-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
    >
      {lastRound.categoryName && (
        <span className="inline-block px-4 py-1.5 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider">
          {lastRound.categoryName}
        </span>
      )}
      <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-snug text-center max-w-3xl">
        {lastRound.question.question}
      </h2>
      {lastRound.question.image_url && (
        <img
          src={lastRound.question.image_url}
          alt="Question visual"
          className="rounded-2xl max-h-56 object-contain"
        />
      )}

      {/* Options reminder */}
      {lastRound.question.options && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
          {lastRound.question.options.map((option, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-bg-card shadow-soft rounded-xl px-5 py-3"
            >
              <span className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center font-display text-sm text-text-secondary font-bold">
                {['A', 'B', 'C', 'D', 'E', 'F'][i]}
              </span>
              <span className="text-text-primary font-medium">{option}</span>
            </div>
          ))}
        </div>
      )}

      <motion.p
        className="text-text-muted text-lg mt-4"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      >
        Revealing answer...
      </motion.p>
    </motion.div>
  );
}
