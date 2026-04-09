# Game Show Presentation Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a layered game show presentation system to the TV display — host commentary with TTS, animated leaderboard, tier-based music & crowd SFX, and cinematic round transitions.

**Architecture:** A `TvOverlayManager` wraps the existing `TvDisplay` route, rendering independent overlay layers (host panel, leaderboard, transitions, audio) that each subscribe to `multiplayerStore.gameState` and react to phase/round changes. Existing round components are untouched.

**Tech Stack:** React 19, Zustand 5, Framer Motion 12, Howler.js 2.2 (already installed), Web Speech API (browser-native TTS), TypeScript 5.9

---

## File Structure

```
src/
├── components/GameShowOverlay/
│   ├── TvOverlayManager.tsx          # Wraps TvDisplay, renders all overlay layers
│   ├── HostPanel/
│   │   ├── HostPanel.tsx             # Avatar + speech bubble + name plate overlay
│   │   ├── hostCommentary.ts         # Commentary pools keyed by event + tier
│   │   └── ttsEngine.ts             # SpeechSynthesis wrapper with tier-based voice config
│   ├── Leaderboard/
│   │   ├── TvLeaderboard.tsx         # Slide-in/out leaderboard panel
│   │   └── RollingCounter.tsx        # Odometer-style animated number
│   ├── Transitions/
│   │   ├── RoundTransition.tsx       # Full-screen between-round cinematic sequence
│   │   └── DifficultyMeter.tsx       # Visual 90%→1% dot progression
│   └── Audio/
│       ├── MusicManager.ts           # Howler-based background music with crossfading
│       └── CrowdSfxManager.ts        # Howler-based event-triggered crowd reactions
├── stores/
│   └── overlayStore.ts               # Zustand store for overlay settings (volumes, toggles)
```

**Modified files:**
- `src/routes/TvDisplay.tsx` — wrap content in `TvOverlayManager`

---

## Task 1: Overlay Settings Store

**Files:**
- Create: `src/stores/overlayStore.ts`

This store holds all audio/overlay settings and provides the coordination state that overlay layers need (e.g., "is host speaking" for music ducking).

- [ ] **Step 1: Create the overlay store**

```typescript
// src/stores/overlayStore.ts
import { create } from 'zustand';

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

export const useOverlayStore = create<OverlayStore>((set) => ({
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
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/overlayStore.ts
git commit -m "feat: add overlay settings store for game show presentation layer"
```

---

## Task 2: TTS Engine

**Files:**
- Create: `src/components/GameShowOverlay/HostPanel/ttsEngine.ts`

Wraps `window.speechSynthesis` with tier-based voice configuration and a simple `speak()` API. Reports speaking state to `overlayStore`.

- [ ] **Step 1: Create the TTS engine**

```typescript
// src/components/GameShowOverlay/HostPanel/ttsEngine.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/HostPanel/ttsEngine.ts
git commit -m "feat: add TTS engine with tier-based voice configuration"
```

---

## Task 3: Host Commentary Data

**Files:**
- Create: `src/components/GameShowOverlay/HostPanel/hostCommentary.ts`

Pre-written commentary pools keyed by game event and tier. Supports template variables like `{player}`, `{amount}`.

- [ ] **Step 1: Create the commentary engine**

