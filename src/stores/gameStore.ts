import { create } from 'zustand';
import type {
  GameSession,
  GameSettings,
  Player,
  GameScreen,
  RoundResult,
  QuestionPack,
  Question,
} from '../types';
import {
  PLAYER_COLOURS,
  PLAYER_AVATARS,
  POINTS_PER_ROUND,
  DIFFICULTY_TIERS,
  QUICK_TIERS,
} from '../types';
import { generateId, selectQuestionsForGame, checkAnswer } from '../utils/helpers';

interface GameStore {
  session: GameSession | null;
  availablePacks: QuestionPack[];

  // Actions
  setPacks: (packs: QuestionPack[]) => void;
  createGame: (settings: GameSettings) => void;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  submitAnswer: (playerId: string, answer: string | number) => void;
  revealAnswers: () => void;
  bankPlayer: (playerId: string) => void;
  recordBankingDecision: (playerId: string, banked: boolean) => void;
  proceedToNextRound: () => void;
  setScreen: (screen: GameScreen) => void;
  resetGame: () => void;
  getCurrentQuestion: () => Question | null;
  getActivePlayers: () => Player[];
  getTiers: () => readonly number[];
  getCurrentDifficulty: () => number;
  getCurrentPoints: () => number;
  advancePassAndPlay: () => void;
  setAllAnswersIn: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  availablePacks: [],

  setPacks: (packs) => set({ availablePacks: packs }),

  createGame: (settings) => {
    const pack = get().availablePacks.find((p) => p.pack_id === settings.packId);
    if (!pack) return;

    set({
      session: {
        id: generateId(),
        pack,
        players: [],
        currentRound: 0,
        screen: 'lobby',
        settings,
        roundHistory: [],
        selectedQuestions: [],
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        bankingDecisions: {},
      },
    });
  },

