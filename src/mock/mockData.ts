import type { GameSession, Player, Question, QuestionPack, Team, RoundResult } from '../types';
import { DIFFICULTY_TIERS, POINTS_PER_ROUND, QUESTIONS_PER_ROUND, getQuestionMultiplier } from '../types';
import { ROUND_TYPE_SEQUENCE } from '../roundTypes/sequence';
import { getRoundDefinition } from '../roundTypes/registry';
import type { GameBroadcast, BroadcastPlayer, BroadcastRound, BroadcastReveal } from '../stores/multiplayerStore';

// ── Mock players ──────────────────────────────────────────────

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'Sipho', colour: '#4F46E5', avatar: '🦁', score: 4200, currentAnswer: null, hasAnswered: false, isHost: true, teamId: 'team-1' },
  { id: 'p2', name: 'Naledi', colour: '#EAB308', avatar: '🐆', score: 3800, currentAnswer: null, hasAnswered: false, teamId: 'team-1' },
  { id: 'p3', name: 'Thabo', colour: '#EF4444', avatar: '🦏', score: 2900, currentAnswer: null, hasAnswered: true, teamId: 'team-2' },
  { id: 'p4', name: 'Zanele', colour: '#22C55E', avatar: '🐘', score: 5100, currentAnswer: null, hasAnswered: false, teamId: 'team-2' },
  { id: 'p5', name: 'Mandla', colour: '#7C3AED', avatar: '🦒', score: 1500, currentAnswer: null, hasAnswered: true },
  { id: 'p6', name: 'Lebo', colour: '#F97316', avatar: '🦓', score: 600, currentAnswer: null, hasAnswered: false },
];

export const MOCK_TEAMS: Team[] = [
  { id: 'team-1', name: 'Red Team', colour: '#FF4444', playerIds: ['p1', 'p2'], score: 8000 },
  { id: 'team-2', name: 'Blue Team', colour: '#4488FF', playerIds: ['p3', 'p4'], score: 8000 },
];

// ── Mock questions ────────────────────────────────────────────

const MOCK_QUESTION: Question = {
  id: 'mock-q1',
  difficulty: 50,
  type: 'multiple_choice',
  time_limit_seconds: 30,
  question: 'What percentage of South Africans can name all three capital cities of the country?',
  options: ['About 80%', 'About 50%', 'About 25%', 'About 10%'],
  correct_answer: 2,
  explanation: 'Only about 25% of South Africans can correctly name Pretoria (executive), Cape Town (legislative), and Bloemfontein (judicial) as the three capitals.',
  image_url: null,
};

const MOCK_QUESTION_NUMERIC: Question = {
  id: 'mock-q2',
  difficulty: 30,
  type: 'numeric_input',
  time_limit_seconds: 30,
  question: 'In what year did Nelson Mandela become President of South Africa?',
  options: undefined,
  correct_answer: 1994,
  error_range: 0,
  explanation: 'Nelson Mandela became the first democratically elected President of South Africa in 1994.',
  image_url: null,
};

// Build a 2D questions array for all 11 rounds
function buildMockQuestions(): Question[][] {
  return [...DIFFICULTY_TIERS].map((difficulty) => {
    const count = QUESTIONS_PER_ROUND[difficulty] ?? 1;
    return Array.from({ length: count }, (_, i) => ({
      ...MOCK_QUESTION,
      id: `mock-q-${difficulty}-${i}`,
      difficulty,
    }));
  });
}

// ── Mock pack ─────────────────────────────────────────────────

export const MOCK_PACK: QuestionPack = {
  pack_id: 'mock-pack',
  name: 'Mock Mzansi Mix',
  description: 'Mock question pack for previewing',
  author: 'Preview Mode',
  question_count: 55,
  questions: [MOCK_QUESTION, MOCK_QUESTION_NUMERIC],
};

// ── Mock session builder ──────────────────────────────────────

