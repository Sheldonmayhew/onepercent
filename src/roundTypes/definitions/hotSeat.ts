import { lazy } from 'react';
import type { RoundTypeDefinition } from '../types';
import { checkAnswer } from '../../utils/helpers';

export interface HotSeatState {
  hotSeatOrder: string[];
  currentHotSeatIndex: number;
  phase: 'intro' | 'answering' | 'reveal';
}

export const hotSeatRound: RoundTypeDefinition<HotSeatState> = {
  id: 'hot_seat',
  name: 'Hot Seat',
  tagline: 'All eyes on you!',
  tier: 'gauntlet',
  difficulty: 5,

  theme: {
    primary: '#FDD404',
    accent: '#FEF08A',
    icon: '🔥',
    introAnimation: 'spotlight',
    soundCues: {
      intro: 'final_round',
      correct: 'correct_reveal',
      wrong: 'wrong_reveal',
      special: 'hot_seat_spotlight',
    },
  },

  timer: { duration: 45, autoStart: false },
  questionFormat: 'standard_mc',

  createInitialState: (players) => {
    // Sort by score ascending — lowest goes first (mercy rule)
    const sorted = [...players]
      .sort((a, b) => a.score - b.score)
      .map((p) => p.id);

    return {
      hotSeatOrder: sorted,
      currentHotSeatIndex: 0,
      phase: 'intro',
    };
  },

  score: (players, question, _state, basePoints) => {
    return players.map((p) => ({
      playerId: p.id,
      delta: checkAnswer(question, p.currentAnswer) ? basePoints : 0,
    }));
  },

  broadcastEvents: [],

  slots: {
    PlayerInput: lazy(() => import('../../components/RoundTypes/HotSeat/PlayerInput')),
    TvPlay: lazy(() => import('../../components/RoundTypes/HotSeat/TvPlay')),
    TvIntro: lazy(() => import('../../components/RoundTypes/HotSeat/TvIntro')),
    TvReveal: lazy(() => import('../../components/RoundTypes/HotSeat/TvReveal')),
    HostControls: lazy(() => import('../../components/RoundTypes/HotSeat/HostControls')),
  },
};
