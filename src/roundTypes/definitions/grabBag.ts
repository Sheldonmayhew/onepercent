import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';

export interface GrabBagState {
  selections: Record<string, number[]>;
}

export const grabBagRound: RoundTypeDefinition<GrabBagState> = {
  id: 'grab_bag',
  name: 'Grab Bag',
  tagline: 'Pick the right ones, dodge the wrong!',
  tier: 'midgame',
  difficulty: 40,

  theme: {
    primary: '#10B981',
    accent: '#6EE7B7',
    icon: '🎒',
    introAnimation: 'pulse',
    soundCues: {
      intro: 'round_start',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
    },
  },

  timer: { duration: 45, autoStart: false },
  questionFormat: 'multi_select',

  createInitialState: () => ({
    selections: {},
  }),

  score: (players, question, _state, basePoints) => {
    const correctSet = new Set(question.correct_answers ?? []);
    const correctCount = correctSet.size || 1;
    const pointsPerCorrect = Math.round(basePoints / correctCount);

    return players.map((p) => {
      // Answer stored as comma-separated indices
      const selectedStr = String(p.currentAnswer ?? '');
      if (!selectedStr) return { playerId: p.id, delta: 0 };

      const selected = selectedStr.split(',').map(Number).filter((n) => !isNaN(n));
      let net = 0;
      for (const idx of selected) {
        if (correctSet.has(idx)) {
          net += pointsPerCorrect;
        } else {
          net -= pointsPerCorrect;
        }
      }

      return { playerId: p.id, delta: Math.max(0, net) };
    });
  },

  broadcastEvents: ['grab_bag_submit'],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/GrabBag/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/GrabBag/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/GrabBag/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/GrabBag/TvReveal')),
  },
};
