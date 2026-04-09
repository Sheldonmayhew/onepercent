import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface RollingCounterProps {
  value: number;
  className?: string;
}

function AnimatedDigit({ digit }: { digit: number }) {
  const spring = useSpring(digit, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [shown, setShown] = useState(digit);

  useEffect(() => {
    spring.set(digit);
  }, [digit, spring]);

  useEffect(() => {
    return display.on('change', (v) => setShown(v));
  }, [display]);

  return <span>{shown}</span>;
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
