import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface PointBuilderState {
  // No special state — standard round
}

export const pointBuilderRound: RoundTypeDefinition<PointBuilderState> = {
  id: 'point_builder',
  name: 'Point Builder',
  tagline: 'Everyone plays, everyone scores!',
  tier: 'warmup',
  difficulty: 90,

  theme: {
    primary: '#22C55E',
    accent: '#86EFAC',
    icon: '📈',
    introAnimation: 'slide',
    soundCues: {
      intro: 'round_start',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
    },
  },

  timer: { duration: 45, autoStart: false },
  questionFormat: 'standard_mc',

  createInitialState: () => ({}),

  score: (players, question, _state, basePoints) => {
    return players.map((p) => ({
      playerId: p.id,
      delta: checkAnswer(question, p.currentAnswer) ? basePoints : 0,
    }));
  },

  broadcastEvents: [],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/PointBuilder/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/PointBuilder/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/PointBuilder/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/PointBuilder/TvReveal')),
  },
};
