# User Journey Redesign

## Overview

Restructure the app's user journey from a state-machine-driven single-page app to a URL-routed multi-screen experience using React Router v6. The landing page presents three clear CTAs (Quick Play, Host, Join), and each flow follows a distinct route sequence through the game.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Routing library | React Router v6 with `HashRouter` | Enables URL-based navigation, back button support, deep linking. HashRouter preserves static hosting compatibility. |
| Category selection | Same as current pack picker, own screen | Moves existing pack selection to a dedicated full-screen step |
| Quick Play format | 11 rounds, classic tiers, single player | Fixed format, zero config, minimal friction |
| Host plays | Always a player | Host auto-added in multiplayer, no toggle |
| Mode choice timing | Right after tapping Host | Landing → Individual/Team → Categories → Lobby |
| Round Intro | Both modes | Shows before every round in Quick Play and multiplayer |
| Host reveal override | Kept | Host can reveal before all answers are in |
| Settings (timer, pack voting) | Removed | Sensible defaults: standard 30s timer, no pack voting |
| Team assignment | Player picks | Players choose their own team in the lobby |

## Route Structure

```
/                         → Landing (3 CTAs: Quick Play, Host, Join)

# Quick Play (single player)
/quick-play/categories    → Category Selection (pack picker)
/quick-play/round-intro   → Round Intro (round #, difficulty, points)
/quick-play/play          → Active Quiz (question + answer + timer)
/quick-play/reveal        → Answer Reveal (correct/incorrect + points)
/quick-play/results       → Final Results

# Host (multiplayer)
/host/mode                → Mode Selection (Individual Versus / Team Versus)
/host/categories          → Category Selection (pack picker)
/host/lobby               → Lobby + Waiting Room (host auto-added)
/host/round-intro         → Round Intro
/host/play                → Active Quiz (host view with player status)
/host/reveal              → Answer Reveal (correct/incorrect lists + points)
/host/results             → Final Results

# Join (multiplayer player)
/join                     → Join Game (room code + name + avatar)
/player/lobby             → Player Lobby View (waiting)
/player/round-intro       → Player Round Intro (round #, difficulty, points)
/player/play              → Player Question View (answer + lock in)
/player/reveal            → Player Reveal View
/player/results           → Player Results View
```

### Navigation Rules

- Forward navigation is programmatic (`navigate()` called by store actions or components)
- Back button works within a flow; Landing (`/`) acts as a boundary
- Deep linking to mid-game routes without an active session redirects to `/`
- Join link format changes from `#join=CODE` to `/join?code=CODE`

## User Flows

### Flow 1: Quick Play (Single Player)

```
Landing → /quick-play/categories → /quick-play/round-intro → /quick-play/play
  → /quick-play/reveal → (repeat round-intro → play → reveal for each round)
  → /quick-play/results → Landing (/)
```

1. User taps **Quick Play** on landing
2. **Category Selection:** picks one or more packs, taps Start
3. `initQuickPlay(packIds)` creates session: single player, classic tiers (11 rounds), standard timer
4. **Round Intro:** shows round number, difficulty, points available. Auto-advances after ~3s or tap
5. **Active Quiz:** question displayed, timer counts down, player submits answer
6. **Answer Reveal:** correct/incorrect shown with explanation and points
7. Auto-advances to next round intro (or tap to continue)
8. After round 11 → **Results:** final score, Play Again / New Game

### Flow 2: Host — Individual Versus

```
Landing → /host/mode → /host/categories → /host/lobby
  → /host/round-intro → /host/play → /host/reveal
  → (repeat for each round) → /host/results → Landing (/)
```

1. User taps **Host** on landing
2. **Mode Selection:** picks **Individual Versus**
3. **Category Selection:** picks packs, taps Start
4. `initHostGame('individual', packIds)` creates session, auto-adds host as player, generates room code
5. **Lobby:** shows room code + QR, player list. Waiting for players to join. Min 2 players to start.
6. Host taps **Start Game**
7. **Round Intro:** broadcast to all players. Shows round #, difficulty, points. ~3s then advances.
8. **Active Quiz (host view):** question + timer + player status bar. Shows "Waiting for Answers" → "All Answers In". "Reveal Answer" button always available, highlighted when all in.
9. Host taps **Reveal Answer**
10. **Answer Reveal:** correct/incorrect player lists + points awarded
11. Host taps **Next Round** → back to round intro
12. After final round → **Results:** rankings, Play Again / New Game

### Flow 3: Host — Team Versus

Same as Flow 2 except:
- **Mode Selection:** picks **Team Versus** + team count (2/3/4)
- **Lobby:** shows team groupings. Players choose their own team when they join.
- **Answer Reveal:** shows team scores alongside individual results
- **Results:** team standings + individual rankings

### Flow 4: Join (Player)

