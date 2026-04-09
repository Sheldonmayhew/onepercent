import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface SwitchagoriesState {
  categoryPicks: Record<string, string>;
  phase: 'picking' | 'answering';
}

export const switchagoriesRound: RoundTypeDefinition<SwitchagoriesState> = {
  id: 'switchagories',
  name: 'Switchagories',
  tagline: 'Pick your category, own your fate!',
  tier: 'midgame',
  difficulty: 60,

  theme: {
    primary: '#8B5CF6',
    accent: '#C4B5FD',
    icon: '🎯',
    introAnimation: 'pulse',
    soundCues: {
      intro: 'round_start',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
      special: 'category_lock',
    },
  },

  timer: { duration: 45, autoStart: false },
  questionFormat: 'categorized',

  createInitialState: () => ({
    categoryPicks: {},
    phase: 'picking',
  }),

  score: (players, question, state, basePoints) => {
    return players.map((p) => {
      const isCorrect = checkAnswer(question, p.currentAnswer);
      if (!isCorrect) return { playerId: p.id, delta: 0 };

      // 2x bonus if player's category pick matches the question's category
      const pickedCategory = state.categoryPicks[p.id];
      const questionCategory = question.category;
      const matchesCategory = pickedCategory && questionCategory &&
        pickedCategory.toLowerCase() === questionCategory.toLowerCase();

      return {
        playerId: p.id,
        delta: matchesCategory ? basePoints * 2 : basePoints,
      };
    });
  },

  broadcastEvents: ['category_pick'],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/Switchagories/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/Switchagories/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/Switchagories/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/Switchagories/TvReveal')),
  },
};
