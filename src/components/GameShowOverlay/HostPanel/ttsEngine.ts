import { useOverlayStore } from '../../../stores/overlayStore';

export type Tier = 'warmup' | 'midgame' | 'pressure' | 'gauntlet';

const TIER_VOICE_CONFIG: Record<Tier, { rate: number; pitch: number }> = {
  warmup:   { rate: 1.0,  pitch: 1.0 },
  midgame:  { rate: 1.05, pitch: 1.0 },
  pressure: { rate: 0.9,  pitch: 0.9 },
  gauntlet: { rate: 0.8,  pitch: 0.8 },
};

let selectedVoice: SpeechSynthesisVoice | null = null;

function getEnglishVoice(): SpeechSynthesisVoice | null {
  if (selectedVoice) return selectedVoice;
  const voices = window.speechSynthesis.getVoices();
  selectedVoice =
    voices.find((v) => v.lang.startsWith('en') && v.localService) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0] ??
    null;
  return selectedVoice;
}

// Pre-load voices (some browsers need this)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    selectedVoice = null;
    getEnglishVoice();
  };
}

export function speak(text: string, tier: Tier): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel any in-progress speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;

    const config = TIER_VOICE_CONFIG[tier];
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = useOverlayStore.getState().masterVolume;

    const setHostSpeaking = useOverlayStore.getState().setHostSpeaking;

    utterance.onstart = () => setHostSpeaking(true);
    utterance.onend = () => {
      setHostSpeaking(false);
      resolve();
    };
    utterance.onerror = () => {
      setHostSpeaking(false);
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function cancelSpeech(): void {
  window.speechSynthesis?.cancel();
  useOverlayStore.getState().setHostSpeaking(false);
}