```typescript
// src/components/GameShowOverlay/HostPanel/hostCommentary.ts
import type { Tier } from './ttsEngine';

export type CommentaryEvent =
  | 'round_intro'
  | 'many_correct'
  | 'few_correct'
  | 'none_correct'
  | 'leader_wrong'
  | 'steal_executed'
  | 'elimination'
  | 'buzz_first'
  | 'final_survivor'
  | 'tier_transition'
  | 'round_complete';

interface CommentaryContext {
  roundName?: string;
  difficulty?: number;
  playerCount?: number;
  player?: string;
  stealer?: string;
  victim?: string;
  amount?: number;
  correctCount?: number;
  mvp?: string;
  mvpScore?: number;
  newTier?: string;
}

type CommentaryPool = Record<Tier, string[]>;

const POOLS: Record<CommentaryEvent, CommentaryPool> = {
  round_intro: {
    warmup: [
      "Let's kick things off with {roundName}!",
      "Alright, {playerCount} players, nice and easy. This is {roundName}.",
      "Welcome! {roundName} to start. Don't get too comfortable!",
      "{roundName}! {difficulty} percent get this right. Should be a breeze.",
    ],
    midgame: [
      "Time for {roundName}. Things are picking up!",
      "{roundName} next. The easy points are behind us.",
      "Okay, {roundName}. Only {difficulty} percent territory now.",
      "Here comes {roundName}. Let's see who's been paying attention.",
    ],
    pressure: [
      "{roundName}. Only {difficulty} percent get this right.",
      "This is {roundName}. The pressure is on.",
      "{roundName}... and we're deep in it now.",
      "Welcome to {roundName}. Not many survive this one.",
    ],
    gauntlet: [
      "{roundName}. {difficulty} percent.",
      "This... is {roundName}.",
      "{roundName}. No mercy. No second chances.",
      "The final stretch. {roundName}.",
    ],
  },
  many_correct: {
    warmup: [
      "Too easy for this lot!",
      "Look at that, nearly everyone got it!",
      "No surprises there. Well done everyone.",
    ],
    midgame: [
      "Impressive! Most of you nailed that.",
      "Well well, you lot are sharper than I thought.",
      "Strong showing. {correctCount} got it right.",
    ],
    pressure: [
      "I'm shocked. That many got it?",
      "Against the odds, {correctCount} of you pulled through.",
      "That shouldn't have been that easy for you lot.",
    ],
    gauntlet: [
      "Unbelievable. Multiple survivors.",
      "I did NOT expect that many to get through.",
      "{correctCount} still standing. Incredible.",
    ],
  },
  few_correct: {
    warmup: [
      "Oh dear. Only {correctCount} got that right!",
      "Bit of a stumble there. Just {correctCount} correct.",
      "Trickier than it looked! Only {correctCount}.",
    ],
    midgame: [
      "Only {correctCount}! This is where it gets real.",
      "Ouch. {correctCount} correct. That's brutal.",
      "The pack is thinning. Just {correctCount} got through.",
    ],
    pressure: [
      "Only {correctCount}. As expected at this level.",
      "{correctCount}. This round takes no prisoners.",
      "Down to the wire. Just {correctCount}.",
    ],
    gauntlet: [
      "{correctCount}. That's all that's left.",
      "Brutal. Just {correctCount} survived.",
      "Only {correctCount} standing.",
    ],
  },
  none_correct: {
    warmup: [
      "Nobody? Not a single one? Come on!",
      "Zero correct! That's... unexpected.",
    ],
    midgame: [
      "Not one correct answer. Wow.",
      "A clean sweep... of failure.",
    ],
    pressure: [
      "Zero. This round is merciless.",
      "Nobody got through. That's the pressure round for you.",
    ],
    gauntlet: [
      "Everyone falls. Nobody survives.",
      "Wiped out. Every last one.",
    ],
  },
  leader_wrong: {
    warmup: [
      "Oh! The leader stumbles!",
      "Slip up from the front runner!",
    ],
    midgame: [
      "The leader got it wrong! Wide open now.",
      "A mistake at the top! Here come the challengers.",
    ],
    pressure: [
      "The leader falls! Game on.",
      "Down goes the favourite!",
    ],
    gauntlet: [
      "The leader... is wrong. Everything changes.",
      "No one is safe. Not even the leader.",
    ],
  },
  steal_executed: {
    warmup: ["Cheeky! {stealer} steals {amount} from {victim}!"],
    midgame: ["STOLEN! {stealer} takes {amount} from {victim}!"],
    pressure: ["{stealer} goes for the jugular! {amount} points stolen from {victim}!"],
    gauntlet: ["Cold-blooded steal. {stealer} rips {amount} from {victim}."],
  },
  elimination: {
    warmup: ["Oh no! {player} is out!"],
    midgame: ["And just like that, {player} is gone."],
    pressure: ["{player} falls. The herd thins."],
    gauntlet: ["{player}... eliminated.", "Gone. {player} is out."],
  },
  buzz_first: {
    warmup: ["{player} buzzes in first! Confident."],
    midgame: ["{player} on the buzzer! Bold move."],
    pressure: ["{player} goes for it! Brave or foolish?"],
    gauntlet: ["{player} buzzes. All or nothing."],
  },
  final_survivor: {
    warmup: ["Well done, {player}!"],
    midgame: ["{player} takes it!"],
    pressure: ["{player} is the last one standing!"],
    gauntlet: [
      "INCREDIBLE! {player} is THE ONE PERCENT!",
      "{player}! Against all odds! THE ONE PERCENT!",
      "Ladies and gentlemen... {player}. The One Percent.",
    ],
  },
  tier_transition: {
    warmup: [""],
    midgame: ["The warm-up is over. Welcome to the real game."],
    pressure: ["From here, every question could change everything."],
    gauntlet: ["This is it. The final stretch. Only the best survive."],
  },
  round_complete: {
    warmup: [
      "Round done! {mvp} led the way with {mvpScore} points.",
      "Nice round. {mvp} top scored with {mvpScore}.",
    ],
    midgame: [
      "{mvp} dominated that round! {mvpScore} points.",
      "What a round. {mvp} walks away with {mvpScore}.",
    ],
    pressure: [
      "{mvp} survives with {mvpScore} points. Impressive.",
      "Round over. {mvp} clinging to the lead with {mvpScore}.",
    ],
    gauntlet: [
      "{mvp}. {mvpScore} points. Legendary.",
      "That was intense. {mvp} with {mvpScore}.",
    ],
  },
};

// Track last used index per event to avoid immediate repeats
const lastUsed = new Map<string, number>();

function fillTemplate(template: string, ctx: CommentaryContext): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = ctx[key as keyof CommentaryContext];
    return val != null ? String(val) : `{${key}}`;
  });
}

export function getCommentary(
  event: CommentaryEvent,
  tier: Tier,
  ctx: CommentaryContext = {}
): string {
  const pool = POOLS[event]?.[tier];
  if (!pool || pool.length === 0) return '';

  const key = `${event}_${tier}`;
  const last = lastUsed.get(key) ?? -1;

  // Pick a random index that isn't the last used one
  let idx: number;
  if (pool.length === 1) {
    idx = 0;
  } else {
    do {
      idx = Math.floor(Math.random() * pool.length);
    } while (idx === last);
  }

  lastUsed.set(key, idx);
  return fillTemplate(pool[idx], ctx);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/HostPanel/hostCommentary.ts
git commit -m "feat: add host commentary pools with tier-based tone shifting"
```

