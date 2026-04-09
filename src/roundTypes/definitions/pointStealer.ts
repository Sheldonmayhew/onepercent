import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface PointStealerState {
  phase: 'answering' | 'stealing';
  stealChoices: Record<string, string>;
  correctPlayerIds: string[];
}

export const pointStealerRound: RoundTypeDefinition<PointStealerState> = {
  id: 'point_stealer',
  name: 'Point Stealer',
  tagline: 'Take what you can!',
  tier: 'pressure',
  difficulty: 20,

  theme: {
    primary: '#EC4899',
    accent: '#F9A8D4',
    icon: '🏴‍☠️',
    introAnimation: 'spotlight',
    soundCues: {
      intro: 'round_start',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
      special: 'steal_sound',
    },
  },

  timer: { duration: 45, autoStart: false },
  questionFormat: 'standard_mc',

  createInitialState: () => ({
    phase: 'answering',
    stealChoices: {},
    correctPlayerIds: [],
  }),

  score: (players, question, state, basePoints) => {
    const stealAmount = Math.round(basePoints * 0.25);

    return players.map((p) => {
      const isCorrect = checkAnswer(question, p.currentAnswer);
      if (!isCorrect) return { playerId: p.id, delta: 0 };

      const stealTarget = state.stealChoices[p.id];
      if (stealTarget) {
        return {
          playerId: p.id,
          delta: basePoints + stealAmount,
          stealFromId: stealTarget,
        };
      }

      return { playerId: p.id, delta: basePoints };
    });
  },

  broadcastEvents: ['steal_target'],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/PointStealer/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/PointStealer/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/PointStealer/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/PointStealer/TvReveal')),
    HostControls: lazy(() => import('../../components/RoundTypes/PointStealer/HostControls')),
  },
};
