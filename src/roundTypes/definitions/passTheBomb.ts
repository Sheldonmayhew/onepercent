import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface PassTheBombState {
  wrongCount: number;
  penalties: Record<string, number>;
}

export const passTheBombRound: RoundTypeDefinition<PassTheBombState> = {
  id: 'pass_the_bomb',
  name: 'Pass The Bomb',
  tagline: "Don't let it blow up on you!",
  tier: 'midgame',
  difficulty: 50,

  theme: {
    primary: '#EF4444',
    accent: '#FCA5A5',
    icon: '💣',
    introAnimation: 'pulse',
    soundCues: {
      intro: 'round_start',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
      special: 'bomb_explode',
    },
  },

  timer: { duration: 45, autoStart: false },
  questionFormat: 'standard_mc',

  createInitialState: () => ({
    wrongCount: 0,
    penalties: {},
  }),

  score: (players, question, _state, basePoints) => {
    // Count wrong answers to determine penalty scaling
    let wrongSoFar = 0;

    return players.map((p) => {
      const isCorrect = checkAnswer(question, p.currentAnswer);
      if (isCorrect) {
        return { playerId: p.id, delta: basePoints };
      }

      // Penalty: 10% base + 5% per previous wrong, capped at 30%
      const penaltyRate = Math.min(0.3, 0.1 + wrongSoFar * 0.05);
      wrongSoFar++;
      return {
        playerId: p.id,
        delta: -Math.round(basePoints * penaltyRate),
      };
    });
  },

  broadcastEvents: [],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/PassTheBomb/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/PassTheBomb/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/PassTheBomb/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/PassTheBomb/TvReveal')),
  },
};
