import type {
  GameSession,
  GameSettings,
  MultiplayerMode,
  QuestionPack,
  Team,
} from '../types';
import { TEAM_COLOURS, TEAM_NAMES } from '../types';
import { generateId } from '../utils/helpers';
import { ROUND_TYPE_SEQUENCE } from '../roundTypes/sequence';

export function buildQuickPlaySession(
  packs: QuestionPack[],
  packIds: string[],
): GameSession | null {
  const filtered = packs.filter((p) => packIds.includes(p.pack_id));
  if (filtered.length === 0) return null;

  const pack = filtered[0];
  const settings: GameSettings = {
    soundEnabled: true,
    packIds,
    teamMode: false,
    teamCount: 2,
  };

  return {
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
  };
}

export function buildHostGameSession(
  packs: QuestionPack[],
  mode: MultiplayerMode,
  packIds: string[],
): GameSession | null {
  const filtered = packs.filter((p) => packIds.includes(p.pack_id));
  if (filtered.length === 0) return null;

  const pack = filtered[0];
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

  return {
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
  };
}
