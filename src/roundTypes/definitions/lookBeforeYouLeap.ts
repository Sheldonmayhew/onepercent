import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface LookBeforeYouLeapState {
  revealedChunks: number;
  totalChunks: number;
  buzzTimestamps: Record<string, number>;
}

export const lookBeforeYouLeapRound: RoundTypeDefinition<LookBeforeYouLeapState> = {
  id: 'look_before_you_leap',
  name: 'Look Before You Leap',
  tagline: 'Risk it for a bigger reward!',
  tier: 'pressure',
  difficulty: 10,

  theme: {
    primary: '#DC2626',
    accent: '#FCA5A5',
    icon: '👀',
    introAnimation: 'heartbeat',
    soundCues: {
      intro: 'final_round',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
      special: 'buzz_in',
    },
  },

  timer: { duration: 45, autoStart: false },
  questionFormat: 'progressive_reveal',

  createInitialState: (_players, question) => ({
    revealedChunks: 0,
    totalChunks: question.reveal_chunks?.length ?? 1,
    buzzTimestamps: {},
  }),

  score: (players, question, state, basePoints) => {
    const totalChunks = state.totalChunks || 1;

    return players.map((p) => {
      const isCorrect = checkAnswer(question, p.currentAnswer);
      const buzzTime = state.buzzTimestamps[p.id];

      if (!buzzTime || p.currentAnswer === null) {
        return { playerId: p.id, delta: 0 };
      }

      if (!isCorrect) {
        // Wrong = lose 50% of base
        return { playerId: p.id, delta: -Math.round(basePoints * 0.5) };
      }

      // Determine reveal progress at time of buzz (approximate)
      // Earlier buzz = higher multiplier
      const revealedAtBuzz = state.revealedChunks; // simplified
      const progress = revealedAtBuzz / totalChunks;

      let multiplier: number;
      if (progress < 0.25) multiplier = 3;
      else if (progress < 0.5) multiplier = 2;
      else if (progress < 0.75) multiplier = 1.5;
      else multiplier = 1;

      return {
        playerId: p.id,
        delta: Math.round(basePoints * multiplier),
      };
    });
  },

  broadcastEvents: ['buzz_in'],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/LookBeforeYouLeap/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/LookBeforeYouLeap/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/LookBeforeYouLeap/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/LookBeforeYouLeap/TvReveal')),
  },
};
