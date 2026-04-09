import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';

export interface CloseCallState {
  rankings: Record<string, number[]>;
}

// Compute Kendall tau distance: count pairwise swaps needed
function kendallTauDistance(submitted: number[], correct: number[]): number {
  let swaps = 0;
  for (let i = 0; i < correct.length; i++) {
    for (let j = i + 1; j < correct.length; j++) {
      const posI = submitted.indexOf(correct[i]);
      const posJ = submitted.indexOf(correct[j]);
      if (posI > posJ) swaps++;
    }
  }
  return swaps;
}

export const closeCallRound: RoundTypeDefinition<CloseCallState> = {
  id: 'close_call',
  name: 'Close Call',
  tagline: 'Get the order right... or close enough!',
  tier: 'pressure',
  difficulty: 30,

  theme: {
    primary: '#F97316',
    accent: '#FDBA74',
    icon: '📊',
    introAnimation: 'spotlight',
    soundCues: {
      intro: 'round_start',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
    },
  },

  timer: { duration: 60, autoStart: false },
  questionFormat: 'ranking',

  createInitialState: () => ({
    rankings: {},
  }),

  score: (players, question, _state, basePoints) => {
    const correctOrder = question.ranking_order ?? [];
    if (correctOrder.length === 0) {
      return players.map((p) => ({ playerId: p.id, delta: 0 }));
    }

    return players.map((p) => {
      const answerStr = String(p.currentAnswer ?? '');
      if (!answerStr) return { playerId: p.id, delta: 0 };

      const submitted = answerStr.split(',').map(Number);
      if (submitted.length !== correctOrder.length) return { playerId: p.id, delta: 0 };

      const swaps = kendallTauDistance(submitted, correctOrder);
      // Each swap reduces score by 20%, minimum 0
      const multiplier = Math.max(0, 1 - swaps * 0.2);

      return {
        playerId: p.id,
        delta: Math.round(basePoints * multiplier),
      };
    });
  },

  broadcastEvents: ['ranking_submit'],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/CloseCall/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/CloseCall/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/CloseCall/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/CloseCall/TvReveal')),
  },
};
