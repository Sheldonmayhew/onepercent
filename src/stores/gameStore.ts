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
  getQuestionMultiplier,
} from '../types';
import { generateId, selectQuestionsForGame, checkAnswer } from '../utils/helpers';
import { ROUND_TYPE_SEQUENCE } from '../roundTypes/sequence';
import { getRoundDefinition } from '../roundTypes/registry';

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
        currentQuestionInRound: 0,
        settings,
        roundHistory: [],
        selectedQuestions: [],
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        teams: [],
        roundTypeSequence: [...ROUND_TYPE_SEQUENCE],
        activeRoundState: null,
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
        roundTypeSequence: [...ROUND_TYPE_SEQUENCE],
        activeRoundState: null,
        currentQuestionInRound: 0,
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

    const roundTypeId = session.roundTypeSequence[0];
    const roundDef = getRoundDefinition(roundTypeId);
    const firstQuestion = questions[0]?.[0];
    const initialState = firstQuestion ? roundDef.createInitialState(session.players, firstQuestion) : null;

    set({
      session: {
        ...session,
        currentRound: 0,
        currentQuestionInRound: 0,
        selectedQuestions: questions,
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        activeRoundState: initialState,
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

    const roundQuestions = session.selectedQuestions[session.currentRound];
    const question = roundQuestions?.[session.currentQuestionInRound];
    if (!question) return;

    const difficulty = [...DIFFICULTY_TIERS][session.currentRound];
    const fullRoundPoints = POINTS_PER_ROUND[difficulty] ?? 0;
    const questionsInRound = roundQuestions.length;
    const multiplier = getQuestionMultiplier(session.currentQuestionInRound, questionsInRound);
    const basePoints = Math.round(fullRoundPoints * multiplier);

    // Delegate scoring to the round type definition
    const roundTypeId = session.roundTypeSequence[session.currentRound];
    const roundDef = getRoundDefinition(roundTypeId);
    const scoreUpdates = roundDef.score(
      session.players,
      question,
      session.activeRoundState,
      basePoints,
    );

    // Build correct/incorrect ID lists and apply score deltas
    const correctIds: string[] = [];
    const incorrectIds: string[] = [];
    const deltaMap = new Map(scoreUpdates.map((u) => [u.playerId, u]));

    const updatedPlayers = session.players.map((p) => {
      const update = deltaMap.get(p.id);
      const isCorrect = checkAnswer(question, p.currentAnswer);

      if (isCorrect) {
        correctIds.push(p.id);
      } else {
        incorrectIds.push(p.id);
      }

      // Apply steal deductions
      const stolenFrom = scoreUpdates
        .filter((u) => u.stealFromId === p.id)
        .reduce((sum, u) => sum + Math.abs(u.delta) * 0.25, 0);

      const delta = update?.delta ?? 0;
      return {
        ...p,
        score: Math.max(0, p.score + delta - stolenFrom),
      };
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
      const teamDelta = scoreUpdates
        .filter((u) => updatedPlayers.find((p) => p.id === u.playerId)?.teamId === team.id)
        .reduce((sum, u) => sum + u.delta, 0);
      const teamStolenFrom = scoreUpdates
        .filter((u) => u.stealFromId && updatedPlayers.find((p) => p.id === u.stealFromId)?.teamId === team.id)
        .reduce((sum, u) => sum + Math.abs(u.delta) * 0.25, 0);
      return { ...team, score: Math.max(0, team.score + teamDelta - teamStolenFrom) };
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

    const roundQuestions = session.selectedQuestions[session.currentRound];
    const nextQuestionIdx = session.currentQuestionInRound + 1;

    // More questions in this round?
    if (roundQuestions && nextQuestionIdx < roundQuestions.length) {
      // Keep the same round state (don't reinitialize) — it persists across questions in a round
      set({
        session: {
          ...session,
          currentQuestionInRound: nextQuestionIdx,
          currentPlayerIndex: 0,
          allAnswersIn: false,
          timerStarted: false,
          players: session.players.map((p) => ({
            ...p,
            currentAnswer: null,
            hasAnswered: false,
            answerTimestamp: undefined,
          })),
        },
      });
      return 'next_question';
    }

    // Move to next round
    const nextRound = session.currentRound + 1;

    if (nextRound >= DIFFICULTY_TIERS.length) {
      return 'done';
    }

    const roundTypeId = session.roundTypeSequence[nextRound];
    const roundDef = getRoundDefinition(roundTypeId);
    const nextRoundQuestions = session.selectedQuestions[nextRound];
    const firstQuestion = nextRoundQuestions?.[0];
    const initialState = firstQuestion ? roundDef.createInitialState(session.players, firstQuestion) : null;

    set({
      session: {
        ...session,
        currentRound: nextRound,
        currentQuestionInRound: 0,
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        activeRoundState: initialState,
        players: session.players.map((p) => ({
          ...p,
          currentAnswer: null,
          hasAnswered: false,
          answerTimestamp: undefined,
          selectedCategory: undefined,
          stealTarget: undefined,
        })),
      },
    });
    return 'next_round';
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

    const packs = availablePacks.filter((p) => packIds.includes(p.pack_id));
    if (packs.length === 0) return;

    set({
      session: {
        ...session,
        id: generateId(),
        pack: packs[0],
        currentRound: 0,
        currentQuestionInRound: 0,
        selectedQuestions: [],
        roundHistory: [],
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        settings: { ...session.settings, packIds },
        roundTypeSequence: [...ROUND_TYPE_SEQUENCE],
        activeRoundState: null,
        players: session.players.map((p) => ({
          ...p,
          score: 0,
          currentAnswer: null,
          hasAnswered: false,
          eliminated: undefined,
          answerTimestamp: undefined,
          selectedCategory: undefined,
          stealTarget: undefined,
        })),
        teams: session.teams.map((t) => ({ ...t, score: 0 })),
      },
    });
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
