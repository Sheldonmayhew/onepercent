import { useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

type SoundName = 'tick' | 'correct' | 'wrong' | 'eliminate' | 'bank' | 'reveal' | 'fanfare' | 'countdown';

export function useSound() {
  const soundEnabled = useGameStore((s) => s.session?.settings.soundEnabled ?? true);
  const ctxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.2) => {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio context not available
      }
    },
    [soundEnabled, getAudioContext]
  );

  const play = useCallback(
    (name: SoundName) => {
      if (!soundEnabled) return;

      switch (name) {
        case 'tick':
          playTone(800, 0.05, 'square', 0.1);
          break;
        case 'correct':
          playTone(523, 0.15, 'sine', 0.25);
          setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 150);
          setTimeout(() => playTone(784, 0.3, 'sine', 0.25), 300);
          break;
        case 'wrong':
          playTone(200, 0.3, 'sawtooth', 0.15);
          setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.15), 200);
          break;
        case 'eliminate':
          playTone(400, 0.1, 'square', 0.2);
          setTimeout(() => playTone(300, 0.1, 'square', 0.2), 100);
          setTimeout(() => playTone(200, 0.1, 'square', 0.2), 200);
          setTimeout(() => playTone(100, 0.4, 'square', 0.2), 300);
          break;
        case 'bank':
          playTone(600, 0.1, 'sine', 0.2);
          setTimeout(() => playTone(800, 0.1, 'sine', 0.2), 100);
          setTimeout(() => playTone(1000, 0.2, 'sine', 0.2), 200);
          break;
        case 'reveal':
          playTone(440, 0.3, 'triangle', 0.2);
          break;
        case 'fanfare':
          [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 200);
          });
          break;
        case 'countdown':
          playTone(600, 0.08, 'square', 0.15);
          break;
      }
    },
    [soundEnabled, playTone]
  );

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return { play };
}