export function buildMockSession(overrides?: Partial<GameSession> & {
  roundIndex?: number;
  withTeams?: boolean;
  playerCount?: number;
  allAnswered?: boolean;
}): GameSession {
  const roundIndex = overrides?.roundIndex ?? 4; // default: round 5 (pass_the_bomb, 50%)
  const playerCount = overrides?.playerCount ?? 6;
  const players = MOCK_PLAYERS.slice(0, playerCount).map((p) => ({
    ...p,
    hasAnswered: overrides?.allAnswered ?? p.hasAnswered,
    currentAnswer: overrides?.allAnswered ? 2 : p.currentAnswer,
  }));
  const withTeams = overrides?.withTeams ?? false;

  return {
    id: 'mock-session',
    pack: MOCK_PACK,
    players,
    currentRound: roundIndex,
    currentQuestionInRound: 0,
    settings: {
      soundEnabled: false,
      packIds: ['mock-pack'],
      teamMode: withTeams,
      teamCount: 2,
    },
    roundHistory: buildMockRoundHistory(roundIndex, players),
    selectedQuestions: buildMockQuestions(),
    currentPlayerIndex: 0,
    allAnswersIn: overrides?.allAnswered ?? false,
    timerStarted: true,
    teams: withTeams ? MOCK_TEAMS : [],
    roomCode: 'MOCK42',
    multiplayerMode: withTeams ? 'team' : 'individual',
    roundTypeSequence: [...ROUND_TYPE_SEQUENCE],
    activeRoundState: null,
    ...overrides,
  };
}

function buildMockRoundHistory(upToRound: number, players: Player[]): RoundResult[] {
  return Array.from({ length: upToRound }, (_, i) => ({
    roundIndex: i,
    difficulty: [...DIFFICULTY_TIERS][i],
    question: { ...MOCK_QUESTION, id: `history-q-${i}`, difficulty: [...DIFFICULTY_TIERS][i] },
    correctPlayers: players.slice(0, Math.max(1, players.length - i)).map((p) => p.id),
    incorrectPlayers: players.slice(Math.max(1, players.length - i)).map((p) => p.id),
    pointsAwarded: 1000,
    scoreDeltas: Object.fromEntries(players.map((p) => [p.id, 0])),
  }));
}

// ── Mock broadcast builders (for player/TV views) ─────────────

export function buildMockBroadcastPlayers(players?: Player[]): BroadcastPlayer[] {
  return (players ?? MOCK_PLAYERS).map((p) => ({
    id: p.id,
    name: p.name,
    colour: p.colour,
    avatar: p.avatar,
    score: p.score,
    hasAnswered: p.hasAnswered,
    answerTimestamp: p.hasAnswered ? Date.now() - 5000 : undefined,
    correctCount: Math.floor(Math.random() * 5) + 1,
    totalQuestions: 8,
  }));
}

export function buildMockBroadcastRound(roundIndex?: number): BroadcastRound {
  const idx = roundIndex ?? 4;
  const difficulty = [...DIFFICULTY_TIERS][idx];
  const roundType = ROUND_TYPE_SEQUENCE[idx];
  return {
    index: idx,
    difficulty,
    points: POINTS_PER_ROUND[difficulty] ?? 1000,
    totalRounds: DIFFICULTY_TIERS.length,
    timerDuration: 30,
    categoryName: 'Mock Mzansi Mix',
    roundType,
    roundState: null,
    questionInRound: 0,
    questionsInRound: QUESTIONS_PER_ROUND[difficulty] ?? 1,
    question: {
      question: MOCK_QUESTION.question,
      type: MOCK_QUESTION.type,
      options: MOCK_QUESTION.options,
      image_url: null,
    },
  };
}

export function buildMockReveal(): BroadcastReveal {
  return {
    correctAnswer: 'About 25%',
    explanation: MOCK_QUESTION.explanation,
    correctPlayerIds: ['p1', 'p2', 'p4'],
    incorrectPlayerIds: ['p3', 'p5', 'p6'],
    roundType: 'pass_the_bomb',
    scoreUpdates: [
      { playerId: 'p1', delta: 1000 },
      { playerId: 'p2', delta: 1000 },
      { playerId: 'p4', delta: 1000 },
    ],
  };
}

export function buildMockGameState(route: string, overrides?: Partial<GameBroadcast>): GameBroadcast {
  return {
    route,
    players: buildMockBroadcastPlayers(),
    round: buildMockBroadcastRound(),
    timerStarted: true,
    packName: 'Mock Mzansi Mix',
    teamMode: false,
    teams: undefined,
    ...overrides,
  };
}

export function buildMockGameStateTeam(route: string, overrides?: Partial<GameBroadcast>): GameBroadcast {
  return {
    route,
    players: buildMockBroadcastPlayers(),
    round: buildMockBroadcastRound(),
    timerStarted: true,
    packName: 'Mock Mzansi Mix',
    teamMode: true,
    teams: MOCK_TEAMS.map((t) => ({ ...t })),
    ...overrides,
  };
}

// ── Persona definitions ──────────────────────────────────────

export type MockPersonaRole = 'quick-play' | 'host' | 'player' | 'tv';

