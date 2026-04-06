import { create } from 'zustand';
import type { QuestionType } from '../types';

export type AppRole = 'host' | 'player' | 'spectator' | null;

export interface BroadcastPlayer {
  id: string;
  name: string;
  colour: string;
  avatar: string;
  score: number;
  hasAnswered: boolean;
}

export interface BroadcastRound {
  index: number;
  difficulty: number;
  points: number;
  totalRounds: number;
  timerDuration: number;
  categoryName?: string;
  question: {
    question: string;
    type: QuestionType;
    options?: string[];
    image_url?: string | null;
    sequence_items?: string[];
  };
}

export interface BroadcastReveal {
  correctAnswer: string;
  explanation: string;
  correctPlayerIds: string[];
  incorrectPlayerIds: string[];
}

export interface GameBroadcast {
  route: string;
  players: BroadcastPlayer[];
  round?: BroadcastRound;
  reveal?: BroadcastReveal;
  timerStarted?: boolean;
  packName?: string;
  teamMode?: boolean;
  teams?: { id: string; name: string; colour: string; playerIds: string[]; score: number }[];
}

interface MultiplayerStore {
  role: AppRole;
  roomCode: string | null;
  playerId: string | null;
  playerName: string | null;
  isConnected: boolean;
  error: string | null;

  // Player-side game state (received from host broadcasts)
  gameState: GameBroadcast | null;

  // Actions
  setRole: (role: AppRole) => void;
  setRoomCode: (code: string | null) => void;
  setPlayerInfo: (id: string, name: string) => void;
  setConnected: (val: boolean) => void;
  setError: (err: string | null) => void;
  setGameState: (state: GameBroadcast) => void;
  reset: () => void;
}

export const useMultiplayerStore = create<MultiplayerStore>((set) => ({
  role: null,
  roomCode: null,
  playerId: null,
  playerName: null,
  isConnected: false,
  error: null,
  gameState: null,

  setRole: (role) => set({ role }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayerInfo: (playerId, playerName) => set({ playerId, playerName }),
  setConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  setGameState: (gameState) => set({ gameState }),
  reset: () =>
    set({
      role: null,
      roomCode: null,
      playerId: null,
      playerName: null,
      isConnected: false,
      error: null,
      gameState: null,
    }),
}));
