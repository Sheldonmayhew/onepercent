import { motion } from 'framer-motion';
import type { Player } from '../../types';
import { formatPoints } from '../../utils/helpers';

interface PlayerStatusBarProps {
  players: Player[];
  showAnswerStatus?: boolean;
}

export default function PlayerStatusBar({ players, showAnswerStatus = false }: PlayerStatusBarProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {players.map((player) => {
        const hasAnswered = player.hasAnswered;

        return (
          <motion.div
            key={player.id}
            layout
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all duration-300 ${
              hasAnswered && showAnswerStatus
                ? 'bg-neon-green/10'
                : 'bg-bg-card shadow-soft'
            }`}
          >
            <span className="text-base">{player.avatar}</span>
            <span className="font-medium text-text-primary">
              {player.name}
              {player.isHost && <span className="ml-1 text-xs">👑</span>}
            </span>
            {showAnswerStatus && (
              <span className={`w-2 h-2 rounded-full ${hasAnswered ? 'bg-neon-green' : 'bg-text-muted'}`} />
            )}
            <span className="text-xs text-text-muted">
              R{formatPoints(player.score)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
