import { create } from 'zustand';
import type {
  GameSession,
  GameSettings,
  Player,
  MultiplayerMode,
  RoundResult,
  QuestionPack,
  Question,
  Team,
} from '../types';
import {
  PLAYER_COLOURS,
  PLAYER_AVATARS,
  POINTS_PER_ROUND,
  DIFFICULTY_TIERS,
  TEAM_COLOURS,
  TEAM_NAMES,
} from '../types';
import { generateId, selectQuestionsForGame, checkAnswer } from '../utils/helpers';

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
  proceedToNextRound: () => 'next' | 'done';
  resetGame: () => void;
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
    const packs = get().availablePacks.filter((p) => packIds.includes(p.pack_id));
    if (packs.length === 0) return;

    const pack = packs[0];
    const settings: GameSettings = {
      soundEnabled: true,
      packIds,
      teamMode: false,
      teamCount: 2,
    };

    set({
      session: {
        id: generateId(),
        pack,
        players: [],
        currentRound: 0,
        settings,
        roundHistory: [],
        selectedQuestions: [],
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        teams: [],
      },
    });
  },

  initHostGame: (mode, packIds) => {
    const packs = get().availablePacks.filter((p) => packIds.includes(p.pack_id));
    if (packs.length === 0) return;

    const pack = packs[0];
    const teamMode = mode === 'team';
    const settings: GameSettings = {
      soundEnabled: true,
      packIds,
      teamMode,
      teamCount: 2,
    };

    const teams: Team[] = teamMode
      ? Array.from({ length: 2 }, (_, i) => ({
          id: generateId(),
          name: TEAM_NAMES[i],
          colour: TEAM_COLOURS[i],
          playerIds: [],
          score: 0,
        }))
      : [];

    set({
      session: {
        id: generateId(),
        pack,
        players: [],
        currentRound: 0,
        settings,
        roundHistory: [],
        selectedQuestions: [],
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        teams,
        multiplayerMode: mode,
      },
    });
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
    const questions = selectQuestionsForGame(packs.length > 0 ? packs : [session.pack]);

    set({
      session: {
        ...session,
        currentRound: 0,
        selectedQuestions: questions,
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        players: session.players.map((p) => ({
          ...p,
          currentAnswer: null,
          hasAnswered: false,
        })),
      },
    });
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

    const question = session.selectedQuestions[session.currentRound];
    if (!question) return;

    const difficulty = [...DIFFICULTY_TIERS][session.currentRound];
    const points = POINTS_PER_ROUND[difficulty] ?? 0;

    const correctIds: string[] = [];
    const incorrectIds: string[] = [];

    const updatedPlayers = session.players.map((p) => {
      const isCorrect = checkAnswer(question, p.currentAnswer);

      if (isCorrect) {
        correctIds.push(p.id);
        return {
          ...p,
          score: p.score + points,
        };
      } else {
        incorrectIds.push(p.id);
        return p;
      }
    });

    const roundResult: RoundResult = {
      roundIndex: session.currentRound,
      difficulty,
      question,
      correctPlayers: correctIds,
      incorrectPlayers: incorrectIds,
    };

    // Update team scores
    const updatedTeams = session.teams.map((team) => {
      const teamPoints = correctIds
        .filter((id) => updatedPlayers.find((p) => p.id === id)?.teamId === team.id)
        .length * points;
      return { ...team, score: team.score + teamPoints };
    });

    set({
      session: {
        ...session,
        players: updatedPlayers,
        roundHistory: [...session.roundHistory, roundResult],
        teams: updatedTeams,
      },
    });
  },

  proceedToNextRound: () => {
    const { session } = get();
    if (!session) return 'done';

    const nextRound = session.currentRound + 1;

    if (nextRound >= DIFFICULTY_TIERS.length) {
      return 'done';
    }

    set({
      session: {
        ...session,
        currentRound: nextRound,
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        players: session.players.map((p) => ({
          ...p,
          currentAnswer: null,
          hasAnswered: false,
        })),
      },
    });
    return 'next';
  },

  resetGame: () => set({ session: null }),

  getCurrentQuestion: () => {
    const { session } = get();
    if (!session) return null;
    return session.selectedQuestions[session.currentRound] ?? null;
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
    return POINTS_PER_ROUND[difficulty] ?? 0;
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
