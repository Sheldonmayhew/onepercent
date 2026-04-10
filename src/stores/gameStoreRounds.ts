import type { GameSession, QuestionPack } from '../types';
import { DIFFICULTY_TIERS } from '../types';
import { generateId, selectQuestionsForGame } from '../utils/helpers';
import { ROUND_TYPE_SEQUENCE } from '../roundTypes/sequence';
import { getRoundDefinition } from '../roundTypes/registry';

export function computeStartGame(
  session: GameSession,
  packs: QuestionPack[],
): Partial<GameSession> {
  const questions = selectQuestionsForGame(packs.length > 0 ? packs : [session.pack]);

  const roundTypeId = session.roundTypeSequence[0];
  const roundDef = getRoundDefinition(roundTypeId);
  const firstQuestion = questions[0]?.[0];
  const initialState = firstQuestion ? roundDef.createInitialState(session.players, firstQuestion) : null;

  return {
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
  };
}

export function computeProceedToNextRound(
  session: GameSession,
): { update: Partial<GameSession>; result: 'next_question' | 'next_round' | 'done' } {
  const roundQuestions = session.selectedQuestions[session.currentRound];
  const nextQuestionIdx = session.currentQuestionInRound + 1;

  // More questions in this round?
  if (roundQuestions && nextQuestionIdx < roundQuestions.length) {
    return {
      update: {
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
      result: 'next_question',
    };
  }

  // Move to next round
  const nextRound = session.currentRound + 1;

  if (nextRound >= DIFFICULTY_TIERS.length) {
    return { update: {}, result: 'done' };
  }

  const roundTypeId = session.roundTypeSequence[nextRound];
  const roundDef = getRoundDefinition(roundTypeId);
  const nextRoundQuestions = session.selectedQuestions[nextRound];
  const firstQuestion = nextRoundQuestions?.[0];
  const initialState = firstQuestion ? roundDef.createInitialState(session.players, firstQuestion) : null;

  return {
    update: {
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
    result: 'next_round',
  };
}

export function buildResetForReplay(
  session: GameSession,
  packs: QuestionPack[],
  packIds: string[],
): Partial<GameSession> | null {
  const filtered = packs.filter((p) => packIds.includes(p.pack_id));
  if (filtered.length === 0) return null;

  return {
    id: generateId(),
    pack: filtered[0],
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
  };
}
