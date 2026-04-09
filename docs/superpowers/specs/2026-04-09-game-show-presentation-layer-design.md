# Game Show Presentation Layer Design

**Date**: 2026-04-09
**Status**: Approved
**Goal**: Transform the TV display from a functional quiz interface into a cinematic game show experience through layered overlays — host commentary, score cinematics, music/crowd audio, and round transitions.

## Architecture: Layered Overlay System

The TV display gets a `TvOverlayManager` that layers 4 independent presentation systems (host, leaderboard, transitions, audio) across 6 layers on top of existing round components. Existing `TvIntro`, `TvPlay`, and `TvReveal` components remain **completely untouched**.

```
TV Screen Layer Stack:
┌─────────────────────────────────────────────┐
│  Layer 0: BACKGROUND MUSIC (audio only)     │
│  Layer 1: ROUND CONTENT (existing, unchanged)│
│  Layer 2: HOST PANEL (bottom-left overlay)   │
│  Layer 3: LEADERBOARD (right side overlay)   │
│  Layer 4: TRANSITION OVERLAY (full-screen)   │
│  Layer 5: CROWD SFX (audio only)            │
└─────────────────────────────────────────────┘
```

**Key principle:** Each layer subscribes to game state changes from `gameStore` independently. Layers do not communicate with each other — they all react to the same game events.

### File Structure

```
src/components/GameShowOverlay/
├── TvOverlayManager.tsx        # Wraps TvDisplay, renders all layers
├── HostPanel/
│   ├── HostPanel.tsx           # Avatar + speech bubble + name plate
│   ├── hostCommentary.ts       # Commentary pools per event/tier
│   └── ttsEngine.ts            # SpeechSynthesis wrapper
├── Leaderboard/
│   ├── TvLeaderboard.tsx       # Slide-in/out leaderboard panel
│   ├── RollingCounter.tsx      # Odometer-style score animation
│   └── RankChangeIndicator.tsx # Up/down arrow animations
├── Transitions/
│   ├── RoundCompleteCard.tsx   # "ROUND N COMPLETE" overlay
│   ├── ScoreSummary.tsx        # Between-round score summary
│   ├── DifficultyMeter.tsx     # Visual progression indicator
│   ├── NextRoundPreview.tsx    # Upcoming round preview card
│   └── TierTransition.tsx      # Special tier boundary transition
├── Audio/
│   ├── MusicManager.ts         # Background music with crossfading
│   └── CrowdSfxManager.ts     # Event-triggered crowd reactions
└── AudioSettings.tsx           # Volume controls UI
```

---

## Section 1: Host System

### Host Panel Component

A persistent overlay positioned in the bottom-left of the TV screen:

- **Avatar**: Stylized host icon (emoji initially: 🎤, upgradeable to custom SVG)
- **Name plate**: "THE HOST" (or configurable name)
- **Speech bubble**: Commentary text with Framer Motion typing animation
- **TTS**: Browser `SpeechSynthesis` API speaks commentary aloud

The panel slides in when the host has something to say and slides out after a delay.

### Commentary Engine (`hostCommentary.ts`)

Maps game events to commentary text pools, parameterized by context:

**Commentary triggers:**

| Game Event | Context Variables | Example Commentary |
|---|---|---|
| `round_intro` | roundName, tier, difficulty, playerCount | "Welcome! Let's ease into {roundName}!" |
| `answer_correct` (many) | correctCount, totalPlayers | "Too easy for this lot!" |
| `answer_correct` (few) | correctCount | "Only {n} got that! Brilliant." |
| `answer_wrong` (leader) | playerName | "Oh! The leader stumbles!" |
| `steal_executed` | stealer, victim, amount | "STOLEN! {stealer} takes {amount} from {victim}!" |
| `elimination` | playerName | "And just like that... {player} is gone." |
| `buzz_in_first` | playerName | "{player} on the buzzer! Bold move." |
| `final_survivor` | playerName | "INCREDIBLE! {player} is THE ONE PERCENT!" |
| `tier_transition` | newTier | "The warm-up is over. Welcome to the real game." |
| `round_complete` | roundName, mvpName, mvpScore | "{mvpName} dominated that round with {mvpScore}!" |

