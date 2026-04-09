import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface OverlaySettings {
  masterVolume: number;       // 0-1
  musicEnabled: boolean;
  crowdEnabled: boolean;
  hostVoiceEnabled: boolean;
  hostSpeaking: boolean;      // true while TTS is active — used by MusicManager to duck
}

interface OverlayStore extends OverlaySettings {
  setMasterVolume: (v: number) => void;
  setMusicEnabled: (v: boolean) => void;
  setCrowdEnabled: (v: boolean) => void;
  setHostVoiceEnabled: (v: boolean) => void;
  setHostSpeaking: (v: boolean) => void;
}

export const useOverlayStore = create<OverlayStore>()(subscribeWithSelector((set) => ({
  masterVolume: 0.8,
  musicEnabled: true,
  crowdEnabled: true,
  hostVoiceEnabled: true,
  hostSpeaking: false,

  setMasterVolume: (masterVolume) => set({ masterVolume }),
  setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
  setCrowdEnabled: (crowdEnabled) => set({ crowdEnabled }),
  setHostVoiceEnabled: (hostVoiceEnabled) => set({ hostVoiceEnabled }),
  setHostSpeaking: (hostSpeaking) => set({ hostSpeaking }),
})));
