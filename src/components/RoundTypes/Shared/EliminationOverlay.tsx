import { motion, AnimatePresence } from 'framer-motion';

interface EliminationOverlayProps {
  show: boolean;
  playerName: string;
  playerAvatar: string;
}

export default function EliminationOverlay({ show, playerName, playerAvatar }: EliminationOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        >
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center"
          >
            <motion.span
              className="text-7xl mb-4"
              animate={{ opacity: [1, 0.3], scale: [1, 0.7] }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {playerAvatar}
            </motion.span>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-display text-2xl text-neon-pink tracking-widest"
            >
              ELIMINATED
            </motion.p>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-text-muted mt-2"
            >
              {playerName} is out!
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