export interface MockPersona {
  role: MockPersonaRole;
  playerId: string;
  playerName: string;
  avatar: string;
  colour: string;
}

export const MOCK_PERSONAS: MockPersona[] = MOCK_PLAYERS.map((p) => ({
  role: 'player' as MockPersonaRole,
  playerId: p.id,
  playerName: p.name,
  avatar: p.avatar,
  colour: p.colour,
}));

// ── Start points ─────────────────────────────────────────────

export type MockStartPoint =
  | 'lobby' | 'lobby-team'
  | 'round-0' | 'round-1' | 'round-2' | 'round-3' | 'round-4'
  | 'round-5' | 'round-6' | 'round-7' | 'round-8' | 'round-9' | 'round-10'
  | 'reveal' | 'results';

export interface StartPointOption {
  id: MockStartPoint;
  label: string;
  description: string;
}

const ROUND_LABELS: Record<number, string> = {
  0: 'Point Builder',
  1: 'Quickstarter',
  2: 'Snap',
  3: 'Switchagories',
  4: 'Pass The Bomb',
  5: 'Grab Bag',
  6: 'Close Call',
  7: 'Point Stealer',
  8: 'Look Before You Leap',
  9: 'Hot Seat',
  10: 'Final Round',
};

export function getStartPointsForRole(role: MockPersonaRole): StartPointOption[] {
  if (role === 'quick-play') {
    return [
      { id: 'round-0', label: 'Round 1 — Point Builder', description: '90% difficulty, warm-up' },
      { id: 'round-1', label: 'Round 2 — Quickstarter', description: '80% difficulty' },
      { id: 'round-2', label: 'Round 3 — Snap', description: '70% difficulty' },
      { id: 'round-3', label: 'Round 4 — Switchagories', description: '60% mid-game' },
      { id: 'round-4', label: 'Round 5 — Pass The Bomb', description: '50% mid-game' },
      { id: 'round-5', label: 'Round 6 — Grab Bag', description: '40% mid-game' },
      { id: 'round-6', label: 'Round 7 — Close Call', description: '30% pressure' },
      { id: 'round-7', label: 'Round 8 — Point Stealer', description: '20% pressure' },
      { id: 'round-8', label: 'Round 9 — Look Before You Leap', description: '10% pressure' },
      { id: 'round-9', label: 'Round 10 — Hot Seat', description: '5% gauntlet' },
      { id: 'round-10', label: 'Round 11 — Final Round', description: '1% gauntlet' },
      { id: 'reveal', label: 'Reveal', description: 'Answer reveal + scoring' },
      { id: 'results', label: 'Results', description: 'Final game results' },
    ];
  }

  const base: StartPointOption[] = [
    { id: 'lobby', label: 'Lobby', description: 'Waiting for players (individual)' },
    { id: 'lobby-team', label: 'Lobby (Teams)', description: 'Waiting for players with team picker' },
  ];

  const rounds: StartPointOption[] = Array.from({ length: 11 }, (_, i) => ({
    id: `round-${i}` as MockStartPoint,
    label: `Round ${i + 1} — ${ROUND_LABELS[i]}`,
    description: `${DIFFICULTY_TIERS[i]}% difficulty`,
  }));

  return [
    ...base,
    ...rounds,
    { id: 'reveal', label: 'Reveal', description: 'Answer reveal + scoring' },
    { id: 'results', label: 'Results', description: 'Final game results' },
  ];
}

// ── Store seeding helpers ─────────────────────────────────────

export interface MockSetup {
  route: string;
  session?: GameSession | null;
  gameState?: GameBroadcast | null;
  role?: 'host' | 'player' | 'spectator' | null;
  playerId?: string;
  playerName?: string;
  packs?: QuestionPack[];
}

function parseRoundIndex(startPoint: MockStartPoint): number {
  const match = startPoint.match(/^round-(\d+)$/);
  return match ? parseInt(match[1], 10) : 4;
}

