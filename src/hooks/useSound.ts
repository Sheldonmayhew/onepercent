import { useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export type SoundEvent =
  | 'game_start'
  | 'round_start'
  | 'timer_tick'
  | 'timer_expired'
  | 'answer_submitted'
  | 'correct_reveal'
  | 'wrong_reveal'
  | 'final_round'
  | 'winner'
  | 'player_joined';

export function useSound() {
  const soundEnabled = useGameStore((s) => s.session?.settings.soundEnabled ?? true);
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.2, delay = 0) => {
      if (!soundEnabled) return;
      try {
        const ctx = getCtx();
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
      } catch {
        // Audio context not available
      }
    },
    [soundEnabled, getCtx]
  );

  const playSweep = useCallback(
    (startFreq: number, endFreq: number, duration: number, type: OscillatorType = 'sine', volume = 0.2, delay = 0) => {
      if (!soundEnabled) return;
      try {
        const ctx = getCtx();
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
      } catch {
        // Audio context not available
      }
    },
    [soundEnabled, getCtx]
  );

  const playNoise = useCallback(
    (duration: number, volume = 0.1, delay = 0) => {
      if (!soundEnabled) return;
      try {
        const ctx = getCtx();
        const t = ctx.currentTime + delay;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(t);
        source.stop(t + duration);
      } catch {
        // Audio context not available
      }
    },
    [soundEnabled, getCtx]
  );

  const play = useCallback(
    (event: SoundEvent) => {
      if (!soundEnabled) return;

      switch (event) {
        case 'game_start':
          // Rising synth sweep — energetic build
          playSweep(200, 800, 0.4, 'sawtooth', 0.15);
          playSweep(300, 1200, 0.5, 'sine', 0.1, 0.1);
          playTone(800, 0.3, 'sine', 0.2, 0.5);
          playTone(1000, 0.3, 'sine', 0.15, 0.65);
          playTone(1200, 0.4, 'sine', 0.2, 0.8);
          break;

        case 'round_start':
          // Quick drumroll stinger
          for (let i = 0; i < 6; i++) {
            playNoise(0.05, 0.12, i * 0.06);
          }
          playTone(600, 0.15, 'square', 0.15, 0.4);
          playTone(800, 0.2, 'square', 0.2, 0.45);
          break;

        case 'timer_tick':
          // Clock tick — sharp, fast
          playTone(1200, 0.03, 'square', 0.12);
          break;

        case 'timer_expired':
          // Buzzer horn — abrupt, final
          playTone(150, 0.4, 'sawtooth', 0.25);
          playTone(140, 0.4, 'square', 0.15);
          playNoise(0.3, 0.08);
          break;

        case 'answer_submitted':
          // Soft click/pop
          playTone(1000, 0.05, 'sine', 0.15);
          playTone(1400, 0.08, 'sine', 0.1, 0.03);
          break;

        case 'correct_reveal':
          // Triumphant ascending chime
          playTone(523, 0.15, 'sine', 0.25);
          playTone(659, 0.15, 'sine', 0.25, 0.12);
          playTone(784, 0.2, 'sine', 0.25, 0.24);
          playTone(1047, 0.35, 'sine', 0.2, 0.36);
          break;

        case 'wrong_reveal':
          // Low descending buzz
          playSweep(300, 100, 0.5, 'sawtooth', 0.15);
          playTone(80, 0.3, 'square', 0.1, 0.2);
          break;

        case 'final_round':
          // Epic build-up sting
          playNoise(0.2, 0.08);
          playSweep(100, 600, 0.6, 'sawtooth', 0.12, 0.1);
          playTone(600, 0.2, 'square', 0.15, 0.6);
          playTone(800, 0.2, 'square', 0.15, 0.7);
          playTone(1000, 0.4, 'sine', 0.2, 0.8);
          break;

        case 'winner':
          // Victory fanfare
          [523, 659, 784, 1047].forEach((freq, i) => {
            playTone(freq, 0.3, 'sine', 0.2, i * 0.18);
          });
          // Harmony layer
          [659, 784, 1047, 1318].forEach((freq, i) => {
            playTone(freq, 0.25, 'triangle', 0.1, i * 0.18 + 0.05);
          });
          break;

        case 'player_joined':
          // Welcoming notification ping
          playTone(880, 0.1, 'sine', 0.15);
          playTone(1100, 0.15, 'sine', 0.12, 0.08);
          break;
      }
    },
    [soundEnabled, playTone, playSweep, playNoise]
  );

  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return { play };
}
