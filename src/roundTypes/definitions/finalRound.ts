import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface FinalRoundState {
  eliminatedPlayerIds: string[];
}

export const finalRoundDef: RoundTypeDefinition<FinalRoundState> = {
  id: 'final_round',
  name: 'Final Round',
  tagline: 'One wrong and you are out!',
  tier: 'gauntlet',
  difficulty: 1,

  theme: {
    primary: '#991B1B',
    accent: '#EF4444',
    icon: '💀',
    introAnimation: 'fire',
    soundCues: {
      intro: 'final_round',
      correct: 'winner',
      wrong: 'wrong_reveal',
      special: 'elimination',
    },
  },

  timer: { duration: 60, autoStart: false },
  questionFormat: 'standard_mc',

  createInitialState: () => ({
    eliminatedPlayerIds: [],
  }),

  score: (players, question, _state, basePoints) => {
    return players.map((p) => {
      if (p.eliminated) return { playerId: p.id, delta: 0 };
      const isCorrect = checkAnswer(question, p.currentAnswer);
      return {
        playerId: p.id,
        delta: isCorrect ? basePoints : 0,
      };
    });
  },

  broadcastEvents: [],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/FinalRound/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/FinalRound/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/FinalRound/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/FinalRound/TvReveal')),
  },
};
