import { Howl } from 'howler';
import { useOverlayStore } from '../../../stores/overlayStore';

type Tier = 'warmup' | 'midgame' | 'pressure' | 'gauntlet';

// These paths will need actual audio files placed in public/audio/music/
const TRACK_PATHS: Record<Tier, string> = {
  warmup: '/audio/music/warmup.mp3',
  midgame: '/audio/music/midgame.mp3',
  pressure: '/audio/music/pressure.mp3',
  gauntlet: '/audio/music/gauntlet.mp3',
};

const PLAY_VOLUME = 0.3;
const TRANSITION_VOLUME = 0.5;
const DUCK_VOLUME = 0.1;
const FADE_DURATION = 2000;

class MusicManager {
  private tracks = new Map<Tier, Howl>();
  private currentTier: Tier | null = null;
  private currentHowl: Howl | null = null;
  private targetVolume = PLAY_VOLUME;
  private unsubscribe: (() => void) | null = null;

  init() {
    // Pre-load all tracks (they won't play until explicitly started)
    for (const [tier, path] of Object.entries(TRACK_PATHS)) {
      this.tracks.set(tier as Tier, new Howl({
        src: [path],
        loop: true,
        volume: 0,
        preload: true,
      }));
    }

    // Subscribe to hostSpeaking changes for ducking
    this.unsubscribe = useOverlayStore.subscribe(
      (state) => state.hostSpeaking,
      (speaking) => {
        if (!this.currentHowl) return;
        const vol = speaking ? DUCK_VOLUME : this.targetVolume;
        this.currentHowl.fade(this.currentHowl.volume(), vol * this.getMasterVolume(), 300);
      }
    );
  }

  private getMasterVolume(): number {
    return useOverlayStore.getState().masterVolume;
  }

  play(tier: Tier) {
    if (!useOverlayStore.getState().musicEnabled) return;
    if (tier === this.currentTier && this.currentHowl?.playing()) return;

    const nextHowl = this.tracks.get(tier);
    if (!nextHowl) return;

    // Crossfade
    if (this.currentHowl && this.currentHowl.playing()) {
      this.currentHowl.fade(
        this.currentHowl.volume(),
        0,
        FADE_DURATION
      );
      const old = this.currentHowl;
      setTimeout(() => old.stop(), FADE_DURATION);
    }

    const vol = this.targetVolume * this.getMasterVolume();
    nextHowl.volume(0);
    nextHowl.play();
    nextHowl.fade(0, vol, FADE_DURATION);

    this.currentHowl = nextHowl;
    this.currentTier = tier;
  }

  setMode(mode: 'play' | 'transition') {
    this.targetVolume = mode === 'transition' ? TRANSITION_VOLUME : PLAY_VOLUME;
    if (this.currentHowl && this.currentHowl.playing()) {
      const vol = this.targetVolume * this.getMasterVolume();
      this.currentHowl.fade(this.currentHowl.volume(), vol, 500);
    }
  }

  briefSilence(durationMs = 1500) {
    if (!this.currentHowl) return;
    const vol = this.currentHowl.volume();
    this.currentHowl.fade(vol, 0, 300);
    setTimeout(() => {
      if (this.currentHowl) {
        const target = this.targetVolume * this.getMasterVolume();
        this.currentHowl.fade(0, target, 500);
      }
    }, durationMs);
  }

  stop() {
    this.currentHowl?.fade(this.currentHowl.volume(), 0, 500);
    setTimeout(() => {
      this.currentHowl?.stop();
      this.currentHowl = null;
      this.currentTier = null;
    }, 500);
  }

  destroy() {
    this.unsubscribe?.();
    this.tracks.forEach((h) => h.unload());
    this.tracks.clear();
    this.currentHowl = null;
    this.currentTier = null;
  }
}

// Singleton
export const musicManager = new MusicManager();
