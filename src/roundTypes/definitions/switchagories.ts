import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer, shuffleArray } from '../../utils/helpers';

export interface SwitchagoriesState {
  pickerPlayerId: string;
  packOptions: string[];
  categoryPick: string | null;
  phase: 'picking' | 'answering';
}

/** Pick 4 random pack names from available packs */
export function pickRandomPacks(packNames: string[], count = 4): string[] {
  return shuffleArray(packNames).slice(0, count);
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

  getQuestionCount: (playerCount) => playerCount,
  resetStatePerQuestion: true,

  createInitialState: (players, _question, questionIndex) => ({
    pickerPlayerId: players[questionIndex ?? 0]?.id ?? '',
    packOptions: [],  // populated by the game store after init
    categoryPick: null,
    phase: 'picking' as const,
  }),

  score: (players, _question, state, basePoints) => {
    return players.map((p) => {
      const isCorrect = checkAnswer(_question, p.currentAnswer);
      if (!isCorrect) return { playerId: p.id, delta: 0 };

      // Picker gets 2x bonus
      const isPicker = p.id === state.pickerPlayerId;
      return {
        playerId: p.id,
        delta: isPicker ? basePoints * 2 : basePoints,
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
