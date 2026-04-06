# More Sounds — Implementation Spec

## Overview

Expand the sound design beyond the current procedural Web Audio tones. Add distinct sound effects for key game events to make the experience more immersive and exciting.

## Current State

The app uses `useSound.ts` with the Web Audio API (`AudioContext` + `OscillatorNode`) to generate simple tones. This works but sounds generic.

## Sound Event Map

| Event | Sound | Style |
|-------|-------|-------|
| Game start | Rising synth sweep | Energetic, builds anticipation |
| Round start | Short drumroll / stinger | Quick, attention-grabbing |
| Timer ticking (last 5s) | Clock tick, increasing tempo | Tension-building |
| Timer expired | Buzzer / horn | Abrupt, final |
| Answer submitted | Soft click / pop | Confirmation feedback |
| Correct answer reveal | Triumphant chime / ding | Positive, bright |
| Wrong answer reveal | Low buzz / descending tone | Negative but not harsh |
| Player eliminated | Dramatic thud | Impactful |
| Banking decision | Cash register / coin sound | Reward feeling |
| Final round intro | Epic build-up sting | Dramatic, climactic |
| Winner announcement | Victory fanfare | Celebratory |
| Player joined lobby | Notification ping | Welcoming |

## Implementation Approach

### Option A: Pre-recorded Audio Files (Recommended)
- Store short `.mp3` or `.webm` clips in `public/sounds/`
- Use `HTMLAudioElement` or a lightweight library for playback
- Total size budget: ~200KB for all clips
- Benefits: high-quality, professional-sounding effects

### Option B: Enhanced Web Audio Synthesis
- Keep current approach but add more complex waveforms, envelopes, and effects
- Benefits: zero network requests, tiny bundle
- Drawback: harder to achieve polished sound

**Recommendation:** Option A for most sounds, keep Option B for simple ticks/clicks.

## Sound Manager

Refactor `useSound.ts` into a more capable sound manager:

```typescript
type SoundEvent =
  | 'game_start' | 'round_start' | 'timer_tick' | 'timer_expired'
  | 'answer_submitted' | 'correct_reveal' | 'wrong_reveal'
  | 'eliminated' | 'banked' | 'final_round' | 'winner'
  | 'player_joined';

function playSound(event: SoundEvent): void;
function preloadSounds(): void; // call on app mount
```

- Preload all audio files on mount to avoid playback delays
- Respect the existing `soundEnabled` setting
- Volume levels per event (e.g., ticks quieter than fanfares)

## Files Changed

| File | Change |
|------|--------|
| `public/sounds/` | New directory with audio clips (~12 files) |
| `src/hooks/useSound.ts` | Refactor to sound manager with event-based API and audio file playback |
| `src/components/Game/GameScreen.tsx` | Trigger `round_start` and `final_round` sounds |
| `src/components/Game/Timer.tsx` | Trigger `timer_tick` (last 5s) and `timer_expired` |
| `src/components/Game/AnswerInput.tsx` | Trigger `answer_submitted` |
| `src/components/Game/RevealScreen.tsx` | Trigger `correct_reveal`, `wrong_reveal`, `eliminated` |
| `src/components/Game/BankingPhase.tsx` | Trigger `banked` |
| `src/components/Results/Results.tsx` | Trigger `winner` |
| `src/components/Lobby/Lobby.tsx` | Trigger `player_joined` |
| `src/App.tsx` | Call `preloadSounds()` on mount |
