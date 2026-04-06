import { motion } from 'framer-motion';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { formatRands, getDifficultyColour } from '../../utils/helpers';

interface TvRoundIntroProps {
  gameState: GameBroadcast;
}

export default function TvRoundIntro({ gameState }: TvRoundIntroProps) {
  const round = gameState.round;
  const roundIndex = round?.index ?? 0;
  const totalRounds = round?.totalRounds ?? 11;
  const difficulty = round?.difficulty ?? 90;
  const points = round?.points ?? 0;
  const diffColour = getDifficultyColour(difficulty);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      >
        <motion.span
          className="text-text-muted text-xl uppercase tracking-[0.2em] block mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Round {roundIndex + 1} of {totalRounds}
        </motion.span>

        <motion.h1
          className="font-display text-[10rem] lg:text-[12rem] font-bold leading-none mb-4"
          style={{ color: diffColour }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
        >
          {difficulty}%
        </motion.h1>

        <motion.span
          className="font-score text-4xl text-neon-gold block mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {formatRands(points)}
        </motion.span>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-bg-elevated rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: diffColour }}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
