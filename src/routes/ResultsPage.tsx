import { motion } from 'framer-motion';

export function Component() {
  return (
    <motion.div
      className="min-h-dvh flex items-center justify-center bg-bg-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p className="text-text-primary text-xl font-display">ResultsPage (stub)</p>
    </motion.div>
  );
}