export function buildMockSetup(role: MockPersonaRole, persona: MockPersona | null, startPoint: MockStartPoint): MockSetup {
  switch (role) {
    case 'quick-play': {
      const roundIdx = startPoint.startsWith('round-') ? parseRoundIndex(startPoint) : 0;
      if (startPoint === 'reveal') {
        return { route: '/quick-play/reveal', session: buildMockSession({ roundIndex: 1, playerCount: 1, allAnswered: true }) };
      }
      if (startPoint === 'results') {
        return { route: '/quick-play/results', session: buildMockSession({ roundIndex: 10, playerCount: 1, allAnswered: true }) };
      }
      return { route: '/quick-play/play', session: buildMockSession({ roundIndex: roundIdx, playerCount: 1 }) };
    }

    case 'host': {
      const withTeams = startPoint === 'lobby-team';
      const roundIdx = startPoint.startsWith('round-') ? parseRoundIndex(startPoint) : 0;

      if (startPoint === 'lobby' || startPoint === 'lobby-team') {
        return { route: '/host/lobby', session: buildMockSession({ roundIndex: 0, withTeams }), role: 'host' };
      }
      if (startPoint === 'reveal') {
        return { route: '/host/reveal', session: buildMockSession({ roundIndex: 5, allAnswered: true, withTeams }), role: 'host' };
      }
      if (startPoint === 'results') {
        return { route: '/host/results', session: buildMockSession({ roundIndex: 10, allAnswered: true, withTeams }), role: 'host' };
      }
      return { route: '/host/play', session: buildMockSession({ roundIndex: roundIdx, withTeams }), role: 'host' };
    }

    case 'player': {
      const pid = persona?.playerId ?? 'p2';
      const pname = persona?.playerName ?? 'Naledi';
      const roundIdx = startPoint.startsWith('round-') ? parseRoundIndex(startPoint) : 4;

      if (startPoint === 'lobby') {
        return {
          route: '/player/lobby',
          role: 'player', playerId: pid, playerName: pname,
          gameState: buildMockGameState('/player/lobby', { round: undefined, timerStarted: false }),
        };
      }
      if (startPoint === 'lobby-team') {
        return {
          route: '/player/lobby',
          role: 'player', playerId: pid, playerName: pname,
          gameState: buildMockGameStateTeam('/player/lobby', { round: undefined, timerStarted: false }),
        };
      }
      if (startPoint === 'reveal') {
        return {
          route: '/player/reveal',
          role: 'player', playerId: pid, playerName: pname,
          gameState: buildMockGameState('/player/reveal', { reveal: buildMockReveal(), round: buildMockBroadcastRound(roundIdx) }),
        };
      }
      if (startPoint === 'results') {
        return {
          route: '/player/results',
          role: 'player', playerId: pid, playerName: pname,
          gameState: buildMockGameState('/player/results', { round: undefined }),
        };
      }
      return {
        route: '/player/play',
        role: 'player', playerId: pid, playerName: pname,
        gameState: buildMockGameState('/player/play', { round: buildMockBroadcastRound(roundIdx) }),
      };
    }

    case 'tv': {
      const roundIdx = startPoint.startsWith('round-') ? parseRoundIndex(startPoint) : 4;

      if (startPoint === 'lobby' || startPoint === 'lobby-team') {
        return {
          route: '/tv/display',
          role: 'spectator',
          gameState: buildMockGameState('/host/lobby', { round: undefined, timerStarted: false }),
        };
      }
      if (startPoint === 'reveal') {
        return {
          route: '/tv/display',
          role: 'spectator',
          gameState: buildMockGameState('/host/reveal', { reveal: buildMockReveal(), round: buildMockBroadcastRound(roundIdx) }),
        };
      }
      if (startPoint === 'results') {
        return {
          route: '/tv/display',
          role: 'spectator',
          gameState: buildMockGameState('/host/results', { round: undefined }),
        };
      }
      return {
        route: '/tv/display',
        role: 'spectator',
        gameState: buildMockGameState('/host/play', { round: buildMockBroadcastRound(roundIdx) }),
      };
    }
  }
}

// ── Broadcast builder from session (used by mock driver) ─────

