export type QuestionType = 'multiple_choice' | 'numeric_input' | 'image_based' | 'sequence';

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

export const DEFAULT_TIMER_SECONDS = 30;

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
}

export interface GameSession {
  id: string;
  pack: QuestionPack;
  players: Player[];
  currentRound: number;
  settings: GameSettings;
  roundHistory: RoundResult[];
  selectedQuestions: Question[];
  currentPlayerIndex: number;
  allAnswersIn: boolean;
  timerStarted: boolean;
  teams: Team[];
  roomCode?: string;
  multiplayerMode?: MultiplayerMode;
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
