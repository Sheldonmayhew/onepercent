import type { GameSession, QuestionPack } from '../types';
import { DIFFICULTY_TIERS } from '../types';
import { generateId, selectQuestionsForGame } from '../utils/helpers';
import { ROUND_TYPE_SEQUENCE } from '../roundTypes/sequence';
import { getRoundDefinition } from '../roundTypes/registry';
import { pickRandomPacks } from '../roundTypes/definitions/switchagories';

/** Inject packOptions into Switchagories initial state if applicable */
function injectPackOptions(
  state: unknown,
  roundTypeId: string,
  packNames: string[],
): unknown {
  if (roundTypeId === 'switchagories' && state && typeof state === 'object') {
    return { ...state, packOptions: pickRandomPacks(packNames) };
  }
  return state;
}

export function computeStartGame(
  session: GameSession,
  packs: QuestionPack[],
  allPackNames: string[],
  preGeneratedQuestions?: import('../types').Question[][],
): Partial<GameSession> {
  const activePacks = packs.length > 0 ? packs : [session.pack];
  const questions = preGeneratedQuestions ?? selectQuestionsForGame(activePacks, session.players.length);
  const packNames = allPackNames;

  const roundTypeId = session.roundTypeSequence[0];
  const roundDef = getRoundDefinition(roundTypeId);
  const firstQuestion = questions[0]?.[0];
  let initialState = firstQuestion ? roundDef.createInitialState(session.players, firstQuestion, 0) : null;
  initialState = injectPackOptions(initialState, roundTypeId, packNames);

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
  packNames?: string[],
): { update: Partial<GameSession>; result: 'next_question' | 'next_round' | 'done' } {
  const roundQuestions = session.selectedQuestions[session.currentRound];
  const nextQuestionIdx = session.currentQuestionInRound + 1;

  // More questions in this round?
  if (roundQuestions && nextQuestionIdx < roundQuestions.length) {
    const roundTypeId = session.roundTypeSequence[session.currentRound];
    const roundDef = getRoundDefinition(roundTypeId);
    const nextQuestion = roundQuestions[nextQuestionIdx];

    const update: Partial<GameSession> = {
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
    };

    // Reset round state per question for round types that need it (e.g. Switchagories)
    if (roundDef.resetStatePerQuestion && nextQuestion) {
      let newState: unknown = roundDef.createInitialState(session.players, nextQuestion, nextQuestionIdx);
      newState = injectPackOptions(newState, roundTypeId, packNames ?? []);
      update.activeRoundState = newState;
    }

    return { update, result: 'next_question' };
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
  let initialState: unknown = firstQuestion ? roundDef.createInitialState(session.players, firstQuestion, 0) : null;
  initialState = injectPackOptions(initialState, roundTypeId, packNames ?? []);

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