export function buildBroadcastFromSession(
  session: GameSession,
  route: string,
): GameBroadcast {
  const tiers = [...DIFFICULTY_TIERS];
  const difficulty = tiers[session.currentRound] ?? 90;
  const roundQuestions = session.selectedQuestions[session.currentRound];
  const totalQs = roundQuestions?.length ?? 1;
  const multiplier = getQuestionMultiplier(session.currentQuestionInRound, totalQs);
  const points = Math.round((POINTS_PER_ROUND[difficulty] ?? 0) * multiplier);
  const totalQuestions = session.roundHistory.length;

  const players: BroadcastPlayer[] = session.players.map((p) => ({
    id: p.id,
    name: p.name,
    colour: p.colour,
    avatar: p.avatar,
    score: p.score,
    hasAnswered: p.hasAnswered,
    answerTimestamp: p.answerTimestamp,
    eliminated: p.eliminated,
    selectedCategory: p.selectedCategory,
    correctCount: session.roundHistory.filter((r) => r.correctPlayers.includes(p.id)).length,
    totalQuestions,
  }));

  const currentRoundType = session.roundTypeSequence?.[session.currentRound] ?? 'point_builder';
  const roundDef = getRoundDefinition(currentRoundType);
  const currentQ = roundQuestions?.[session.currentQuestionInRound];
  const questionsInRound = roundQuestions?.length ?? 1;

  const broadcast: GameBroadcast = {
    route,
    players,
    timerStarted: session.timerStarted,
    packName: session.pack.name,
    teamMode: session.settings.teamMode,
    teams: session.teams,
  };

  // Include round data for play and round-intro routes
  if ((route.includes('/play') || route.includes('/round-intro')) && currentQ) {
    broadcast.round = {
      index: session.currentRound,
      difficulty,
      points,
      totalRounds: tiers.length,
      timerDuration: roundDef.timer.duration,
      categoryName: currentQ.category ?? session.pack?.name,
      roundType: currentRoundType,
      roundState: session.activeRoundState,
      questionFormat: currentQ.question_format,
      questionInRound: session.currentQuestionInRound,
      questionsInRound,
      question: {
        question: currentQ.question,
        type: currentQ.type,
        options: currentQ.options,
        image_url: currentQ.image_url,
        sequence_items: currentQ.sequence_items,
        correct_answers: currentQ.correct_answers,
        ranking_criterion: currentQ.ranking_criterion,
        reveal_delay_ms: currentQ.reveal_delay_ms,
        reveal_chunks: currentQ.reveal_chunks,
        categories: currentQ.categories,
      },
    };
  }

  // Include reveal data
  if (route.includes('/reveal')) {
    const lastRound = session.roundHistory[session.roundHistory.length - 1];
    if (lastRound) {
      const q = lastRound.question;
      let correctAnswer: string;

      if (q.question_format === 'multi_select' && q.correct_answers && q.options) {
        correctAnswer = q.correct_answers.map((i) => q.options![i]).join(', ');
      } else if (q.question_format === 'ranking' && q.ranking_order && q.options) {
        correctAnswer = q.ranking_order.map((i) => q.options![i]).join(' → ');
      } else if (q.type === 'multiple_choice' || q.type === 'image_based') {
        correctAnswer = q.options?.[Number(q.correct_answer)] ?? String(q.correct_answer);
      } else {
        correctAnswer = String(q.correct_answer);
      }

      broadcast.reveal = {
        correctAnswer,
        explanation: lastRound.question.explanation,
        correctPlayerIds: lastRound.correctPlayers,
        incorrectPlayerIds: lastRound.incorrectPlayers,
        roundType: currentRoundType,
        scoreUpdates: Object.entries(lastRound.scoreDeltas).map(([playerId, delta]) => ({
          playerId,
          delta,
        })),
      };

      // Include round data so reveal screen has context
      if (currentQ) {
        broadcast.round = {
          index: session.currentRound,
          difficulty,
          points,
          totalRounds: tiers.length,
          timerDuration: roundDef.timer.duration,
          categoryName: currentQ.category ?? session.pack?.name,
          roundType: currentRoundType,
          roundState: session.activeRoundState,
          questionFormat: currentQ.question_format,
          questionInRound: session.currentQuestionInRound,
          questionsInRound,
          question: {
            question: currentQ.question,
            type: currentQ.type,
            options: currentQ.options,
            image_url: currentQ.image_url,
            sequence_items: currentQ.sequence_items,
            correct_answers: currentQ.correct_answers,
            ranking_criterion: currentQ.ranking_criterion,
            reveal_delay_ms: currentQ.reveal_delay_ms,
            reveal_chunks: currentQ.reveal_chunks,
            categories: currentQ.categories,
          },
        };
      }
    }
  }

  return broadcast;
}

// ── Legacy helpers (kept for backwards compat) ───────────────

export type MockTarget =
  // Landing & setup
  | 'landing'
  // Quick Play
  | 'qp-categories' | 'qp-round-intro' | 'qp-play' | 'qp-reveal' | 'qp-results'
  // Host
  | 'host-mode' | 'host-categories' | 'host-lobby' | 'host-round-intro' | 'host-play' | 'host-reveal' | 'host-results'
  // Player
  | 'player-join' | 'player-lobby' | 'player-lobby-team' | 'player-round-intro' | 'player-play' | 'player-reveal' | 'player-results' | 'player-play-again'
  // TV
  | 'tv-join' | 'tv-lobby' | 'tv-round-intro' | 'tv-play' | 'tv-reveal' | 'tv-results';

