import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface RollingCounterProps {
  value: number;
  className?: string;
}

export default function RollingCounter({ value, className = '' }: RollingCounterProps) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<'gain' | 'loss' | null>(null);

  useEffect(() => {
    if (value > prevRef.current) {
      setFlash('gain');
    } else if (value < prevRef.current) {
      setFlash('loss');
    }
    prevRef.current = value;
    const t = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(t);
  }, [value]);

  const formatted = value.toLocaleString('en-ZA');

  return (
    <motion.span
      className={`tabular-nums ${className}`}
      animate={{
        color: flash === 'gain' ? '#22C55E' : flash === 'loss' ? '#EF4444' : '#FFFFFF',
        scale: flash ? [1, 1.15, 1] : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      {formatted}
    </motion.span>
  );
}