---

## Task 4: Host Panel Component

**Files:**
- Create: `src/components/GameShowOverlay/HostPanel/HostPanel.tsx`

The visible host overlay — avatar, name plate, animated speech bubble. Listens to game state changes and triggers commentary + TTS.

- [ ] **Step 1: Create the Host Panel**

```tsx
// src/components/GameShowOverlay/HostPanel/HostPanel.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../../../stores/multiplayerStore';
import { useOverlayStore } from '../../../stores/overlayStore';
import { getRoundDefinition } from '../../../roundTypes/registry';
import { getCommentary } from './hostCommentary';
import { speak, cancelSpeech } from './ttsEngine';
import type { Tier } from './ttsEngine';
import type { GameBroadcast } from '../../../stores/multiplayerStore';

function getPhase(route: string): string {
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

function getTier(roundType: string | undefined): Tier {
  if (!roundType) return 'warmup';
  const def = getRoundDefinition(roundType as import('../../../types').RoundTypeId);
  return def.tier;
}

export default function HostPanel() {
  const gameState = useMultiplayerStore((s) => s.gameState);
  const hostVoiceEnabled = useOverlayStore((s) => s.hostVoiceEnabled);
  const [line, setLine] = useState('');
  const [visible, setVisible] = useState(false);
  const lastPhaseRef = useRef('');
  const lastRoundRef = useRef(-1);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const showLine = useCallback(
    (text: string, tier: Tier) => {
      if (!text) return;
      setLine(text);
      setVisible(true);

      clearTimeout(hideTimerRef.current);

      if (hostVoiceEnabled) {
        speak(text, tier).then(() => {
          hideTimerRef.current = setTimeout(() => setVisible(false), 1500);
        });
      } else {
        // Text-only: show for reading time (~80ms per character, min 3s)
        const readTime = Math.max(3000, text.length * 80);
        hideTimerRef.current = setTimeout(() => setVisible(false), readTime);
      }
    },
    [hostVoiceEnabled]
  );

  useEffect(() => {
    if (!gameState) return;

    const phase = getPhase(gameState.route);
    const roundIndex = gameState.round?.index ?? -1;
    const roundType = gameState.round?.roundType ?? gameState.reveal?.roundType;
    const tier = getTier(roundType);

    // Only trigger on phase or round changes
    const phaseKey = `${phase}_${roundIndex}`;
    if (phaseKey === lastPhaseRef.current) return;
    lastPhaseRef.current = phaseKey;

    if (phase === 'round-intro' && gameState.round) {
      // Check for tier transition
      if (lastRoundRef.current >= 0 && roundIndex > lastRoundRef.current) {
        const prevType = getRoundDefinition(
          gameState.round.roundType as import('../../../types').RoundTypeId
        );
        // We detect tier transition by checking if previous round was in a different tier
        // Simple: just fire tier_transition commentary on rounds 3, 6, 9 (tier boundaries)
        if (roundIndex === 3 || roundIndex === 6 || roundIndex === 9) {
          const tierText = getCommentary('tier_transition', tier);
          if (tierText) {
            showLine(tierText, tier);
            lastRoundRef.current = roundIndex;
            return;
          }
        }
      }

      lastRoundRef.current = roundIndex;
      const def = getRoundDefinition(gameState.round.roundType);
      const text = getCommentary('round_intro', tier, {
        roundName: def.name,
        difficulty: gameState.round.difficulty,
        playerCount: gameState.players.length,
      });
      showLine(text, tier);
    }

    if (phase === 'reveal' && gameState.reveal) {
      const correct = gameState.reveal.correctPlayerIds;
      const incorrect = gameState.reveal.incorrectPlayerIds;
      const total = correct.length + incorrect.length;

      let event: import('./hostCommentary').CommentaryEvent;
      if (correct.length === 0) {
        event = 'none_correct';
      } else if (correct.length >= total * 0.6) {
        event = 'many_correct';
      } else {
        event = 'few_correct';
      }

      // Delay commentary to let the reveal animation start
      setTimeout(() => {
        const text = getCommentary(event, tier, {
          correctCount: correct.length,
        });
        showLine(text, tier);
      }, 2500);
    }
  }, [gameState, showLine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-8 left-8 z-40 flex items-end gap-4 max-w-md"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Avatar */}
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-neon-cyan/30">
            🎤
          </div>

          {/* Speech bubble */}
          <div className="relative bg-bg-secondary/90 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-5 py-3 shadow-xl">
            <p className="text-sm font-medium text-white/60 mb-0.5 tracking-wide">THE HOST</p>
            <motion.p
              key={line}
              className="text-lg font-display text-white leading-snug"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {line}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/HostPanel/HostPanel.tsx
git commit -m "feat: add host panel overlay with commentary and TTS"
```

