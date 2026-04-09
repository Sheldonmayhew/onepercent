import { motion } from 'framer-motion';
import { DIFFICULTY_TIERS } from '../../../types';
import { getDifficultyColour } from '../../../utils/helpers';

interface DifficultyMeterProps {
  currentRound: number; // 0-10
}

export default function DifficultyMeter({ currentRound }: DifficultyMeterProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {DIFFICULTY_TIERS.map((tier, i) => {
        const isCompleted = i < currentRound;
        const isCurrent = i === currentRound;
        const color = getDifficultyColour(tier);

        return (
          <motion.div
            key={tier}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: isCurrent ? 18 : 12,
                height: isCurrent ? 18 : 12,
                backgroundColor: isCompleted || isCurrent ? color : 'rgba(255,255,255,0.15)',
                boxShadow: isCurrent ? `0 0 12px ${color}` : 'none',
              }}
              animate={
                isCurrent
                  ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }
                  : {}
              }
              transition={
                isCurrent
                  ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                  : {}
              }
            />
            <span
              className="text-[10px] font-display"
              style={{
                color: isCompleted || isCurrent ? color : 'rgba(255,255,255,0.3)',
              }}
            >
              {tier}%
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
