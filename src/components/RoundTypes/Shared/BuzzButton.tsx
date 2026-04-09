import { useState } from 'react';
import { motion } from 'framer-motion';

interface BuzzButtonProps {
  onBuzz: (timestamp: number) => void;
  disabled?: boolean;
  label?: string;
  color?: string;
}

export default function BuzzButton({ onBuzz, disabled, label = 'BUZZ IN', color = 'from-neon-pink to-neon-cyan' }: BuzzButtonProps) {
  const [buzzed, setBuzzed] = useState(false);

  const handleBuzz = () => {
    if (buzzed || disabled) return;
    const timestamp = Date.now();
    setBuzzed(true);
    onBuzz(timestamp);
  };

  return (
    <motion.button
      onClick={handleBuzz}
      disabled={disabled || buzzed}
      className={`w-full py-5 rounded-2xl font-display text-2xl tracking-widest text-white shadow-lg transition-all ${
        buzzed
          ? 'bg-neon-green/80 cursor-default'
          : disabled
          ? 'bg-bg-elevated text-text-muted cursor-not-allowed opacity-40'
          : `bg-gradient-to-r ${color} cursor-pointer`
      }`}
      whileHover={!buzzed && !disabled ? { scale: 1.03 } : {}}
      whileTap={!buzzed && !disabled ? { scale: 0.95 } : {}}
      animate={buzzed ? { scale: [1, 1.1, 1] } : {}}
      transition={buzzed ? { duration: 0.3 } : {}}
    >
      {buzzed ? '✓ BUZZED' : label}
    </motion.button>
  );
}
