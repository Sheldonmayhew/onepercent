import { motion } from 'framer-motion';
import type { Question } from '../../types';
import { getDifficultyColour, getDifficultyLabel, formatRands } from '../../utils/helpers';

interface QuestionDisplayProps {
  question: Question;
  roundIndex: number;
  difficulty: number;
  points: number;
  totalRounds: number;
}

export default function QuestionDisplay({
  question,
  roundIndex,
  difficulty,
  points,
  totalRounds,
}: QuestionDisplayProps) {
  const diffColour = getDifficultyColour(difficulty);

  return (
    <motion.div
      className="w-full text-center"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Round info bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span
            className="font-display text-3xl font-bold"
            style={{ color: diffColour }}
          >
            {getDifficultyLabel(difficulty)}
          </span>
          <span className="text-text-muted text-sm">
            Round {roundIndex + 1} of {totalRounds}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-text-muted block">Worth</span>
          <span className="font-score text-lg text-neon-gold font-bold">{formatRands(points)}</span>
        </div>
      </div>

      {/* Difficulty tier progress dots */}
      <div className="flex gap-1.5 justify-center mb-6">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < roundIndex
                ? 'w-6 bg-neon-green/60'
                : i === roundIndex
                  ? 'w-8'
                  : 'w-4 bg-bg-elevated'
            }`}
            style={i === roundIndex ? { backgroundColor: diffColour } : undefined}
          />
        ))}
      </div>

      {/* Question text */}
      <motion.div
        className="bg-bg-surface/80 backdrop-blur border border-white/5 rounded-2xl p-6 md:p-8"
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <p className="text-xl md:text-2xl font-medium text-text-primary leading-relaxed">
          {question.question}
        </p>
        {question.image_url && (
          <img
            src={question.image_url}
            alt="Question visual"
            className="mt-4 rounded-xl max-h-64 mx-auto object-contain"
          />
        )}
      </motion.div>
    </motion.div>
  );
}
