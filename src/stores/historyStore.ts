import { create } from 'zustand';
import type { GameMode } from '../types';
import { generateId } from '../utils/helpers';

export interface GameRecordPlayer {
  id: string;
  name: string;
  avatar: string;
  finalScore: number;
  questionsCorrect: number;
  questionsAnswered: number;
}

export interface GameRecord {
  id: string;
  date: string;
  mode: GameMode;
  packIds: string[];
  packNames: string[];
  playerCount: number;
  rounds: number;
  players: GameRecordPlayer[];
  winnerId: string;
}

const STORAGE_KEY = 'onepercent_history';
const MAX_GAMES = 50;

function loadHistory(): GameRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: GameRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

interface HistoryStore {
  records: GameRecord[];
  addRecord: (record: Omit<GameRecord, 'id' | 'date'>) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  records: loadHistory(),

  addRecord: (record) => {
    const newRecord: GameRecord = {
      ...record,
      id: generateId(),
      date: new Date().toISOString(),
    };
    const updated = [newRecord, ...get().records].slice(0, MAX_GAMES);
    saveHistory(updated);
    set({ records: updated });
  },

  clearHistory: () => {
    saveHistory([]);
    set({ records: [] });
  },
}));
