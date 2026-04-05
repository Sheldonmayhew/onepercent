export type QuestionType = 'multiple_choice' | 'numeric_input' | 'image_based' | 'sequence';

export interface Question {
  id: string;
  difficulty: number;
  type: QuestionType;
  time_limit_seconds: number;
  question: string;
  options?: string[];
  correct_answer: number | string;
  explanation: string;
  image_url?: string | null;
  sequence_items?: string[];
}

export interface QuestionPack {
  pack_id: string;
  name: string;
  description: string;
  author: string;
  question_count: number;
  questions: Question[];
}

export type GameMode = 'classic' | 'quick' | 'practice';
export type EliminationRule = 'zero_score' | 'keep_last_cleared';
export type TimerSpeed = 'standard' | 'relaxed' | 'pressure';
export type GameScreen = 'landing' | 'lobby' | 'playing' | 'reveal' | 'banking' | 'results';

export interface GameSettings {
  mode: GameMode;
  eliminationRule: EliminationRule;
  bankingEnabled: boolean;
  soundEnabled: boolean;
  timerSpeed: TimerSpeed;
  packId: string;
}

export interface Player {
  id: string;
  name: string;
  colour: string;
  avatar: string;
  score: number;
  isEliminated: boolean;
  isBanked: boolean;
  currentAnswer: string | number | null;
  hasAnswered: boolean;
  lastCorrectRound: number;
}

export interface RoundResult {
  roundIndex: number;
  difficulty: number;
  question: Question;
  correctPlayers: string[];
  eliminatedPlayers: string[];
  bankedPlayers: string[];
}

export interface GameSession {
  id: string;
  pack: QuestionPack;
  players: Player[];
  currentRound: number;
  screen: GameScreen;
  settings: GameSettings;
  roundHistory: RoundResult[];
  selectedQuestions: Question[];
  currentPlayerIndex: number;
  allAnswersIn: boolean;
}

export const DIFFICULTY_TIERS = [90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1] as const;
export const QUICK_TIERS = [90, 70, 50, 20, 1] as const;

export const POINTS_PER_ROUND: Record<number, number> = {
  90: 100,
  80: 200,
  70: 300,
  60: 500,
  50: 1_000,
  40: 2_000,
  30: 5_000,
  20: 10_000,
  10: 25_000,
  5: 50_000,
  1: 100_000,
};

export const TIMER_DURATIONS: Record<TimerSpeed, number> = {
  standard: 30,
  relaxed: 45,
  pressure: 15,
};

export const PLAYER_COLOURS = [
  '#00E5FF', // cyan
  '#FFD700', // gold
  '#FF2D6B', // pink
  '#00FF88', // green
  '#A855F7', // purple
  '#FF8C00', // orange
  '#E879F9', // fuchsia
  '#38BDF8', // sky
];

export const PLAYER_AVATARS = ['🦁', '🐆', '🦏', '🐘', '🦒', '🦓', '🐊', '🦅'];
