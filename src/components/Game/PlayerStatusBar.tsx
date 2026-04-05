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
        const isOut = player.isEliminated;
        const isBanked = player.isBanked;
        const hasAnswered = player.hasAnswered;

        return (
          <motion.div
            key={player.id}
            layout
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all duration-300 ${
              isOut
                ? 'bg-neon-pink/5 border-neon-pink/20 opacity-40'
                : isBanked
                  ? 'bg-neon-gold/10 border-neon-gold/30'
                  : hasAnswered && showAnswerStatus
                    ? 'bg-neon-green/10 border-neon-green/30'
                    : 'bg-bg-surface border-white/5'
            }`}
          >
            <span className="text-base">{player.avatar}</span>
            <span
              className={`font-medium ${
                isOut ? 'text-neon-pink line-through' : isBanked ? 'text-neon-gold' : 'text-text-primary'
              }`}
            >
              {player.name}
            </span>
            {showAnswerStatus && !isOut && !isBanked && (
              <span className={`w-2 h-2 rounded-full ${hasAnswered ? 'bg-neon-green' : 'bg-text-muted'}`} />
            )}
            {(isOut || isBanked) && (
              <span className="text-xs text-text-muted">
                R{formatPoints(player.score)}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