---

## Task 5: Rolling Score Counter

**Files:**
- Create: `src/components/GameShowOverlay/Leaderboard/RollingCounter.tsx`

Animated number display that rolls digits like an odometer when the value changes.

- [ ] **Step 1: Create the RollingCounter component**

```tsx
// src/components/GameShowOverlay/Leaderboard/RollingCounter.tsx
import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface RollingCounterProps {
  value: number;
  className?: string;
}

function AnimatedDigit({ digit }: { digit: number }) {
  const spring = useSpring(digit, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [shown, setShown] = useState(digit);

  useEffect(() => {
    spring.set(digit);
  }, [digit, spring]);

  useEffect(() => {
    return display.on('change', (v) => setShown(v));
  }, [display]);

  return <span>{shown}</span>;
}

export default function RollingCounter({ value, className = '' }: RollingCounterProps) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<'gain' | 'loss' | null>(null);

  useEffect(() => {
    if (value > prevRef.current) {
      setFlash('gain');
    } else if (value < prevRef.current) {
      setFlash('loss');
    }
    prevRef.current = value;
    const t = setTimeout(() => setFlash(null), 800);
    return () => clearTimeout(t);
  }, [value]);

  const formatted = value.toLocaleString('en-ZA');

  return (
    <motion.span
      className={`tabular-nums ${className}`}
      animate={{
        color: flash === 'gain' ? '#22C55E' : flash === 'loss' ? '#EF4444' : '#FFFFFF',
        scale: flash ? [1, 1.15, 1] : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      {formatted}
    </motion.span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/Leaderboard/RollingCounter.tsx
git commit -m "feat: add rolling score counter with color flash animations"
```

---

## Task 6: TV Leaderboard

**Files:**
- Create: `src/components/GameShowOverlay/Leaderboard/TvLeaderboard.tsx`

Slide-in/out leaderboard panel on the right side of the TV. Visible during intros, reveals, and transitions. Hidden during active play.

- [ ] **Step 1: Create the TvLeaderboard component**

```tsx
// src/components/GameShowOverlay/Leaderboard/TvLeaderboard.tsx
import { useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useMultiplayerStore } from '../../../stores/multiplayerStore';
import RollingCounter from './RollingCounter';

function getPhase(route: string): string {
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

export default function TvLeaderboard() {
  const gameState = useMultiplayerStore((s) => s.gameState);
  if (!gameState) return null;

  const phase = getPhase(gameState.route);
  const showLeaderboard = phase === 'round-intro' || phase === 'reveal';

  const sorted = useMemo(() => {
    return [...gameState.players]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [gameState.players]);

  return (
    <AnimatePresence>
      {showLeaderboard && (
        <motion.div
          className="fixed top-6 right-6 z-30 w-64"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        >
          <div className="bg-bg-secondary/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs font-display text-neon-cyan tracking-[0.2em] uppercase">
                Leaderboard
              </p>
            </div>

            <LayoutGroup>
              <div className="py-2">
                {sorted.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    className="flex items-center gap-3 px-4 py-2"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    {/* Rank */}
                    <span className="w-6 text-center text-sm font-bold text-white/50">
                      {player.rank}
                    </span>

                    {/* Avatar */}
                    <span className="text-lg">{player.avatar}</span>

                    {/* Name */}
                    <span className="flex-1 text-sm font-medium text-white truncate">
                      {player.name}
                    </span>

                    {/* Score */}
                    <RollingCounter
                      value={player.score}
                      className="text-sm font-bold font-display"
                    />
                  </motion.div>
                ))}
              </div>
            </LayoutGroup>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/Leaderboard/TvLeaderboard.tsx
git commit -m "feat: add TV leaderboard overlay with animated rank changes"
```

---

## Task 7: Difficulty Meter

**Files:**
- Create: `src/components/GameShowOverlay/Transitions/DifficultyMeter.tsx`

Visual dot progression showing 90% → 1% with color-coded completion.

- [ ] **Step 1: Create the DifficultyMeter component**

```tsx
// src/components/GameShowOverlay/Transitions/DifficultyMeter.tsx
import { motion } from 'framer-motion';
import { DIFFICULTY_TIERS } from '../../../types';
import { getDifficultyColour } from '../../../utils/helpers';

interface DifficultyMeterProps {
  currentRound: number; // 0-10
}

export default function DifficultyMeter({ currentRound }: DifficultyMeterProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {DIFFICULTY_TIERS.map((tier, i) => {
        const isCompleted = i < currentRound;
        const isCurrent = i === currentRound;
        const color = getDifficultyColour(tier);

        return (
          <motion.div
            key={tier}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: isCurrent ? 18 : 12,
                height: isCurrent ? 18 : 12,
                backgroundColor: isCompleted || isCurrent ? color : 'rgba(255,255,255,0.15)',
                boxShadow: isCurrent ? `0 0 12px ${color}` : 'none',
              }}
              animate={
                isCurrent
                  ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }
                  : {}
              }
              transition={
                isCurrent
                  ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                  : {}
              }
            />
            <span
              className="text-[10px] font-display"
              style={{
                color: isCompleted || isCurrent ? color : 'rgba(255,255,255,0.3)',
              }}
            >
              {tier}%
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/Transitions/DifficultyMeter.tsx
git commit -m "feat: add difficulty meter with color-coded progression dots"
```