Each event has a pool of 4-6 commentary variants per tier to avoid repetition. A random variant is selected each time, with no immediate repeats.

### Tone Shifting Per Tier

The host's personality adapts based on the current game tier:

| Tier | Rounds | Tone | Speech Rate | Pitch |
|---|---|---|---|---|
| Warmup | 1-3 | Cheeky, playful, encouraging | Normal (1.0) | Normal (1.0) |
| Midgame | 4-6 | Witty, building tension | Slightly faster (1.05) | Normal (1.0) |
| Pressure | 7-9 | Dramatic, suspenseful | Slower (0.9) | Lower (0.9) |
| Gauntlet | 10-11 | Intense, gravitas. Short lines. Long pauses. | Slow (0.8) | Deep (0.8) |

### TTS Engine (`ttsEngine.ts`)

- Uses `window.speechSynthesis` (built into all modern browsers, no API key)
- Selects first available English voice; user can override in settings
- Rate and pitch adjusted per tier (see table above)
- Auto-ducks background music volume while speaking
- **Fallback**: If TTS unavailable, text-only with dramatic typing animation
- Host voice can be independently muted

---

## Section 2: Score Cinematics & Leaderboard

### Persistent Leaderboard (`TvLeaderboard.tsx`)

A slide-in/out panel on the right side of the TV display:

- **Visible during**: Round intros, reveals, transitions
- **Hidden during**: Active play (avoids distraction)
- **Contents per entry**: Rank number, player emoji, name, animated score
- **Team mode**: Shows team scores with team color coding
- **Animation**: Entries animate up/down when positions change

### Rolling Score Counter (`RollingCounter.tsx`)

When scores update, digits animate like an odometer:
- Each digit rolls independently
- Speed proportional to change magnitude (fast for small, slower for big)
- Point gains flash green, losses flash red
- Steal amounts show as floating "+500" / "-500" particles that visually fly between players

### Score Event Animations

| Event | Visual Effect |
|---|---|
| Points gained | Green flash + rolling counter up |
| Points lost (bomb/steal) | Red flash + rolling counter down + shake |
| Rank up | Entry slides up, green ↑ arrow |
| Rank down | Entry slides down, red ↓ arrow |
| Big score change (>1000 pts) | Particle explosion + special sound cue |
| Steal | Animated points "fly" from victim to stealer on screen |

### Between-Round Score Summary (`ScoreSummary.tsx`)

A full-screen overlay between rounds showing:

1. **"ROUND {N} COMPLETE"** — round theme color, slam animation (2 seconds)
2. **Round MVP** — player who scored most that round, spotlight effect
3. **Score deltas** — each player's score change for that round (+300, -150, etc.)
4. **Updated rankings** — full leaderboard with rank change animations
5. **Duration**: ~4 seconds total, then transitions to next round preview

---

## Section 3: Music & Crowd Audio

### Background Music (`MusicManager.ts`)

Continuous background music managed through Howler.js (already in the project):

**Tier-based tracks** (4 royalty-free tracks):

| Tier | Vibe | Approx. Tempo |
|---|---|---|
| Warmup (rounds 1-3) | Upbeat, fun, light | ~120 BPM |
| Midgame (rounds 4-6) | Driving, building energy | ~130 BPM |
| Pressure (rounds 7-9) | Tense, suspenseful, darker | ~100 BPM |
| Gauntlet (rounds 10-11) | Epic, dramatic, cinematic | ~90 BPM |

**Behavior:**
- Plays continuously at low volume under gameplay
- Crossfades between tracks when tier changes (2-second crossfade)
- Auto-ducks when host TTS speaks
- Brief silence (1-2 seconds) before dramatic answer reveals
- Volume increases during transitions, decreases during active play

### Crowd Reaction SFX (`CrowdSfxManager.ts`)

Pre-loaded royalty-free crowd sound clips triggered by game events:

| SFX File | Trigger |
|---|---|
| `crowd_cheer.mp3` | Many correct answers, round complete |
| `crowd_gasp.mp3` | Elimination, big steal, leader falls |
| `crowd_ooh.mp3` | Close call, risky early buzz-in |
| `crowd_aww.mp3` | Wrong answer (sympathetic) |
| `crowd_applause.mp3` | Game winner, final survivor |
| `crowd_laugh.mp3` | Host joke, funny moment |
| `tension_drum.mp3` | Before answer reveal (suspense builder) |
| `heartbeat.mp3` | Final Round / Hot Seat — loops under gameplay |