```
Landing → /join → /player/lobby → /player/round-intro → /player/play
  → /player/reveal → (repeat round-intro → play → reveal for each round)
  → /player/results → Landing (/)
```

1. User taps **Join** on landing (or visits `/join?code=XXXXX`)
2. **Join Game:** enters room code (or auto-filled from URL), name, avatar
3. Connects to host's room via Supabase Realtime
4. **Player Lobby:** sees player list, waiting for host. If Team Versus, picks a team.
5. Host starts → player navigated to `/player/round-intro` via broadcast
6. **Player Round Intro:** sees round number, difficulty, points. Auto-advances after ~3s.
7. **Player Question View:** question + answer input + Lock In button + timer
8. After host reveals → `/player/reveal`: sees if correct/incorrect + score
9. Host advances → back to `/player/round-intro` for next round
10. After final round → `/player/results`: sees rankings

## Game Store Changes

### GameSettings (simplified)

```typescript
interface GameSettings {
  soundEnabled: boolean;
  packIds: string[];
  teamMode: boolean;
  teamCount: 2 | 3 | 4;
}
```

**Removed:** `mode`, `timerSpeed`, `packVotingEnabled`, `hostPlays`

- `mode` is inferred from the route (`/quick-play` = single, `/host` = multiplayer)
- `timerSpeed` is hardcoded to `'standard'` (30s)
- `packVotingEnabled` removed entirely
- `hostPlays` always true for multiplayer

### GameSession (simplified)

```typescript
interface GameSession {
  id: string;
  pack: QuestionPack;
  players: Player[];
  currentRound: number;
  settings: GameSettings;
  roundHistory: RoundResult[];
  selectedQuestions: Question[];
  currentPlayerIndex: number;
  allAnswersIn: boolean;
  timerStarted: boolean;
  teams: Team[];
  roomCode?: string;          // multiplayer only
  multiplayerMode?: 'individual' | 'team';  // multiplayer only
}
```

**Removed:** `screen`, `packVotes`, `votedPackId`

### New Store Actions

| Action | Purpose |
|--------|---------|
| `initQuickPlay(packIds)` | Create single-player session with classic tiers, host as sole player |
| `initHostGame(mode, packIds)` | Create multiplayer session, auto-add host, generate room code |
| `revealAnswers()` | Calculate results (kept, but no longer changes `screen`) |
| `proceedToNextRound()` | Reset round state for next question (no longer changes `screen`) |
| `resetGame()` | Clear session state |

Navigation is handled by components calling `navigate()` after store actions complete, not by the store itself.

### Multiplayer Sync

- Host broadcasts include a `route` field (e.g., `'/player/play'`, `'/player/reveal'`)
- Player's `multiplayerStore` listens for route changes and calls `navigate()` on the player side
- This replaces the current `screen` field in broadcast state
- All other game state (players, scores, currentRound, etc.) still synced via broadcast

## Screen Behavior Details

### Landing Page (`/`)

- Three prominent CTAs: Quick Play, Host, Join
- Bottom nav bar (Home, Leaderboard, Profile)
- No settings, no pack selection on this screen

### Mode Selection (`/host/mode`)

- Two cards: **Individual Versus** and **Team Versus**
- Team Versus shows inline team count picker (2/3/4)
- Selection navigates to `/host/categories`

### Category Selection (`/quick-play/categories`, `/host/categories`)

- Full-screen pack picker (reuses existing pack selection UI)
- Select one or more packs
- "Start" button at bottom
- Quick Play: calls `initQuickPlay(packIds)` → navigates to `/quick-play/round-intro`
- Host: calls `initHostGame(mode, packIds)` → navigates to `/host/lobby`

### Lobby (`/host/lobby`)

- Host already present in player list (auto-added)
- Room code display + QR code + copy link button
- Player list with avatars and names
- **Team Versus:** team groupings shown, players pick their team on join
- **Individual Versus:** flat player list
- "Start Game" button (requires min 2 players)
- Start → navigate to `/host/round-intro`

### Join Game (`/join`)

- Room code input (auto-filled from `?code=` query param)
- Name input + avatar/emoji picker
- "Join" button connects via Supabase Realtime
- On successful join → navigate to `/player/lobby`

### Player Lobby (`/player/lobby`)

- "Waiting for host to start..." message
- Player list visible
- **Team Versus:** team picker for player to choose their team
- Host starts game → broadcast navigates player to `/player/play`

### Round Intro (`/quick-play/round-intro`, `/host/round-intro`, `/player/round-intro`)

- Displays: round number (e.g., "Round 3 of 11"), difficulty tier, points available
- Auto-advances after ~3 seconds OR tap/click to skip (host/quick-play)
- In multiplayer: host broadcast navigates players to `/player/round-intro` first, then to `/player/play` when intro completes
- Players see the same round info on their own round-intro screen

### Active Quiz — Quick Play (`/quick-play/play`)

