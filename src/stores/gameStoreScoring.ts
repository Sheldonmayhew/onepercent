import type {
  GameSession,
  Player,
  RoundResult,
  Team,
} from '../types';
import {
  POINTS_PER_ROUND,
  DIFFICULTY_TIERS,
  getQuestionMultiplier,
} from '../types';
import { checkAnswer } from '../utils/helpers';
import { getRoundDefinition } from '../roundTypes/registry';

interface RevealResult {
  updatedPlayers: Player[];
  roundResult: RoundResult;
  updatedTeams: Team[];
  updatedRoundState?: unknown;
}

export function computeRevealAnswers(session: GameSession): RevealResult | null {
  const roundQuestions = session.selectedQuestions[session.currentRound];
  const question = roundQuestions?.[session.currentQuestionInRound];
  if (!question) return null;

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
    pointsAwarded: basePoints,
    scoreDeltas: Object.fromEntries(scoreUpdates.map((u) => [u.playerId, u.delta])),
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

  // Let the round type update its own state after scoring (e.g. streak multipliers)
  const updatedRoundState = roundDef.afterScore
    ? roundDef.afterScore(session.activeRoundState, session.players, question, scoreUpdates)
    : undefined;

  return { updatedPlayers, roundResult, updatedTeams, updatedRoundState };
}
