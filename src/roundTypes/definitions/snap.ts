import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface SnapState {
  revealedOptions: number[];
  buzzTimestamps: Record<string, number>;
}

export const snapRound: RoundTypeDefinition<SnapState> = {
  id: 'snap',
  name: 'Snap',
  tagline: 'First to spot it scores big!',
  tier: 'warmup',
  difficulty: 70,

  theme: {
    primary: '#F59E0B',
    accent: '#FCD34D',
    icon: '⚡',
    introAnimation: 'slam',
    soundCues: {
      intro: 'round_start',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
      special: 'buzz_in',
    },
  },

  timer: { duration: 30, autoStart: false },
  questionFormat: 'timed_reveal',

  createInitialState: () => ({
    revealedOptions: [],
    buzzTimestamps: {},
  }),

  score: (players, question, state, basePoints) => {
    // Sort correct players by buzz timestamp (fastest first)
    const correctBuzzes = players
      .filter((p) => checkAnswer(question, p.currentAnswer))
      .map((p) => ({ id: p.id, timestamp: state.buzzTimestamps[p.id] ?? Infinity }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // 1st = 100%, 2nd = 50%, 3rd = 25%, 4th+ = 10%
    const POSITION_MULTIPLIERS = [1, 0.5, 0.25];
    const FLOOR = 0.1;

    return players.map((p) => {
      const rank = correctBuzzes.findIndex((b) => b.id === p.id);
      if (rank === -1) return { playerId: p.id, delta: 0 };

      const multiplier = POSITION_MULTIPLIERS[rank] ?? FLOOR;
      return {
        playerId: p.id,
        delta: Math.round(basePoints * multiplier),
      };
    });
  },

  broadcastEvents: ['buzz_in'],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/Snap/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/Snap/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/Snap/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/Snap/TvReveal')),
  },
};
