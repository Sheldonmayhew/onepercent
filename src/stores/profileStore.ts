import { create } from 'zustand';
import { generateId } from '../utils/helpers';

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestScore: number;
  questionsCorrect: number;
  questionsAnswered: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  colour: string;
  createdAt: string;
  stats: PlayerStats;
}

const STORAGE_KEY = 'onepercent_profile';

function loadProfile(): PlayerProfile | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveProfile(profile: PlayerProfile | null) {
  if (profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

interface ProfileStore {
  profile: PlayerProfile | null;
  createProfile: (name: string, avatar: string, colour: string) => void;
  updateProfile: (updates: Partial<Pick<PlayerProfile, 'name' | 'avatar' | 'colour'>>) => void;
  updateStats: (gameScore: number, won: boolean, questionsCorrect: number, questionsAnswered: number) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: loadProfile(),

  createProfile: (name, avatar, colour) => {
    const profile: PlayerProfile = {
      id: generateId(),
      name,
      avatar,
      colour,
      createdAt: new Date().toISOString(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        highestScore: 0,
        questionsCorrect: 0,
        questionsAnswered: 0,
      },
    };
    saveProfile(profile);
    set({ profile });
  },

  updateProfile: (updates) => {
    const { profile } = get();
    if (!profile) return;
    const updated = { ...profile, ...updates };
    saveProfile(updated);
    set({ profile: updated });
  },

  updateStats: (gameScore, won, questionsCorrect, questionsAnswered) => {
    const { profile } = get();
    if (!profile) return;
    const updated = {
      ...profile,
      stats: {
        gamesPlayed: profile.stats.gamesPlayed + 1,
        gamesWon: profile.stats.gamesWon + (won ? 1 : 0),
        totalScore: profile.stats.totalScore + gameScore,
        highestScore: Math.max(profile.stats.highestScore, gameScore),
        questionsCorrect: profile.stats.questionsCorrect + questionsCorrect,
        questionsAnswered: profile.stats.questionsAnswered + questionsAnswered,
      },
    };
    saveProfile(updated);
    set({ profile: updated });
  },

  clearProfile: () => {
    saveProfile(null);
    set({ profile: null });
  },
}));