---

## Task 8: Round Transition Sequence

**Files:**
- Create: `src/components/GameShowOverlay/Transitions/RoundTransition.tsx`

Full-screen cinematic overlay between rounds. Shows: "ROUND COMPLETE" → Score Summary with MVP → Difficulty Meter → Next Round Preview.

- [ ] **Step 1: Create the RoundTransition component**

```tsx
// src/components/GameShowOverlay/Transitions/RoundTransition.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoundDefinition } from '../../../roundTypes/registry';
import { formatPoints, getDifficultyColour } from '../../../utils/helpers';
import { ROUND_TYPE_SEQUENCE } from '../../../roundTypes/sequence';
import { DIFFICULTY_TIERS, POINTS_PER_ROUND } from '../../../types';
import type { BroadcastPlayer } from '../../../stores/multiplayerStore';
import DifficultyMeter from './DifficultyMeter';

interface RoundTransitionProps {
  roundIndex: number;             // Just-completed round (0-based)
  players: BroadcastPlayer[];
  scoreUpdates?: { playerId: string; delta: number }[];
  onComplete: () => void;         // Called when transition finishes
}

type Phase = 'complete' | 'scores' | 'difficulty' | 'preview' | 'done';

const PHASE_TIMING: Record<Phase, number> = {
  complete: 2000,
  scores: 4000,
  difficulty: 2000,
  preview: 3000,
  done: 0,
};

export default function RoundTransition({
  roundIndex,
  players,
  scoreUpdates,
  onComplete,
}: RoundTransitionProps) {
  const [phase, setPhase] = useState<Phase>('complete');

  const completedDef = getRoundDefinition(ROUND_TYPE_SEQUENCE[roundIndex]);
  const nextRoundIndex = roundIndex + 1;
  const hasNext = nextRoundIndex < ROUND_TYPE_SEQUENCE.length;
  const nextDef = hasNext ? getRoundDefinition(ROUND_TYPE_SEQUENCE[nextRoundIndex]) : null;

  // Find MVP (highest delta this round)
  const mvp = scoreUpdates?.length
    ? scoreUpdates.reduce((best, u) => (u.delta > best.delta ? u : best), scoreUpdates[0])
    : null;
  const mvpPlayer = mvp ? players.find((p) => p.id === mvp.playerId) : null;

  // Sorted leaderboard
  const sorted = [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    const sequence: Phase[] = ['complete', 'scores', 'difficulty', 'preview'];
    let current = 0;
    let timer: ReturnType<typeof setTimeout>;

    function advance() {
      current++;
      if (current >= sequence.length) {
        onComplete();
        return;
      }
      setPhase(sequence[current]);
      timer = setTimeout(advance, PHASE_TIMING[sequence[current]]);
    }

    timer = setTimeout(advance, PHASE_TIMING[sequence[0]]);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {/* Phase 1: Round Complete */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <p className="text-lg font-display tracking-[0.3em] text-white/50 mb-2">
              ROUND {roundIndex + 1}
            </p>
            <h1
              className="text-6xl font-display font-bold tracking-wide"
              style={{ color: completedDef.theme.primary }}
            >
              COMPLETE
            </h1>
            <p className="text-2xl mt-3 text-white/70">{completedDef.theme.icon} {completedDef.name}</p>
          </motion.div>
        )}

        {/* Phase 2: Score Summary */}
        {phase === 'scores' && (
          <motion.div
            key="scores"
            className="w-full max-w-lg px-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {mvpPlayer && (
              <motion.div
                className="text-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, stiffness: 300 }}
              >
                <p className="text-xs font-display tracking-[0.3em] text-neon-cyan mb-1">
                  ROUND MVP
                </p>
                <p className="text-3xl">
                  {mvpPlayer.avatar} {mvpPlayer.name}
                </p>
                <p className="text-xl font-bold text-green-400 mt-1">
                  +{formatPoints(mvp!.delta)}
                </p>
              </motion.div>
            )}

            <div className="space-y-2">
              {sorted.map((player, i) => {
                const update = scoreUpdates?.find((u) => u.playerId === player.id);
                return (
                  <motion.div
                    key={player.id}
                    className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <span className="w-6 text-center text-sm font-bold text-white/40">
                      {i + 1}
                    </span>
                    <span className="text-lg">{player.avatar}</span>
                    <span className="flex-1 text-sm text-white">{player.name}</span>
                    {update && (
                      <span
                        className={`text-sm font-bold ${
                          update.delta >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {update.delta >= 0 ? '+' : ''}
                        {formatPoints(update.delta)}
                      </span>
                    )}
                    <span className="text-sm font-display font-bold text-white w-20 text-right">
                      {formatPoints(player.score)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Phase 3: Difficulty Meter */}
        {phase === 'difficulty' && (
          <motion.div
            key="difficulty"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-sm font-display tracking-[0.2em] text-white/50 mb-6">
              PROGRESS
            </p>
            <DifficultyMeter currentRound={nextRoundIndex} />
          </motion.div>
        )}

        {/* Phase 4: Next Round Preview */}
        {phase === 'preview' && nextDef && (
          <motion.div
            key="preview"
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <p className="text-sm font-display tracking-[0.3em] text-white/40 mb-2">
              NEXT UP
            </p>
            <p className="text-5xl mb-3">{nextDef.theme.icon}</p>
            <h2
              className="text-4xl font-display font-bold tracking-wide mb-2"
              style={{ color: nextDef.theme.primary }}
            >
              {nextDef.name}
            </h2>
            <p className="text-lg text-white/60 mb-4">{nextDef.tagline}</p>
            <p className="text-sm font-display text-white/40">
              <span
                className="font-bold"
                style={{ color: getDifficultyColour(DIFFICULTY_TIERS[nextRoundIndex]) }}
              >
                {DIFFICULTY_TIERS[nextRoundIndex]}%
              </span>
              {' '}&middot;{' '}
              <span className="text-neon-cyan">
                {formatPoints(POINTS_PER_ROUND[DIFFICULTY_TIERS[nextRoundIndex]])} pts
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/Transitions/RoundTransition.tsx
git commit -m "feat: add cinematic round transition with score summary and next round preview"
```

---

## Task 9: Music Manager

**Files:**
- Create: `src/components/GameShowOverlay/Audio/MusicManager.ts`

Howler-based background music manager. Plays tier-appropriate tracks with crossfading, ducks when host speaks.

- [ ] **Step 1: Create the MusicManager**

```typescript
// src/components/GameShowOverlay/Audio/MusicManager.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/Audio/MusicManager.ts
git commit -m "feat: add Howler-based music manager with tier crossfading and voice ducking"
```

---

## Task 10: Crowd SFX Manager

**Files:**
- Create: `src/components/GameShowOverlay/Audio/CrowdSfxManager.ts`

Event-triggered crowd reaction sounds using Howler.

- [ ] **Step 1: Create the CrowdSfxManager**

```typescript
// src/components/GameShowOverlay/Audio/CrowdSfxManager.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/Audio/CrowdSfxManager.ts
git commit -m "feat: add crowd SFX manager with event-triggered reactions and looping"
```

---

## Task 11: TV Overlay Manager

**Files:**
- Create: `src/components/GameShowOverlay/TvOverlayManager.tsx`

The orchestrator. Wraps TV content, renders all overlay layers, and coordinates the transition sequence between rounds.

- [ ] **Step 1: Create the TvOverlayManager**

```tsx
// src/components/GameShowOverlay/TvOverlayManager.tsx
import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { getRoundDefinition } from '../../roundTypes/registry';
import HostPanel from './HostPanel/HostPanel';
import TvLeaderboard from './Leaderboard/TvLeaderboard';
import RoundTransition from './Transitions/RoundTransition';
import { musicManager } from './Audio/MusicManager';
import { crowdSfxManager } from './Audio/CrowdSfxManager';
import type { RoundTypeId } from '../../types';
import type { Tier } from './HostPanel/ttsEngine';

function getPhase(route: string): string {
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

function getTier(roundTypeId: RoundTypeId | undefined): Tier {
  if (!roundTypeId) return 'warmup';
  return getRoundDefinition(roundTypeId).tier;
}

interface TvOverlayManagerProps {
  children: ReactNode;
}

export default function TvOverlayManager({ children }: TvOverlayManagerProps) {
  const gameState = useMultiplayerStore((s) => s.gameState);
  const [showTransition, setShowTransition] = useState(false);
  const lastPhaseRef = useRef('');
  const lastRoundRef = useRef(-1);
  const transitionDataRef = useRef<{
    roundIndex: number;
    players: typeof gameState extends { players: infer P } ? P : never;
    scoreUpdates?: { playerId: string; delta: number }[];
  } | null>(null);

  // Initialize audio managers
  useEffect(() => {
    musicManager.init();
    crowdSfxManager.init();
    return () => {
      musicManager.destroy();
      crowdSfxManager.destroy();
    };
  }, []);

  // React to phase changes for music and crowd SFX
  useEffect(() => {
    if (!gameState) return;

    const phase = getPhase(gameState.route);
    const roundType = gameState.round?.roundType ?? gameState.reveal?.roundType;
    const tier = getTier(roundType as RoundTypeId | undefined);
    const roundIndex = gameState.round?.index ?? -1;
    const phaseKey = `${phase}_${roundIndex}`;

    if (phaseKey === lastPhaseRef.current) return;
    lastPhaseRef.current = phaseKey;

    // Start music on first round intro
    if (phase === 'round-intro') {
      musicManager.play(tier);
      musicManager.setMode('play');

      // Start heartbeat loop for gauntlet rounds
      if (tier === 'gauntlet') {
        crowdSfxManager.startLoop('heartbeat');
      } else {
        crowdSfxManager.stopLoop();
      }
    }

    // Tension drum before reveals
    if (phase === 'reveal') {
      musicManager.briefSilence(1500);
      crowdSfxManager.play('tension_drum');
    }

    // Trigger crowd reactions on reveal
    if (phase === 'reveal' && gameState.reveal) {
      const correct = gameState.reveal.correctPlayerIds.length;
      const incorrect = gameState.reveal.incorrectPlayerIds.length;
      const total = correct + incorrect;

      setTimeout(() => {
        if (correct === 0) {
          crowdSfxManager.play('aww');
        } else if (correct >= total * 0.6) {
          crowdSfxManager.play('cheer');
        } else if (correct <= 2 && total > 4) {
          crowdSfxManager.play('gasp');
        } else {
          crowdSfxManager.play('ooh');
        }
      }, 3000); // After answer reveal animation

      // Check for steals
      const steals = gameState.reveal.scoreUpdates?.filter((u) => u.stealFromId);
      if (steals && steals.length > 0) {
        setTimeout(() => crowdSfxManager.play('gasp'), 4500);
      }
    }

    // Show transition overlay when moving from reveal to next round
    // We detect this by tracking round index changes
    if (phase === 'round-intro' && lastRoundRef.current >= 0 && roundIndex > lastRoundRef.current) {
      // A new round is starting — we should have shown a transition
      // The transition is triggered below when we first see the reveal ending
    }

    lastRoundRef.current = roundIndex;

    // Results phase
    if (phase === 'results') {
      crowdSfxManager.stopLoop();
      crowdSfxManager.play('applause');
      musicManager.stop();
    }
  }, [gameState]);

  // Show transition between rounds by watching for reveal → round-intro changes
  useEffect(() => {
    if (!gameState) return;

    const phase = getPhase(gameState.route);

    // When reveal data arrives, store it for the transition
    if (phase === 'reveal' && gameState.reveal && gameState.round) {
      transitionDataRef.current = {
        roundIndex: gameState.round.index,
        players: gameState.players,
        scoreUpdates: gameState.reveal.scoreUpdates?.map((u) => ({
          playerId: u.playerId,
          delta: u.delta,
        })),
      };
    }
  }, [gameState]);

  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false);
    transitionDataRef.current = null;
  }, []);

  return (
    <div className="relative">
      {/* Layer 1: Existing round content */}
      {children}

      {/* Layer 2: Host Panel */}
      <HostPanel />

      {/* Layer 3: Leaderboard */}
      <TvLeaderboard />

      {/* Layer 4: Transition Overlay */}
      <AnimatePresence>
        {showTransition && transitionDataRef.current && (
          <RoundTransition
            roundIndex={transitionDataRef.current.roundIndex}
            players={transitionDataRef.current.players}
            scoreUpdates={transitionDataRef.current.scoreUpdates}
            onComplete={handleTransitionComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameShowOverlay/TvOverlayManager.tsx
git commit -m "feat: add TV overlay manager orchestrating all game show layers"
```

---

## Task 12: Integrate Overlay Manager into TvDisplay

**Files:**
- Modify: `src/routes/TvDisplay.tsx:1-222`

Wrap the existing TV display content with `TvOverlayManager`. This is the only modification to existing code.

- [ ] **Step 1: Add the TvOverlayManager import and wrapper**

In `src/routes/TvDisplay.tsx`, add the import at line 7 (after other component imports):

```typescript
import TvOverlayManager from '../components/GameShowOverlay/TvOverlayManager';
```

Then wrap the return JSX. Change line 70-221 from:

```tsx
  return (
    <div className="min-h-dvh bg-bg-primary overflow-hidden">
      {/* Room code watermark — always visible, bottom-right */}
      {roomCode && (
        ...
      )}

      <AnimatePresence mode="wait">
        ...
      </AnimatePresence>
    </div>
  );
```

To:

```tsx
  return (
    <TvOverlayManager>
      <div className="min-h-dvh bg-bg-primary overflow-hidden">
        {/* Room code watermark — always visible, bottom-right */}
        {roomCode && (
          <div className="fixed bottom-4 right-6 z-50 opacity-30">
            <span className="font-display text-sm text-text-muted tracking-[0.2em]">
              {roomCode}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ... all existing phase rendering unchanged ... */}
        </AnimatePresence>
      </div>
    </TvOverlayManager>
  );
```

The only change is adding `<TvOverlayManager>` wrapper around the existing `<div>`. All content inside remains identical.

- [ ] **Step 2: Commit**

```bash
git add src/routes/TvDisplay.tsx
git commit -m "feat: wrap TvDisplay with game show overlay manager"
```

---

## Task 13: Create Audio Asset Directory Structure

**Files:**
- Create: `public/audio/music/.gitkeep`
- Create: `public/audio/crowd/.gitkeep`

Set up the directory structure for audio assets. Actual royalty-free audio files will need to be sourced and placed here.

- [ ] **Step 1: Create directories with placeholder files**

```bash
mkdir -p public/audio/music public/audio/crowd
touch public/audio/music/.gitkeep public/audio/crowd/.gitkeep
```

- [ ] **Step 2: Create a README documenting required audio files**

Create `public/audio/README.md`:

```markdown
# Audio Assets

This directory contains audio files for the game show presentation layer.

## Required Files

### Music (`music/`)
Royalty-free background tracks that loop. Recommended sources: Pixabay, Freesound, Mixkit.

- `warmup.mp3` — Upbeat, fun (~120 BPM, 3-5 min loop)
- `midgame.mp3` — Driving, energetic (~130 BPM, 3-5 min loop)
- `pressure.mp3` — Tense, suspenseful (~100 BPM, 3-5 min loop)
- `gauntlet.mp3` — Epic, dramatic (~90 BPM, 3-5 min loop)

### Crowd SFX (`crowd/`)
Short crowd reaction clips (1-3 seconds each).

- `cheer.mp3` — Crowd cheering
- `gasp.mp3` — Crowd gasping
- `ooh.mp3` — Crowd "ooh" reaction
- `aww.mp3` — Sympathetic crowd "aww"
- `applause.mp3` — Crowd applause
- `laugh.mp3` — Crowd laughter
- `tension_drum.mp3` — Drum roll / suspense build
- `heartbeat.mp3` — Heartbeat sound (loopable)
```

- [ ] **Step 3: Commit**

```bash
git add public/audio/
git commit -m "feat: add audio asset directory structure with requirements doc"
```

---

## Task 14: Audio Settings UI

**Files:**
- Create: `src/components/GameShowOverlay/AudioSettings.tsx`

A small settings panel accessible from the TV display for toggling audio features.

- [ ] **Step 1: Create the AudioSettings component**

```tsx
// src/components/GameShowOverlay/AudioSettings.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOverlayStore } from '../../stores/overlayStore';

export default function AudioSettings() {
  const [open, setOpen] = useState(false);
  const {
    masterVolume, setMasterVolume,
    musicEnabled, setMusicEnabled,
    crowdEnabled, setCrowdEnabled,
    hostVoiceEnabled, setHostVoiceEnabled,
  } = useOverlayStore();

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        title="Audio Settings"
      >
        {musicEnabled || crowdEnabled || hostVoiceEnabled ? '🔊' : '🔇'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-12 right-0 bg-bg-secondary/95 backdrop-blur-md border border-white/10 rounded-xl p-4 w-64 shadow-2xl"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-xs font-display tracking-[0.2em] text-white/50 mb-3">
              AUDIO SETTINGS
            </p>

            {/* Master Volume */}
            <label className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/80">Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-24 accent-neon-cyan"
              />
            </label>

            {/* Toggles */}
            {[
              { label: 'Music', value: musicEnabled, set: setMusicEnabled },
              { label: 'Crowd Reactions', value: crowdEnabled, set: setCrowdEnabled },
              { label: 'Host Voice', value: hostVoiceEnabled, set: setHostVoiceEnabled },
            ].map(({ label, value, set }) => (
              <label
                key={label}
                className="flex items-center justify-between py-1.5 cursor-pointer"
              >
                <span className="text-sm text-white/80">{label}</span>
                <button
                  onClick={() => set(!value)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    value ? 'bg-neon-cyan' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                      value ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Add AudioSettings to TvOverlayManager**

In `src/components/GameShowOverlay/TvOverlayManager.tsx`, add the import:

```typescript
import AudioSettings from './AudioSettings';
```

Add `<AudioSettings />` inside the return, after `<TvLeaderboard />`:

```tsx
      {/* Layer 3: Leaderboard */}
      <TvLeaderboard />

      {/* Audio Settings */}
      <AudioSettings />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/GameShowOverlay/AudioSettings.tsx src/components/GameShowOverlay/TvOverlayManager.tsx
git commit -m "feat: add audio settings panel for TV display"
```

---

## Summary

| Task | Component | Dependencies |
|------|-----------|-------------|
| 1 | Overlay Store | None |
| 2 | TTS Engine | Task 1 |
| 3 | Host Commentary Data | Task 2 |
| 4 | Host Panel Component | Tasks 1-3 |
| 5 | Rolling Counter | None |
| 6 | TV Leaderboard | Task 5 |
| 7 | Difficulty Meter | None |
| 8 | Round Transition | Task 7 |
| 9 | Music Manager | Task 1 |
| 10 | Crowd SFX Manager | Task 1 |
| 11 | TV Overlay Manager | Tasks 4, 6, 8-10 |
| 12 | TvDisplay Integration | Task 11 |
| 13 | Audio Asset Directories | None |
| 14 | Audio Settings UI | Task 1, 11 |

**Parallelizable groups:**
- Tasks 1, 5, 7, 13 can all run in parallel (no dependencies)
- Tasks 2, 9, 10 can run in parallel after Task 1
- Tasks 3, 6 can run after their respective dependencies
- Tasks 4, 8 after their chains complete
- Task 11 after Tasks 4, 6, 8, 9, 10
- Tasks 12, 14 after Task 11