  addPlayer: (name) => {
    const { session } = get();
    if (!session || session.players.length >= 8) return;

    const usedColours = new Set(session.players.map(p => p.colour));
    const usedAvatars = new Set(session.players.map(p => p.avatar));
    const colour = PLAYER_COLOURS.find(c => !usedColours.has(c)) ?? PLAYER_COLOURS[0];
    const avatar = PLAYER_AVATARS.find(a => !usedAvatars.has(a)) ?? PLAYER_AVATARS[0];

    const player: Player = {
      id: generateId(),
      name,
      colour,
      avatar,
      score: 0,
      isEliminated: false,
      isBanked: false,
      currentAnswer: null,
      hasAnswered: false,
      lastCorrectRound: -1,
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

    const questions = selectQuestionsForGame(session.pack, session.settings.mode);

    set({
      session: {
        ...session,
        screen: 'playing',
        currentRound: 0,
        selectedQuestions: questions,
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        bankingDecisions: {},
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
    // Reject answers after timer expires or outside playing phase
    if (session.allAnswersIn || session.screen !== 'playing') return;

    const players = session.players.map((p) =>
      p.id === playerId ? { ...p, currentAnswer: answer, hasAnswered: true } : p
    );

    const activePlayers = players.filter((p) => !p.isEliminated && !p.isBanked);
    const allIn = activePlayers.every((p) => p.hasAnswered);

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

    const activePlayers = session.players.filter((p) => !p.isEliminated && !p.isBanked);
    let nextIdx = session.currentPlayerIndex + 1;

    // Find next active player who hasn't answered
    while (nextIdx < session.players.length) {
      const player = session.players[nextIdx];
      if (!player.isEliminated && !player.isBanked && !player.hasAnswered) {
        break;
      }
      nextIdx++;
    }

    const allIn = activePlayers.every((p) => p.hasAnswered);

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

    const tiers = session.settings.mode === 'quick' ? [...QUICK_TIERS] : [...DIFFICULTY_TIERS];
    const difficulty = tiers[session.currentRound];
    const points = POINTS_PER_ROUND[difficulty] ?? 0;

    const correctIds: string[] = [];
    const eliminatedIds: string[] = [];

    const keepScore = session.settings.eliminationRule === 'keep_last_cleared';

    const updatedPlayers = session.players.map((p) => {
      if (p.isEliminated || p.isBanked) return p;

      const isCorrect = checkAnswer(question, p.currentAnswer);

      if (isCorrect) {
        correctIds.push(p.id);
        return {
          ...p,
          score: p.score + points,
          lastCorrectRound: session.currentRound,
        };
      } else {
        eliminatedIds.push(p.id);
        if (keepScore) {
          // "Keep Score" mode: player is NOT eliminated, just earns no points
          return p;
        }
        return {
          ...p,
          isEliminated: true,
          score: 0,
        };
      }
    });

    const roundResult: RoundResult = {
      roundIndex: session.currentRound,
      difficulty,
      question,
      correctPlayers: correctIds,
      eliminatedPlayers: eliminatedIds,
      bankedPlayers: [],
    };

    set({
      session: {
        ...session,
        screen: 'reveal',
        players: updatedPlayers,
        roundHistory: [...session.roundHistory, roundResult],
      },
    });
  },

  bankPlayer: (playerId) => {
    const { session } = get();
    if (!session) return;

    set({
      session: {
        ...session,
        players: session.players.map((p) =>
          p.id === playerId ? { ...p, isBanked: true } : p
        ),
      },
    });
  },

  recordBankingDecision: (playerId, banked) => {
    const { session } = get();
    if (!session) return;

    // Record this player's decision
    const decisions = { ...session.bankingDecisions, [playerId]: banked };

    // If the player chose to bank, mark them banked
    const players = banked
      ? session.players.map((p) =>
          p.id === playerId ? { ...p, isBanked: true } : p
        )
      : session.players;

    // Check if all active (non-eliminated, non-banked-before-this-round) players have decided.
    // Use the *original* players list to determine who should decide — players who were
    // active when the banking phase started (not eliminated and not already banked).
    const playersWhoShouldDecide = session.players.filter(
      (p) => !p.isEliminated && !p.isBanked
    );
    const allDecided = playersWhoShouldDecide.every((p) => decisions[p.id] !== undefined);

    if (allDecided) {
      // Transition to playing with proper round state reset
      set({
        session: {
          ...session,
          screen: 'playing',
          players: players.map((p) => ({
            ...p,
            currentAnswer: null,
            hasAnswered: false,
          })),
          currentPlayerIndex: 0,
          allAnswersIn: false,
          timerStarted: false,
          bankingDecisions: {},
        },
      });
    } else {
      set({
        session: {
          ...session,
          players,
          bankingDecisions: decisions,
        },
      });
    }
  },

  proceedToNextRound: () => {
    const { session } = get();
    if (!session) return;

    const tiers = session.settings.mode === 'quick' ? [...QUICK_TIERS] : [...DIFFICULTY_TIERS];
    const nextRound = session.currentRound + 1;
    const activePlayers = session.players.filter((p) => !p.isEliminated && !p.isBanked);

    // Game over conditions
    if (nextRound >= tiers.length || activePlayers.length === 0) {
      set({ session: { ...session, screen: 'results' } });
      return;
    }

    // Check if banking should be offered (at thresholds: after rounds 3, 5, 7, 9)
    const bankingRounds = [3, 5, 7, 9];
    if (session.settings.bankingEnabled && bankingRounds.includes(nextRound) && activePlayers.length > 1) {
      set({
        session: {
          ...session,
          screen: 'banking',
          currentRound: nextRound,
          currentPlayerIndex: 0,
          allAnswersIn: false,
          timerStarted: false,
          bankingDecisions: {},
          players: session.players.map((p) => ({
            ...p,
            currentAnswer: null,
            hasAnswered: false,
          })),
        },
      });
      return;
    }

    set({
      session: {
        ...session,
        screen: 'playing',
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
  },

  setScreen: (screen) => {
    const { session } = get();
    if (!session) return;
    set({ session: { ...session, screen } });
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
    return session.players.filter((p) => !p.isEliminated && !p.isBanked);
  },

  getTiers: () => {
    const { session } = get();
    if (!session) return DIFFICULTY_TIERS;
    return session.settings.mode === 'quick' ? QUICK_TIERS : DIFFICULTY_TIERS;
  },

  getCurrentDifficulty: () => {
    const { session } = get();
    if (!session) return 90;
    const tiers = session.settings.mode === 'quick' ? [...QUICK_TIERS] : [...DIFFICULTY_TIERS];
    return tiers[session.currentRound] ?? 90;
  },

  getCurrentPoints: () => {
    const { session } = get();
    if (!session) return 0;
    const tiers = session.settings.mode === 'quick' ? [...QUICK_TIERS] : [...DIFFICULTY_TIERS];
    const difficulty = tiers[session.currentRound];
    return POINTS_PER_ROUND[difficulty] ?? 0;
  },
}));