### Volume Mixing

| Layer | During Play | During Transitions |
|---|---|---|
| Background music | 30% | 50% |
| Crowd SFX | 70% | 70% |
| Host TTS | 100% (ducks music) | 100% (ducks music) |
| Round SFX (existing) | Unchanged | Unchanged |

### Audio Settings

Exposed in a settings panel (accessible from host controls):
- Master volume slider
- Music on/off toggle
- Crowd reactions on/off toggle
- Host voice on/off toggle

---

## Section 4: Round Transitions

### Transition Sequence

Between every round, a full-screen cinematic transition on TV (~11 seconds total):

```
Round N TvReveal ends
        ↓
"ROUND {N} COMPLETE"        (2s) — round theme color, slam animation
        ↓
SCORE SUMMARY               (4s) — MVP, all player deltas, rank animations
        ↓
DIFFICULTY METER             (2s) — visual progression, host commentary
        ↓
NEXT ROUND PREVIEW           (3s) — next round theme, name, mechanic hint, point value
        ↓
Round N+1 TvIntro begins
```

### Difficulty Progression Visual (`DifficultyMeter.tsx`)

A visual indicator of game progress:

```
90%  80%  70%  60%  [50%]  40%  30%  20%  10%  5%  1%
 ●    ●    ●    ●    ◉     ○    ○    ○    ○   ○   ○
```

- Completed rounds: filled dots
- Current round: pulsing/glowing dot
- Future rounds: empty dots
- Color gradient: green → yellow → orange → red as difficulty increases
- Shows during round intros and transitions

### Tier Boundary Transitions (`TierTransition.tsx`)

When the game crosses tier boundaries (warmup→midgame, midgame→pressure, pressure→gauntlet), an extra dramatic moment plays:

1. Screen dims briefly (0.5s)
2. Music crossfades to new tier track
3. Host delivers a tier-shift line (e.g., "The warm-up is over. Welcome to the real game.")
4. Flash of the new tier's color palette
5. Resume normal transition flow

---

## Audio Asset Requirements

### Files Needed

**Music (4 tracks):**
- `music_warmup.mp3` — Upbeat, fun (~120 BPM, 3-5 min loop)
- `music_midgame.mp3` — Driving, energetic (~130 BPM, 3-5 min loop)
- `music_pressure.mp3` — Tense, suspenseful (~100 BPM, 3-5 min loop)
- `music_gauntlet.mp3` — Epic, dramatic (~90 BPM, 3-5 min loop)

**Crowd SFX (8 clips):**
- `crowd_cheer.mp3`, `crowd_gasp.mp3`, `crowd_ooh.mp3`, `crowd_aww.mp3`
- `crowd_applause.mp3`, `crowd_laugh.mp3`, `tension_drum.mp3`, `heartbeat.mp3`

**Source:** Royalty-free libraries (e.g., Pixabay, Freesound, Mixkit). All bundled locally, no runtime API dependency.

---

## Integration Points

### gameStore Changes

No changes to existing game logic. The overlay system reads from `gameStore` state:
- `currentRound`, `phase`, `players`, `scores` — for leaderboard and transitions
- `roundType` — for tier detection and theme colors
- Phase transitions (intro → play → reveal) — for showing/hiding overlays

### TvDisplay Route

The existing `TvDisplay.tsx` gets wrapped:

```tsx
// Before:
<TvDisplay />

// After:
<TvOverlayManager>
  <TvDisplay />
</TvOverlayManager>
```

All overlay layers render as siblings/children of the manager, positioned with `position: fixed` or `absolute` z-indexed above the round content.

### Multiplayer Broadcast

No changes to broadcast protocol. The overlay system runs entirely on the TV/spectator client, reading game state that's already being broadcast. Host TTS and audio only play on the TV display device.

---

## Non-Goals (Out of Scope)

- Custom host avatars/illustrations (use emoji for v1)
- AI-generated commentary (use pre-written pools for v1)
- Player device audio changes (presentation layer is TV-only)
- Replay/highlight reel system
- Match statistics screens
- Third-party TTS services (browser native only for v1)
