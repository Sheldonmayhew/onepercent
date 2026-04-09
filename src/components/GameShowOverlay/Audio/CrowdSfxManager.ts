import { Howl } from 'howler';
import { useOverlayStore } from '../../../stores/overlayStore';

export type CrowdSfx =
  | 'cheer'
  | 'gasp'
  | 'ooh'
  | 'aww'
  | 'applause'
  | 'laugh'
  | 'tension_drum'
  | 'heartbeat';

// These paths will need actual audio files placed in public/audio/crowd/
const SFX_PATHS: Record<CrowdSfx, string> = {
  cheer: '/audio/crowd/cheer.mp3',
  gasp: '/audio/crowd/gasp.mp3',
  ooh: '/audio/crowd/ooh.mp3',
  aww: '/audio/crowd/aww.mp3',
  applause: '/audio/crowd/applause.mp3',
  laugh: '/audio/crowd/laugh.mp3',
  tension_drum: '/audio/crowd/tension_drum.mp3',
  heartbeat: '/audio/crowd/heartbeat.mp3',
};

const VOLUME = 0.7;

class CrowdSfxManager {
  private sounds = new Map<CrowdSfx, Howl>();
  private loopingId: number | null = null;
  private loopingSound: Howl | null = null;

  init() {
    for (const [name, path] of Object.entries(SFX_PATHS)) {
      this.sounds.set(name as CrowdSfx, new Howl({
        src: [path],
        volume: VOLUME,
        preload: true,
      }));
    }
  }

  play(sfx: CrowdSfx) {
    if (!useOverlayStore.getState().crowdEnabled) return;
    const sound = this.sounds.get(sfx);
    if (!sound) return;
    const vol = VOLUME * useOverlayStore.getState().masterVolume;
    sound.volume(vol);
    sound.play();
  }

  /** Start a looping SFX (e.g., heartbeat during final round) */
  startLoop(sfx: CrowdSfx) {
    if (!useOverlayStore.getState().crowdEnabled) return;
    this.stopLoop();
    const sound = this.sounds.get(sfx);
    if (!sound) return;
    const vol = VOLUME * useOverlayStore.getState().masterVolume * 0.5; // Loops are quieter
    sound.volume(vol);
    sound.loop(true);
    this.loopingId = sound.play();
    this.loopingSound = sound;
  }

  stopLoop() {
    if (this.loopingSound && this.loopingId != null) {
      this.loopingSound.stop(this.loopingId);
      this.loopingSound.loop(false);
    }
    this.loopingId = null;
    this.loopingSound = null;
  }

  destroy() {
    this.stopLoop();
    this.sounds.forEach((h) => h.unload());
    this.sounds.clear();
  }
}

// Singleton
export const crowdSfxManager = new CrowdSfxManager();
