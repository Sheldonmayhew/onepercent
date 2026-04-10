import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface QuickstarterState {
  multipliers: Record<string, number>;
}

export const quickstarterRound: RoundTypeDefinition<QuickstarterState> = {
  id: 'quickstarter',
  name: 'Quickstarter',
  tagline: 'Build your streak, build your score!',
  tier: 'warmup',
  difficulty: 80,

  theme: {
    primary: '#3B82F6',
    accent: '#93C5FD',
    icon: '🚀',
    introAnimation: 'slide',
    soundCues: {
      intro: 'round_start',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
    },
  },

  timer: { duration: 45, autoStart: false },
  questionFormat: 'standard_mc',

  createInitialState: (players) => ({
    multipliers: Object.fromEntries(players.map((p) => [p.id, 1])),
  }),

  score: (players, question, state, basePoints) => {
    return players.map((p) => {
      const isCorrect = checkAnswer(question, p.currentAnswer);
      const multiplier = state.multipliers[p.id] ?? 1;
      return {
        playerId: p.id,
        delta: isCorrect ? Math.round(basePoints * multiplier) : 0,
      };
    });
  },

  afterScore: (state, players, question) => {
    const updated: Record<string, number> = {};
    for (const p of players) {
      const isCorrect = checkAnswer(question, p.currentAnswer);
      const current = state.multipliers[p.id] ?? 1;
      updated[p.id] = isCorrect ? current + 0.5 : 1;
    }
    return { ...state, multipliers: updated };
  },

  broadcastEvents: [],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/Quickstarter/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/Quickstarter/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/Quickstarter/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/Quickstarter/TvReveal')),
  },
};
