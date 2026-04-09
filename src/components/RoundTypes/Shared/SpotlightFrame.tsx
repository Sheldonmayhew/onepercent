import { motion } from 'framer-motion';
import type { Player } from '../../../types';

interface SpotlightFrameProps {
  player: Player;
  isActive: boolean;
  children: React.ReactNode;
}

export default function SpotlightFrame({ player, isActive, children }: SpotlightFrameProps) {
  if (!isActive) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 opacity-60">
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-center"
        >
          <span className="text-5xl mb-3 block">{player.avatar}</span>
          <p className="text-text-muted font-medium">Waiting for your turn...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <div className="flex flex-col items-center mb-6">
        <motion.div
          animate={{ boxShadow: ['0 0 20px rgba(253,212,4,0.3)', '0 0 40px rgba(253,212,4,0.6)', '0 0 20px rgba(253,212,4,0.3)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-full bg-bg-elevated flex items-center justify-center mb-3"
        >
          <span className="text-4xl">{player.avatar}</span>
        </motion.div>
        <p className="font-display text-lg text-neon-gold tracking-wide">
          {player.name}&apos;s Turn
        </p>
      </div>
      {children}
    </motion.div>
  );
}