- Question displayed with answer input (multiple choice, numeric, sequence)
- Timer counting down (30s standard)
- Player submits answer → auto-advance to `/quick-play/reveal`
- Timer expires → auto-advance to `/quick-play/reveal`

### Active Quiz — Host (`/host/play`)

- Question displayed + answer input (host is always a player) + timer
- Player status bar showing who has/hasn't answered (including host)
- Host submits their own answer via the same input, then sees status bar
- Status text: "Waiting for Answers" → "All Answers In"
- "Reveal Answer" button (always visible, highlighted when all answers in or timer expired)
- Host can reveal at any time (override for AFK players)
- Host taps Reveal → `revealAnswers()` → navigate to `/host/reveal` + broadcast

### Active Quiz — Player (`/player/play`)

- Question displayed + answer input + timer
- "Lock In" button to submit answer
- After locking in: shows "Waiting for host to reveal..."
- Host reveals → broadcast navigates to `/player/reveal`

### Answer Reveal — All Views (`/*/reveal`)

- Correct answer displayed with explanation
- Lists of correct and incorrect players with points awarded
- Team scores updated and displayed (if team mode)
- **Host:** "Next Round" button (or "See Results" on final round)
- **Quick Play:** auto-advance after delay or tap to continue
- **Player:** passive view, waits for host broadcast

### Results — All Views (`/*/results`)

- Final rankings (individual players sorted by score)
- Team standings table (if team mode)
- Winner announcement with animation
- **Play Again:** restarts with same settings, navigates back to round-intro (or lobby for multiplayer)
- **New Game:** `resetGame()` → navigate to `/`

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/router.tsx` | React Router route definitions with HashRouter |
| `src/components/ModeSelect/ModeSelect.tsx` | Individual vs Team Versus choice screen |
| `src/components/CategorySelect/CategorySelect.tsx` | Full-screen pack picker (extracted from Landing) |
| `src/guards/SessionGuard.tsx` | Route guard: redirects to `/` if no active session |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Replace screen-based switch with `<RouterProvider>` or `<Routes>` |
| `src/stores/gameStore.ts` | Remove `screen`, pack voting. Add `initQuickPlay()`, `initHostGame()`. Simplify settings. Hardcode timer to standard. |
| `src/stores/multiplayerStore.ts` | Broadcast `route` instead of `screen`. Player-side navigation via `navigate()`. |
| `src/types/index.ts` | Remove `GameScreen` type, `packVotingEnabled`, `packVotes`, `votedPackId`. Add `multiplayerMode` to session. |
| `src/components/Landing/Landing.tsx` | Simplify to 3 CTAs only. Remove pack selection, settings, mode picker. |
| `src/components/Lobby/Lobby.tsx` | Host auto-added. Players pick teams (not host-assigned). Remove `hostPlays` toggle. |
| `src/components/Player/JoinGame.tsx` | Read `?code=` query param instead of `#join=`. Navigate on join. |
| `src/components/Player/PlayerView.tsx` | Split into separate route components (PlayerLobby, PlayerPlay, PlayerReveal, PlayerResults). |
| `src/components/Game/GameScreen.tsx` | Remove pack vote logic. Navigation via router. |
| `src/components/Game/RevealScreen.tsx` | Navigation via router instead of store screen change. |
| `src/components/Game/RoundIntro.tsx` | Update to work with router navigation, auto-advance timer. |
| `src/components/Results/Results.tsx` | "Play Again" + "New Game" with route navigation. |
| `src/hooks/useMultiplayer.ts` | Sync routes instead of screen state in broadcasts. |
| `src/index.css` | Potential layout adjustments for new screens. |
| `src/utils/helpers.ts` | Update join URL generation to use query param format. |

### Removed Files

| File | Reason |
|------|--------|
| `src/components/Game/PackVote.tsx` | Pack voting feature removed |
| `src/components/Game/BankingPhase.tsx` | Already deleted |

### New Dependency

- `react-router-dom` v6

## Constants

```typescript
// Hardcoded defaults (replacing configurable settings)
const DEFAULT_TIMER_SECONDS = 30;          // standard speed
const ROUND_INTRO_DURATION_MS = 3000;      // 3s auto-advance
const CLASSIC_TIERS = [90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1];  // 11 rounds
const MIN_PLAYERS_MULTIPLAYER = 2;
const MAX_PLAYERS = 8;
```

## Edge Cases

- **Player disconnects mid-game:** Host can still reveal (override). Disconnected player removed from status bar.
- **Host disconnects:** Players see "Host disconnected" message, return to `/`.
- **Browser refresh mid-game:** SessionGuard redirects to `/` (game state is in-memory only). This is acceptable for a casual game.
- **Join with invalid code:** Error message on `/join` screen, player stays on join screen.
- **Team mode with uneven teams:** Allowed. No forced balancing.
- **Quick Play with 0 packs selected:** Start button disabled until at least 1 pack selected.
