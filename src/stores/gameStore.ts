import { create } from 'zustand';
import type {
  GameSession,
  Player,
  MultiplayerMode,
  QuestionPack,
  Question,
} from '../types';
import {
  PLAYER_COLOURS,
  PLAYER_AVATARS,
  POINTS_PER_ROUND,
  DIFFICULTY_TIERS,
  getQuestionMultiplier,
} from '../types';
import { generateId } from '../utils/helpers';
import { buildQuickPlaySession, buildHostGameSession } from './gameStoreInit';
import { computeRevealAnswers } from './gameStoreScoring';
import { computeStartGame, computeProceedToNextRound, buildResetForReplay } from './gameStoreRounds';

interface GameStore {
  session: GameSession | null;
  availablePacks: QuestionPack[];

  // Actions
  setPacks: (packs: QuestionPack[]) => void;
  initQuickPlay: (packIds: string[]) => void;
  initHostGame: (mode: MultiplayerMode, packIds: string[]) => void;
  addPlayer: (name: string, emoji?: string, isHost?: boolean) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  submitAnswer: (playerId: string, answer: string | number) => void;
  revealAnswers: () => void;
  proceedToNextRound: () => 'next_question' | 'next_round' | 'done';
  getQuestionsInCurrentRound: () => number;
  getCurrentQuestionIndex: () => number;
  resetGame: () => void;
  resetForReplay: (packIds: string[]) => void;
  updateRoundState: (updater: (prev: unknown) => unknown) => void;
  getCurrentQuestion: () => Question | null;
  getActivePlayers: () => Player[];
  getTotalRounds: () => number;
  getCurrentDifficulty: () => number;
  getCurrentPoints: () => number;
  advancePassAndPlay: () => void;
  setAllAnswersIn: () => void;
  assignPlayerToTeam: (playerId: string, teamId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  availablePacks: [],

  setPacks: (packs) => set({ availablePacks: packs }),

  initQuickPlay: (packIds) => {
    const session = buildQuickPlaySession(get().availablePacks, packIds);
    if (session) set({ session });
  },

  initHostGame: (mode, packIds) => {
    const session = buildHostGameSession(get().availablePacks, mode, packIds);
    if (session) set({ session });
  },

  addPlayer: (name, emoji, isHost) => {
    const { session } = get();
    if (!session || session.players.length >= 8) return;

    const usedColours = new Set(session.players.map(p => p.colour));
    const usedAvatars = new Set(session.players.map(p => p.avatar));
    const colour = PLAYER_COLOURS.find(c => !usedColours.has(c)) ?? PLAYER_COLOURS[0];

    // Use provided emoji if available and not taken, otherwise auto-assign
    let avatar: string;
    if (emoji && !usedAvatars.has(emoji)) {
      avatar = emoji;
    } else {
      avatar = PLAYER_AVATARS.find(a => !usedAvatars.has(a)) ?? PLAYER_AVATARS[0];
    }

    const player: Player = {
      id: generateId(),
      name,
      colour,
      avatar,
      score: 0,
      currentAnswer: null,
      hasAnswered: false,
      isHost: isHost ?? false,
    };

    set({
      session: {
        ...session,
        players: [...session.players, player],
      },
    });
  },

  removePlayer: (id) => {
    const { session } = get();
    if (!session) return;

    set({
      session: {
        ...session,
        players: session.players.filter((p) => p.id !== id),
      },
    });
  },

  startGame: () => {
    const { session } = get();
    if (!session) return;

    const packs = get().availablePacks.filter((p) => session.settings.packIds.includes(p.pack_id));
    const updates = computeStartGame(session, packs);

    set({ session: { ...session, ...updates } });
  },

  submitAnswer: (playerId, answer) => {
    const { session } = get();
    if (!session) return;
    if (session.allAnswersIn) return;

    const players = session.players.map((p) =>
      p.id === playerId ? { ...p, currentAnswer: answer, hasAnswered: true } : p
    );

    const allIn = players.every((p) => p.hasAnswered);

    set({
      session: {
        ...session,
        players,
        allAnswersIn: allIn,
      },
    });
  },

  advancePassAndPlay: () => {
    const { session } = get();
    if (!session) return;

    let nextIdx = session.currentPlayerIndex + 1;

    while (nextIdx < session.players.length) {
      const player = session.players[nextIdx];
      if (!player.hasAnswered) {
        break;
      }
      nextIdx++;
    }

    const allIn = session.players.every((p) => p.hasAnswered);

    set({
      session: {
        ...session,
        currentPlayerIndex: nextIdx,
        allAnswersIn: allIn,
      },
    });
  },

  setAllAnswersIn: () => {
    const { session } = get();
    if (!session) return;
    set({ session: { ...session, allAnswersIn: true } });
  },

  revealAnswers: () => {
    const { session } = get();
    if (!session) return;

    const result = computeRevealAnswers(session);
    if (!result) return;

    set({
      session: {
        ...session,
        players: result.updatedPlayers,
        roundHistory: [...session.roundHistory, result.roundResult],
        teams: result.updatedTeams,
      },
    });
  },

  proceedToNextRound: () => {
    const { session } = get();
    if (!session) return 'done';

    const { update, result } = computeProceedToNextRound(session);
    if (Object.keys(update).length > 0) {
      set({ session: { ...session, ...update } });
    }
    return result;
  },

  resetGame: () => set({ session: null }),

  updateRoundState: (updater) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        activeRoundState: updater(session.activeRoundState),
      },
    });
  },

  resetForReplay: (packIds) => {
    const { session, availablePacks } = get();
    if (!session) return;

    const updates = buildResetForReplay(session, availablePacks, packIds);
    if (updates) {
      set({ session: { ...session, ...updates } });
    }
  },

  getCurrentQuestion: () => {
    const { session } = get();
    if (!session) return null;
    const roundQuestions = session.selectedQuestions[session.currentRound];
    return roundQuestions?.[session.currentQuestionInRound] ?? null;
  },

  getActivePlayers: () => {
    const { session } = get();
    if (!session) return [];
    return session.players;
  },

  getTotalRounds: () => DIFFICULTY_TIERS.length,

  getCurrentDifficulty: () => {
    const { session } = get();
    if (!session) return 90;
    return [...DIFFICULTY_TIERS][session.currentRound] ?? 90;
  },

  getCurrentPoints: () => {
    const { session } = get();
    if (!session) return 0;
    const difficulty = [...DIFFICULTY_TIERS][session.currentRound];
    const fullRoundPoints = POINTS_PER_ROUND[difficulty] ?? 0;
    const roundQuestions = session.selectedQuestions[session.currentRound];
    const totalQs = roundQuestions?.length ?? 1;
    const multiplier = getQuestionMultiplier(session.currentQuestionInRound, totalQs);
    return Math.round(fullRoundPoints * multiplier);
  },

  getQuestionsInCurrentRound: () => {
    const { session } = get();
    if (!session) return 1;
    return session.selectedQuestions[session.currentRound]?.length ?? 1;
  },

  getCurrentQuestionIndex: () => {
    const { session } = get();
    if (!session) return 0;
    return session.currentQuestionInRound;
  },

  assignPlayerToTeam: (playerId, teamId) => {
    const { session } = get();
    if (!session) return;

    // Remove player from any current team
    const updatedTeams = session.teams.map((team) => ({
      ...team,
      playerIds: team.playerIds.filter((id) => id !== playerId),
    }));

    // Add to new team
    const targetTeam = updatedTeams.find((t) => t.id === teamId);
    if (targetTeam) {
      targetTeam.playerIds.push(playerId);
    }

    set({
      session: {
        ...session,
        teams: updatedTeams,
        players: session.players.map((p) =>
          p.id === playerId ? { ...p, teamId } : p
        ),
      },
    });
  },

}));
