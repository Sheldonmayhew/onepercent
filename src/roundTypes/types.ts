import type { LazyExoticComponent, FC } from 'react';
import type {
  RoundTypeId,
  QuestionFormat,
  Player,
  Question,
  PlayerScoreUpdate,
} from '../types';

// --- Round Theme ---

export interface RoundTheme {
  primary: string;
  accent: string;
  icon: string;
  introAnimation: 'slam' | 'slide' | 'pulse' | 'countdown' | 'spotlight' | 'heartbeat' | 'fire';
  soundCues: {
    intro: string;
    correct: string;
    wrong: string;
    special?: string;
  };
}

// --- Slot Prop Types ---

export interface PlayerInputProps<TState = unknown> {
  question: Question;
  players: Player[];
  roundState: TState;
  onSubmit: (playerId: string, answer: string | number) => void;
  onBuzzIn?: (playerId: string, timestamp: number, answer: string | number) => void;
  onUpdateState: (updater: (prev: TState) => TState) => void;
  playerId: string;
  timerStarted: boolean;
  allAnswersIn: boolean;
  isHost: boolean;
}

export interface TvPlayProps<TState = unknown> {
  question: Question;
  players: Player[];
  roundState: TState;
  timerStarted: boolean;
  allAnswersIn: boolean;
  roundIndex: number;
  difficulty: number;
  points: number;
  theme: RoundTheme;
}

export interface TvIntroProps {
  roundIndex: number;
  totalRounds: number;
  difficulty: number;
  points: number;
  roundName: string;
  tagline: string;
  theme: RoundTheme;
}

export interface TvRevealProps<TState = unknown> {
  question: Question;
  players: Player[];
  roundState: TState;
  correctAnswer: string;
  explanation: string;
  correctPlayerIds: string[];
  incorrectPlayerIds: string[];
  scoreUpdates: PlayerScoreUpdate[];
  theme: RoundTheme;
  teams?: { id: string; name: string; colour: string; playerIds: string[]; score: number }[];
}

export interface HostControlProps<TState = unknown> {
  question: Question;
  players: Player[];
  roundState: TState;
  onUpdateState: (updater: (prev: TState) => TState) => void;
  timerStarted: boolean;
  allAnswersIn: boolean;
}

// --- Round Type Definition ---

export interface RoundTypeDefinition<TState = void> {
  id: RoundTypeId;
  name: string;
  tagline: string;
  tier: 'warmup' | 'midgame' | 'pressure' | 'gauntlet';
  difficulty: number;

  theme: RoundTheme;
  timer: { duration: number; autoStart: boolean; countUp?: boolean };
  questionFormat: QuestionFormat;

  createInitialState: (players: Player[], question: Question, questionIndex?: number) => TState;

  score: (
    players: Player[],
    question: Question,
    state: TState,
    basePoints: number
  ) => PlayerScoreUpdate[];

  afterScore?: (
    state: TState,
    players: Player[],
    question: Question,
    scoreUpdates: PlayerScoreUpdate[]
  ) => TState;

  getQuestionCount?: (playerCount: number) => number;
  resetStatePerQuestion?: boolean;

  broadcastEvents: readonly string[];

  slots: {
    PlayerInput: LazyExoticComponent<FC<PlayerInputProps<TState>>>;
    TvPlay: LazyExoticComponent<FC<TvPlayProps<TState>>>;
    TvIntro: LazyExoticComponent<FC<TvIntroProps>>;
    TvReveal: LazyExoticComponent<FC<TvRevealProps<TState>>>;
    HostControls?: LazyExoticComponent<FC<HostControlProps<TState>>>;
  };
}