export function getMockSetup(target: MockTarget): MockSetup {
  switch (target) {
    // ── Landing & setup ──
    case 'landing':
      return { route: '/' };

    // ── Quick Play ──
    case 'qp-categories':
      return { route: '/quick-play/categories', packs: [MOCK_PACK] };
    case 'qp-round-intro':
      return { route: '/quick-play/round-intro', session: buildMockSession({ roundIndex: 0, playerCount: 1 }) };
    case 'qp-play':
      return { route: '/quick-play/play', session: buildMockSession({ roundIndex: 0, playerCount: 1 }) };
    case 'qp-reveal':
      return { route: '/quick-play/reveal', session: buildMockSession({ roundIndex: 1, playerCount: 1, allAnswered: true }) };
    case 'qp-results':
      return { route: '/quick-play/results', session: buildMockSession({ roundIndex: 10, playerCount: 1, allAnswered: true }) };

    // ── Host ──
    case 'host-mode':
      return { route: '/host/mode' };
    case 'host-categories':
      return { route: '/host/categories', packs: [MOCK_PACK] };
    case 'host-lobby':
      return { route: '/host/lobby', session: buildMockSession({ roundIndex: 0, withTeams: true }), role: 'host' };
    case 'host-round-intro':
      return { route: '/host/round-intro', session: buildMockSession({ roundIndex: 4 }), role: 'host' };
    case 'host-play':
      return { route: '/host/play', session: buildMockSession({ roundIndex: 4 }), role: 'host' };
    case 'host-reveal':
      return { route: '/host/reveal', session: buildMockSession({ roundIndex: 5, allAnswered: true }), role: 'host' };
    case 'host-results':
      return { route: '/host/results', session: buildMockSession({ roundIndex: 10, allAnswered: true }), role: 'host' };

    // ── Player ──
    case 'player-join':
      return { route: '/join' };
    case 'player-lobby':
      return {
        route: '/player/lobby',
        role: 'player', playerId: 'p2', playerName: 'Naledi',
        gameState: buildMockGameState('/player/lobby', { round: undefined, timerStarted: false }),
      };
    case 'player-lobby-team':
      return {
        route: '/player/lobby',
        role: 'player', playerId: 'p2', playerName: 'Naledi',
        gameState: buildMockGameStateTeam('/player/lobby', { round: undefined, timerStarted: false }),
      };
    case 'player-round-intro':
      return {
        route: '/player/round-intro',
        role: 'player', playerId: 'p2', playerName: 'Naledi',
        gameState: buildMockGameState('/player/round-intro'),
      };
    case 'player-play':
      return {
        route: '/player/play',
        role: 'player', playerId: 'p2', playerName: 'Naledi',
        gameState: buildMockGameState('/player/play'),
      };
    case 'player-reveal':
      return {
        route: '/player/reveal',
        role: 'player', playerId: 'p2', playerName: 'Naledi',
        gameState: buildMockGameState('/player/reveal', { reveal: buildMockReveal() }),
      };
    case 'player-results':
      return {
        route: '/player/results',
        role: 'player', playerId: 'p2', playerName: 'Naledi',
        gameState: buildMockGameState('/player/results', { round: undefined }),
      };
    case 'player-play-again':
      return {
        route: '/player/play-again',
        role: 'player', playerId: 'p2', playerName: 'Naledi',
        gameState: buildMockGameState('/player/play-again', { round: undefined }),
      };

    // ── TV ──
    case 'tv-join':
      return { route: '/tv' };
    case 'tv-lobby':
      return {
        route: '/tv/display',
        role: 'spectator',
        gameState: buildMockGameState('/host/lobby', { round: undefined, timerStarted: false }),
      };
    case 'tv-round-intro':
      return {
        route: '/tv/display',
        role: 'spectator',
        gameState: buildMockGameState('/host/round-intro'),
      };
    case 'tv-play':
      return {
        route: '/tv/display',
        role: 'spectator',
        gameState: buildMockGameState('/host/play'),
      };
    case 'tv-reveal':
      return {
        route: '/tv/display',
        role: 'spectator',
        gameState: buildMockGameState('/host/reveal', { reveal: buildMockReveal() }),
      };
    case 'tv-results':
      return {
        route: '/tv/display',
        role: 'spectator',
        gameState: buildMockGameState('/host/results', { round: undefined }),
      };
  }
}
