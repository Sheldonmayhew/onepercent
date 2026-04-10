export type QuestionType = 'multiple_choice' | 'numeric_input' | 'image_based' | 'sequence';
export type GameMode = 'classic' | 'quick';

export type QuestionFormat =
  | 'standard_mc'
  | 'timed_reveal'
  | 'categorized'
  | 'multi_select'
  | 'ranking'
  | 'progressive_reveal';

export type RoundTypeId =
  | 'point_builder'
  | 'quickstarter'
  | 'snap'
  | 'switchagories'
  | 'pass_the_bomb'
  | 'grab_bag'
  | 'close_call'
  | 'point_stealer'
  | 'look_before_you_leap'
  | 'hot_seat'
  | 'final_round';

export interface Question {
  id: string;
  difficulty: number;
  type: QuestionType;
  time_limit_seconds: number;
  question: string;
  options?: string[];
  correct_answer: number | string;
  error_range?: number;
  explanation: string;
  image_url?: string | null;
  sequence_items?: string[];
  category?: string;

  // Round type format fields
  question_format?: QuestionFormat;
  correct_answers?: number[];        // multi_select: indices of all correct options
  ranking_criterion?: string;        // ranking: e.g. "oldest to newest"
  ranking_order?: number[];          // ranking: correct order of option indices
  reveal_delay_ms?: number;          // timed_reveal: ms between option reveals
  reveal_chunks?: string[];          // progressive_reveal: question text chunks
  categories?: string[];             // categorized: available category labels
}

export interface QuestionPack {
  pack_id: string;
  name: string;
  description: string;
  author: string;
  question_count: number;
  questions: Question[];
}

export type MultiplayerMode = 'individual' | 'team';

export const DEFAULT_TIMER_SECONDS = 45;

export interface GameSettings {
  soundEnabled: boolean;
  packIds: string[];
  teamMode: boolean;
  teamCount: 2 | 3 | 4;
}

export interface Player {
  id: string;
  name: string;
  colour: string;
  avatar: string;
  score: number;
  currentAnswer: string | number | null;
  hasAnswered: boolean;
  isHost?: boolean;
  teamId?: string | null;
  answerTimestamp?: number;
  eliminated?: boolean;
  selectedCategory?: string;
  stealTarget?: string;
}

export interface PlayerScoreUpdate {
  playerId: string;
  delta: number;
  stealFromId?: string;
}

export interface Team {
  id: string;
  name: string;
  colour: string;
  playerIds: string[];
  score: number;
}

export interface RoundResult {
  roundIndex: number;
  difficulty: number;
  question: Question;
  correctPlayers: string[];
  incorrectPlayers: string[];
  pointsAwarded: number;
  /** Per-player score deltas (accounts for round-type multipliers, streaks, etc.) */
  scoreDeltas: Record<string, number>;
}

export interface GameSession {
  id: string;
  pack: QuestionPack;
  players: Player[];
  currentRound: number;
  currentQuestionInRound: number;
  settings: GameSettings;
  roundHistory: RoundResult[];
  selectedQuestions: Question[][];  // 2D: selectedQuestions[round][questionIndex]
  currentPlayerIndex: number;
  allAnswersIn: boolean;
  timerStarted: boolean;
  teams: Team[];
  roomCode?: string;
  multiplayerMode?: MultiplayerMode;
  roundTypeSequence: RoundTypeId[];
  activeRoundState: unknown;
}

export const DIFFICULTY_TIERS = [90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1] as const;
export const QUICK_TIERS = [90, 70, 50, 20, 1] as const;

export const POINTS_PER_ROUND: Record<number, number> = {
  90: 250,
  80: 500,
  70: 900,
  60: 1_600,
  50: 2_500,
  40: 3_700,
  30: 5_000,
  20: 7_000,
  10: 9_000,
  5: 12_000,
  1: 16_000,
};

// Questions per round, indexed by difficulty tier
export const QUESTIONS_PER_ROUND: Record<number, number> = {
  90: 4, 80: 4, 70: 4,     // Warm-up: 4 questions
  60: 3, 50: 3, 40: 3,     // Mid-game: 3 questions
  30: 2, 20: 2, 10: 2,     // Pressure: 2 questions
  5: 1, 1: 1,              // Gauntlet: 1 question
};

// Flat points per question — each question in a round is worth the same amount
export function getQuestionMultiplier(_questionIndex: number, _totalQuestions: number): number {
  return 1;
}

export const PLAYER_COLOURS = [
  '#4F46E5', // indigo
  '#EAB308', // gold
  '#EF4444', // red
  '#22C55E', // green
  '#7C3AED', // purple
  '#F97316', // orange
  '#D946EF', // fuchsia
  '#3B82F6', // blue
];

export const PLAYER_AVATARS = ['🦁', '🐆', '🦏', '🐘', '🦒', '🦓', '🐊', '🦅'];

export const TEAM_COLOURS = ['#FF4444', '#4488FF', '#44DD44', '#FFAA00'];
export const TEAM_NAMES = ['Red Team', 'Blue Team', 'Green Team', 'Gold Team'];

export const AVAILABLE_EMOJIS = [
  // Animals
  '🦁', '🐆', '🦏', '🐘', '🦒', '🦓', '🐊', '🦅', '🐍', '🦈', '🐺', '🦊', '🐻', '🐼', '🦄', '🐲',
  // Faces
  '😎', '🤓', '🥸', '🤠', '🥳', '🤩', '😈', '👻', '💀', '🤖', '👽', '🎃',
  // Objects
  '🔥', '⚡', '💎', '👑', '🎯', '🏆', '🎪', '🚀', '💣', '🎸',
  // Symbols
  '⭐', '💫', '✨', '🌟', '💥', '🎵', '🌈', '💜',
];
