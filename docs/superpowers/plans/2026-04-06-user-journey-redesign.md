# User Journey Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the app from a state-machine screen switcher to URL-based routing with React Router v6, implementing three distinct user flows (Quick Play, Host, Join) with new screens for mode selection, category selection, and round intro.

**Architecture:** Replace `session.screen` with React Router's `HashRouter` as the source of truth for which screen is active. The Zustand game store keeps managing game data (players, scores, rounds) but no longer tracks the current screen. Multiplayer broadcasts include a `route` field so players navigate in sync with the host.

**Tech Stack:** React 19, React Router v6, Zustand 5, Supabase Realtime, Framer Motion, Tailwind CSS v4, Vite 8

---

### Task 1: Install React Router and Create Router Shell

**Files:**
- Modify: `package.json`
- Create: `src/router.tsx`
- Modify: `src/main.tsx` (entry point to wrap with router)

- [ ] **Step 1: Install react-router-dom**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Create `src/router.tsx` with route definitions**

```tsx
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Landing
      { index: true, lazy: () => import('./routes/Landing') },

      // Quick Play flow
      { path: 'quick-play/categories', lazy: () => import('./routes/CategorySelect') },
      { path: 'quick-play/round-intro', lazy: () => import('./routes/RoundIntroPage') },
      { path: 'quick-play/play', lazy: () => import('./routes/Play') },
      { path: 'quick-play/reveal', lazy: () => import('./routes/Reveal') },
      { path: 'quick-play/results', lazy: () => import('./routes/ResultsPage') },

      // Host flow
      { path: 'host/mode', lazy: () => import('./routes/ModeSelect') },
      { path: 'host/categories', lazy: () => import('./routes/CategorySelect') },
      { path: 'host/lobby', lazy: () => import('./routes/HostLobby') },
      { path: 'host/round-intro', lazy: () => import('./routes/RoundIntroPage') },
      { path: 'host/play', lazy: () => import('./routes/Play') },
      { path: 'host/reveal', lazy: () => import('./routes/Reveal') },
      { path: 'host/results', lazy: () => import('./routes/ResultsPage') },

      // Join / Player flow
      { path: 'join', lazy: () => import('./routes/Join') },
      { path: 'player/lobby', lazy: () => import('./routes/PlayerLobby') },
      { path: 'player/round-intro', lazy: () => import('./routes/PlayerRoundIntro') },
      { path: 'player/play', lazy: () => import('./routes/PlayerPlay') },
      { path: 'player/reveal', lazy: () => import('./routes/PlayerReveal') },
      { path: 'player/results', lazy: () => import('./routes/PlayerResults') },
    ],
  },
]);

export default function Root() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: Update `src/main.tsx` to use the router**

Read `src/main.tsx` first. Then replace the `<App />` render with `<Root />`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Root from './router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
```

- [ ] **Step 4: Convert `src/App.tsx` to a layout shell**

Replace the entire contents of `src/App.tsx` with a layout wrapper that loads packs and renders child routes:

```tsx
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './stores/gameStore';
import { useMultiplayerStore } from './stores/multiplayerStore';
import { broadcastHostState } from './hooks/useMultiplayer';
import { loadAllPacks } from './data/loadPacks';
import BottomNavBar from './components/BottomNavBar';

export default function App() {
  const { session, setPacks } = useGameStore();
  const { role } = useMultiplayerStore();
  const location = useLocation();

  useEffect(() => {
    const packs = loadAllPacks();
    setPacks(packs);
  }, [setPacks]);

  // Broadcast game state to players whenever session changes (host only)
  useEffect(() => {
    if (role === 'host' && session) {
      broadcastHostState();
    }
  }, [session, role]);

  const isLanding = location.pathname === '/';

  return (
    <>
      <AnimatePresence mode="wait">
        <Outlet key={location.pathname} />
      </AnimatePresence>
      {isLanding && <BottomNavBar />}
    </>
  );
}
```

- [ ] **Step 5: Create stub route files so the app compiles**

Create `src/routes/` directory. For each route referenced in the router, create a minimal stub file that exports a `Component`:

```bash
mkdir -p src/routes
```

Create `src/routes/Landing.tsx`:
```tsx
import { motion } from 'framer-motion';

export function Component() {
  return (
    <motion.div
      className="min-h-dvh flex items-center justify-center bg-bg-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p className="text-text-primary">Landing (stub)</p>
    </motion.div>
  );
}
```

Repeat for all routes: `CategorySelect.tsx`, `RoundIntroPage.tsx`, `Play.tsx`, `Reveal.tsx`, `ResultsPage.tsx`, `ModeSelect.tsx`, `HostLobby.tsx`, `Join.tsx`, `PlayerLobby.tsx`, `PlayerRoundIntro.tsx`, `PlayerPlay.tsx`, `PlayerReveal.tsx`, `PlayerResults.tsx`. Each follows the same pattern — export a `Component` function with a placeholder.

- [ ] **Step 6: Verify the app compiles and renders the landing stub**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add React Router shell with HashRouter and route stubs"
```

---

### Task 2: Update Types and Game Store

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/stores/gameStore.ts`

- [ ] **Step 1: Update `src/types/index.ts`**

Remove `GameScreen` type, `GameMode`, `TimerSpeed`, and pack voting fields. Add `MultiplayerMode`. Simplify `GameSettings` and `GameSession`:

In `src/types/index.ts`, replace lines 26-84 with:

```typescript
export type MultiplayerMode = 'individual' | 'team';

export interface GameSettings {
  soundEnabled: boolean;
  packIds: string[];
  teamMode: boolean;
  teamCount: 2 | 3 | 4;
}

export interface Player {
  id: string;
  name: string;
  colour: string;
  avatar: string;
  score: number;
  currentAnswer: string | number | null;
  hasAnswered: boolean;
  isHost?: boolean;
  teamId?: string | null;
}

export interface Team {
  id: string;
  name: string;
  colour: string;
  playerIds: string[];
  score: number;
}

export interface RoundResult {
  roundIndex: number;
  difficulty: number;
  question: Question;
  correctPlayers: string[];
  incorrectPlayers: string[];
}

export interface GameSession {
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
  roomCode?: string;
  multiplayerMode?: MultiplayerMode;
}
```

Also remove `TIMER_DURATIONS` constant (lines 103-108). Add a new constant:

```typescript
export const DEFAULT_TIMER_SECONDS = 30;
```

Keep `DIFFICULTY_TIERS`, `QUICK_TIERS`, `POINTS_PER_ROUND`, `PLAYER_COLOURS`, `PLAYER_AVATARS`, `TEAM_COLOURS`, `TEAM_NAMES`, `AVAILABLE_EMOJIS` unchanged.

- [ ] **Step 2: Update `src/stores/gameStore.ts`**

Major changes:
1. Remove `GameScreen` import and `setScreen` action
2. Remove pack voting actions (`submitPackVote`, `resolvePackVote`) and pack voting state (`packVotes`, `votedPackId`)
3. Replace `createGame` with `initQuickPlay` and `initHostGame`
4. `startGame` no longer sets `screen` — just prepares questions
5. `revealAnswers` no longer sets `screen` — just calculates results
6. `proceedToNextRound` returns `'next' | 'done'` to let the caller navigate
7. Hardcode timer to 30 seconds (remove `timerSpeed` references)

Replace the entire `src/stores/gameStore.ts` with:

```typescript
import { create } from 'zustand';
import type {
  GameSession,
  GameSettings,
  Player,
  RoundResult,
  QuestionPack,
  Question,
  Team,
  MultiplayerMode,
} from '../types';
import {
  PLAYER_COLOURS,
  PLAYER_AVATARS,
  POINTS_PER_ROUND,
  DIFFICULTY_TIERS,
  TEAM_COLOURS,
  TEAM_NAMES,
} from '../types';
import { generateId, selectQuestionsForGame } from '../utils/helpers';

interface GameStore {
  session: GameSession | null;
  availablePacks: QuestionPack[];

  setPacks: (packs: QuestionPack[]) => void;
  initQuickPlay: (packIds: string[]) => void;
  initHostGame: (mode: MultiplayerMode, packIds: string[]) => void;
  addPlayer: (name: string, emoji?: string, isHost?: boolean) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  submitAnswer: (playerId: string, answer: string | number) => void;
  revealAnswers: () => void;
  proceedToNextRound: () => 'next' | 'done';
  resetGame: () => void;
  getCurrentQuestion: () => Question | null;
  getActivePlayers: () => Player[];
  getCurrentDifficulty: () => number;
  getCurrentPoints: () => number;
  getTotalRounds: () => number;
  advancePassAndPlay: () => void;
  setAllAnswersIn: () => void;
  assignPlayerToTeam: (playerId: string, teamId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  availablePacks: [],

  setPacks: (packs) => set({ availablePacks: packs }),

  initQuickPlay: (packIds) => {
    const packs = get().availablePacks.filter((p) => packIds.includes(p.pack_id));
    if (packs.length === 0) return;

    const settings: GameSettings = {
      soundEnabled: true,
      packIds,
      teamMode: false,
      teamCount: 2,
    };

    set({
      session: {
        id: generateId(),
        pack: packs[0],
        players: [],
        currentRound: 0,
        settings,
        roundHistory: [],
        selectedQuestions: [],
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        teams: [],
      },
    });
  },

  initHostGame: (mode, packIds) => {
    const packs = get().availablePacks.filter((p) => packIds.includes(p.pack_id));
    if (packs.length === 0) return;

    const isTeam = mode === 'team';
    const teamCount = isTeam ? 2 : 2; // default 2, can be overridden before lobby

    const settings: GameSettings = {
      soundEnabled: true,
      packIds,
      teamMode: isTeam,
      teamCount: teamCount as 2 | 3 | 4,
    };

    const teams: Team[] = isTeam
      ? Array.from({ length: teamCount }, (_, i) => ({
          id: generateId(),
          name: TEAM_NAMES[i],
          colour: TEAM_COLOURS[i],
          playerIds: [],
          score: 0,
        }))
      : [];

    set({
      session: {
        id: generateId(),
        pack: packs[0],
        players: [],
        currentRound: 0,
        settings,
        roundHistory: [],
        selectedQuestions: [],
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        teams,
        multiplayerMode: mode,
      },
    });
  },

  addPlayer: (name, emoji, isHost) => {
    const { session } = get();
    if (!session || session.players.length >= 8) return;

    const usedColours = new Set(session.players.map((p) => p.colour));
    const usedAvatars = new Set(session.players.map((p) => p.avatar));
    const colour = PLAYER_COLOURS.find((c) => !usedColours.has(c)) ?? PLAYER_COLOURS[0];

    let avatar: string;
    if (emoji && !usedAvatars.has(emoji)) {
      avatar = emoji;
    } else {
      avatar = PLAYER_AVATARS.find((a) => !usedAvatars.has(a)) ?? PLAYER_AVATARS[0];
    }

    const player: Player = {
      id: generateId(),
      name,
      colour,
      avatar,
      score: 0,
      currentAnswer: null,
      hasAnswered: false,
      isHost: isHost ?? false,
    };

    set({
      session: {
        ...session,
        players: [...session.players, player],
      },
    });
  },

  removePlayer: (id) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        players: session.players.filter((p) => p.id !== id),
      },
    });
  },

  startGame: () => {
    const { session } = get();
    if (!session) return;

    const packs = get().availablePacks.filter((p) => session.settings.packIds.includes(p.pack_id));
    const questions = selectQuestionsForGame(packs.length > 0 ? packs : [session.pack]);

    set({
      session: {
        ...session,
        currentRound: 0,
        selectedQuestions: questions,
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        players: session.players.map((p) => ({
          ...p,
          currentAnswer: null,
          hasAnswered: false,
        })),
      },
    });
  },

  submitAnswer: (playerId, answer) => {
    const { session } = get();
    if (!session || session.allAnswersIn) return;

    const players = session.players.map((p) =>
      p.id === playerId ? { ...p, currentAnswer: answer, hasAnswered: true } : p
    );

    const allIn = players.every((p) => p.hasAnswered);

    set({
      session: {
        ...session,
        players,
        allAnswersIn: allIn,
      },
    });
  },

  advancePassAndPlay: () => {
    const { session } = get();
    if (!session) return;

    let nextIdx = session.currentPlayerIndex + 1;
    while (nextIdx < session.players.length) {
      if (!session.players[nextIdx].hasAnswered) break;
      nextIdx++;
    }

    const allIn = session.players.every((p) => p.hasAnswered);

    set({
      session: {
        ...session,
        currentPlayerIndex: nextIdx,
        allAnswersIn: allIn,
      },
    });
  },

  setAllAnswersIn: () => {
    const { session } = get();
    if (!session) return;
    set({ session: { ...session, allAnswersIn: true } });
  },

  revealAnswers: () => {
    const { session } = get();
    if (!session) return;

    const question = session.selectedQuestions[session.currentRound];
    if (!question) return;

    const difficulty = [...DIFFICULTY_TIERS][session.currentRound];
    const points = POINTS_PER_ROUND[difficulty] ?? 0;

    const correctIds: string[] = [];
    const incorrectIds: string[] = [];

    const updatedPlayers = session.players.map((p) => {
      const isCorrect = checkAnswer(question, p.currentAnswer);
      if (isCorrect) {
        correctIds.push(p.id);
        return { ...p, score: p.score + points };
      } else {
        incorrectIds.push(p.id);
        return p;
      }
    });

    const roundResult: RoundResult = {
      roundIndex: session.currentRound,
      difficulty,
      question,
      correctPlayers: correctIds,
      incorrectPlayers: incorrectIds,
    };

    const updatedTeams = session.teams.map((team) => {
      const teamPoints =
        correctIds.filter((id) => updatedPlayers.find((p) => p.id === id)?.teamId === team.id)
          .length * points;
      return { ...team, score: team.score + teamPoints };
    });

    set({
      session: {
        ...session,
        players: updatedPlayers,
        roundHistory: [...session.roundHistory, roundResult],
        teams: updatedTeams,
      },
    });
  },

  proceedToNextRound: () => {
    const { session } = get();
    if (!session) return 'done';

    const nextRound = session.currentRound + 1;
    if (nextRound >= DIFFICULTY_TIERS.length) {
      return 'done';
    }

    set({
      session: {
        ...session,
        currentRound: nextRound,
        currentPlayerIndex: 0,
        allAnswersIn: false,
        timerStarted: false,
        players: session.players.map((p) => ({
          ...p,
          currentAnswer: null,
          hasAnswered: false,
        })),
      },
    });

    return 'next';
  },

  resetGame: () => set({ session: null }),

  getCurrentQuestion: () => {
    const { session } = get();
    if (!session) return null;
    return session.selectedQuestions[session.currentRound] ?? null;
  },

  getActivePlayers: () => {
    const { session } = get();
    if (!session) return [];
    return session.players;
  },

  getCurrentDifficulty: () => {
    const { session } = get();
    if (!session) return 90;
    return [...DIFFICULTY_TIERS][session.currentRound] ?? 90;
  },

  getCurrentPoints: () => {
    const { session } = get();
    if (!session) return 0;
    const difficulty = [...DIFFICULTY_TIERS][session.currentRound];
    return POINTS_PER_ROUND[difficulty] ?? 0;
  },

  getTotalRounds: () => {
    return DIFFICULTY_TIERS.length;
  },

  assignPlayerToTeam: (playerId, teamId) => {
    const { session } = get();
    if (!session) return;

    const updatedTeams = session.teams.map((team) => ({
      ...team,
      playerIds: team.playerIds.filter((id) => id !== playerId),
    }));

    const targetTeam = updatedTeams.find((t) => t.id === teamId);
    if (targetTeam) {
      targetTeam.playerIds.push(playerId);
    }

    set({
      session: {
        ...session,
        teams: updatedTeams,
        players: session.players.map((p) =>
          p.id === playerId ? { ...p, teamId } : p
        ),
      },
    });
  },
}));
```

**Important note**: The import at the top of the file must include `checkAnswer`:
```typescript
import { generateId, selectQuestionsForGame, checkAnswer } from '../utils/helpers';
```

- [ ] **Step 3: Update `src/utils/helpers.ts` — remove `GameMode` param from `selectQuestionsForGame`**

Replace the `selectQuestionsForGame` function to always use classic tiers:

```typescript
export function selectQuestionsForGame(packs: QuestionPack[]): Question[] {
  const tiers = [...DIFFICULTY_TIERS];
  const allQuestions = packs.flatMap((p) => p.questions);

  return tiers.map((difficulty) => {
    const available = allQuestions.filter((q) => q.difficulty === difficulty);
    if (available.length === 0) {
      const packNames = packs.map((p) => p.name).join(', ');
      throw new Error(`No questions found for difficulty ${difficulty}% in packs: ${packNames}`);
    }
    return available[Math.floor(Math.random() * available.length)];
  });
}
```

Update the import in `selectQuestionsForGame` — remove `GameMode` from the import:
```typescript
import type { Question, QuestionPack } from '../types';
import { DIFFICULTY_TIERS } from '../types';
```

- [ ] **Step 4: Verify build compiles**

```bash
npm run build
```

Expected: May have errors in components still referencing old types — that's expected, we'll fix them in subsequent tasks.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/stores/gameStore.ts src/utils/helpers.ts
git commit -m "feat: simplify types and game store for URL-based routing"
```

---

### Task 3: Update Multiplayer Store and Hook for Route-Based Sync

**Files:**
- Modify: `src/stores/multiplayerStore.ts`
- Modify: `src/hooks/useMultiplayer.ts`

- [ ] **Step 1: Update `src/stores/multiplayerStore.ts`**

Replace `screen: PlayerScreen` in `GameBroadcast` with `route: string`. Remove `BroadcastPackVote` and `PlayerScreen` types. Remove `packVote` from `GameBroadcast`:

```typescript
import { create } from 'zustand';
import type { QuestionType } from '../types';

export type AppRole = 'host' | 'player' | null;

export interface BroadcastPlayer {
  id: string;
  name: string;
  colour: string;
  avatar: string;
  score: number;
  hasAnswered: boolean;
}

export interface BroadcastRound {
  index: number;
  difficulty: number;
  points: number;
  totalRounds: number;
  timerDuration: number;
  question: {
    question: string;
    type: QuestionType;
    options?: string[];
    image_url?: string | null;
    sequence_items?: string[];
  };
}

export interface BroadcastReveal {
  correctAnswer: string;
  explanation: string;
  correctPlayerIds: string[];
  incorrectPlayerIds: string[];
}

export interface GameBroadcast {
  route: string;
  players: BroadcastPlayer[];
  round?: BroadcastRound;
  reveal?: BroadcastReveal;
  timerStarted?: boolean;
  packName?: string;
  teamMode?: boolean;
  teams?: { id: string; name: string; colour: string; playerIds: string[]; score: number }[];
}

interface MultiplayerStore {
  role: AppRole;
  roomCode: string | null;
  playerId: string | null;
  playerName: string | null;
  isConnected: boolean;
  error: string | null;
  gameState: GameBroadcast | null;

  setRole: (role: AppRole) => void;
  setRoomCode: (code: string | null) => void;
  setPlayerInfo: (id: string, name: string) => void;
  setConnected: (val: boolean) => void;
  setError: (err: string | null) => void;
  setGameState: (state: GameBroadcast) => void;
  reset: () => void;
}

export const useMultiplayerStore = create<MultiplayerStore>((set) => ({
  role: null,
  roomCode: null,
  playerId: null,
  playerName: null,
  isConnected: false,
  error: null,
  gameState: null,

  setRole: (role) => set({ role }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayerInfo: (playerId, playerName) => set({ playerId, playerName }),
  setConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  setGameState: (gameState) => set({ gameState }),
  reset: () =>
    set({
      role: null,
      roomCode: null,
      playerId: null,
      playerName: null,
      isConnected: false,
      error: null,
      gameState: null,
    }),
}));
```

- [ ] **Step 2: Update `src/hooks/useMultiplayer.ts` — `broadcastHostState`**

The `broadcastHostState` function needs to:
1. Accept a `route` parameter (the current host route to broadcast to players)
2. Replace `screen` with `route` in the broadcast payload
3. Remove all pack voting broadcast logic
4. Include team data in broadcast
5. Hardcode timer duration to 30s

Replace the `broadcastHostState` function (lines 25-112) with:

```typescript
export function broadcastHostState(route?: string) {
  if (!hostChannel) return;
  const store = useGameStore.getState();
  if (!store.session) return;

  const s = store.session;

  if (!s.timerStarted && s.currentRound !== readyPlayersRound) {
    readyPlayers.clear();
    readyPlayersRound = s.currentRound;
  }

  const tiers = [90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1];
  const difficulty = tiers[s.currentRound] ?? 90;
  const pointsMap: Record<number, number> = {
    90: 100, 80: 200, 70: 300, 60: 500, 50: 1000,
    40: 2000, 30: 5000, 20: 10000, 10: 25000, 5: 50000, 1: 100000,
  };
  const points = pointsMap[difficulty] ?? 0;

  const players: BroadcastPlayer[] = s.players.map((p) => ({
    id: p.id,
    name: p.name,
    colour: p.colour,
    avatar: p.avatar,
    score: p.score,
    hasAnswered: p.hasAnswered,
  }));

  const currentQ = s.selectedQuestions[s.currentRound];
  const lastRound = s.roundHistory[s.roundHistory.length - 1];

  // Use provided route or default to /player/lobby
  const playerRoute = route ?? lastBroadcastRoute ?? '/player/lobby';
  lastBroadcastRoute = playerRoute;

  const broadcast: GameBroadcast = {
    route: playerRoute,
    players,
    timerStarted: s.timerStarted,
    packName: s.pack.name,
    teamMode: s.settings.teamMode,
    teams: s.teams,
  };

  if (playerRoute.includes('/play') && currentQ) {
    broadcast.round = {
      index: s.currentRound,
      difficulty,
      points,
      totalRounds: tiers.length,
      timerDuration: 30,
      question: {
        question: currentQ.question,
        type: currentQ.type,
        options: currentQ.options,
        image_url: currentQ.image_url,
        sequence_items: currentQ.sequence_items,
      },
    };
  }

  if (playerRoute.includes('/reveal') && lastRound) {
    const correctAnswer =
      lastRound.question.type === 'multiple_choice' || lastRound.question.type === 'image_based'
        ? lastRound.question.options?.[Number(lastRound.question.correct_answer)] ??
          String(lastRound.question.correct_answer)
        : String(lastRound.question.correct_answer);

    broadcast.reveal = {
      correctAnswer,
      explanation: lastRound.question.explanation,
      correctPlayerIds: lastRound.correctPlayers,
      incorrectPlayerIds: lastRound.incorrectPlayers,
    };
  }

  hostChannel.send({ type: 'broadcast', event: 'game_state', payload: broadcast });
}
```

Also add this module-level variable near the top with the other module-level state:

```typescript
let lastBroadcastRoute: string | null = null;
```

- [ ] **Step 3: Update `useHostMultiplayer` — remove pack vote listener**

In the `createRoom` callback, remove the `.on('broadcast', { event: 'pack_vote' }, ...)` listener (around line 243-246). Also remove the `submitPackVote` import from `useGameStore`.

Update the `createRoom` function signature — it no longer needs `GameSettings` param since settings are already in the store. Instead it reads from the store:

```typescript
const createRoom = useCallback(async () => {
    const store = useGameStore.getState();
    if (!store.session) return null;
    const settings = store.session.settings;
    const code = generateRoomCode();
    // ... rest stays the same but remove pack_vote listener
```

- [ ] **Step 4: Update `usePlayerMultiplayer` — remove `sendPackVote`**

Remove the `sendPackVote` callback entirely. Remove it from the return value. Keep `joinRoom`, `sendReady`, `sendAnswer`, `disconnect`.

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/stores/multiplayerStore.ts src/hooks/useMultiplayer.ts
git commit -m "feat: update multiplayer to broadcast routes instead of screens"
```

---

### Task 4: Build the Landing Page Route

**Files:**
- Modify: `src/routes/Landing.tsx` (replace stub)
- Modify: `src/components/BottomNavBar.tsx` (use router navigation)

- [ ] **Step 1: Implement `src/routes/Landing.tsx`**

Simple landing with 3 CTAs. No pack selection, no settings — just Quick Play, Host, Join:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../stores/profileStore';
import ProfileScreen from '../components/Profile/ProfileScreen';
import HistoryScreen from '../components/History/HistoryScreen';

export function Component() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const [tab, setTab] = useState<'home' | 'leaderboard' | 'profile'>('home');

  if (tab === 'leaderboard') {
    return <HistoryScreen key="history" onClose={() => setTab('home')} />;
  }
  if (tab === 'profile') {
    return <ProfileScreen key="profile" onClose={() => setTab('home')} />;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary pb-24">
      <motion.div
        className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Top Bar */}
        <div className="flex items-center gap-2 mb-8">
          {profile && <span className="text-2xl">{profile.avatar}</span>}
          <h1 className="font-display text-2xl text-text-primary leading-none tracking-tight">
            The 1% Club
          </h1>
        </div>

        {/* Spacer to center CTAs */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            className="w-full max-w-sm space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Quick Play */}
            <motion.button
              onClick={() => navigate('/quick-play/categories')}
              className="w-full py-5 rounded-2xl font-display text-2xl tracking-wider bg-neon-gold text-text-primary shadow-gold flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              QUICK PLAY
            </motion.button>

            {/* Host */}
            <motion.button
              onClick={() => navigate('/host/mode')}
              className="w-full py-5 rounded-2xl font-display text-2xl tracking-wider bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              HOST
            </motion.button>

            {/* Join */}
            <motion.button
              onClick={() => navigate('/join')}
              className="w-full py-5 rounded-2xl font-display text-2xl tracking-wider bg-bg-card text-neon-cyan shadow-soft hover:bg-bg-elevated transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              JOIN
            </motion.button>
          </motion.div>
        </div>

        {/* How to Play (collapsed) */}
        <HowToPlay />
      </motion.div>
    </div>
  );
}

function HowToPlay() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-auto pb-4">
      <motion.button
        onClick={() => setOpen(!open)}
        className="text-text-secondary hover:text-neon-cyan transition-colors text-sm underline underline-offset-4"
      >
        {open ? 'Hide rules' : 'How to play'}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mt-4 bg-bg-card shadow-soft rounded-2xl p-6 text-left text-sm text-text-secondary leading-relaxed"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <h3 className="font-display text-xl text-text-primary tracking-wide mb-3">THE RULES</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>Questions go from <span className="text-neon-green font-medium">90%</span> (easiest) down to <span className="text-neon-pink font-medium">1%</span> (hardest).</li>
              <li>The percentage = how many people in SA could solve it.</li>
              <li>All players answer each question. Get it right? <span className="text-neon-green font-medium">Earn points!</span></li>
              <li>Points increase as questions get harder. The highest score wins.</li>
              <li>No trivia! Every question is solvable through <span className="text-neon-cyan font-medium">logic and reasoning</span> alone.</li>
              <li>There are 11 rounds per game.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/components/BottomNavBar.tsx` to use router**

The BottomNavBar now needs to work with the landing page's tab state. Since it's rendered from App.tsx and needs to communicate with the Landing route, the simplest approach is to keep it as-is but pass tab state through the URL or keep the existing callback pattern.

Actually, since the BottomNavBar is rendered in `App.tsx` only on the landing page, and the Landing route manages its own tab state internally, we need to move the BottomNavBar into the Landing route instead. 

Update `src/App.tsx` — remove the BottomNavBar import and rendering:

```tsx
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './stores/gameStore';
import { useMultiplayerStore } from './stores/multiplayerStore';
import { broadcastHostState } from './hooks/useMultiplayer';
import { loadAllPacks } from './data/loadPacks';

export default function App() {
  const { session, setPacks } = useGameStore();
  const { role } = useMultiplayerStore();
  const location = useLocation();

  useEffect(() => {
    const packs = loadAllPacks();
    setPacks(packs);
  }, [setPacks]);

  useEffect(() => {
    if (role === 'host' && session) {
      broadcastHostState();
    }
  }, [session, role]);

  return (
    <AnimatePresence mode="wait">
      <Outlet key={location.pathname} />
    </AnimatePresence>
  );
}
```

Then in the Landing route, add the BottomNavBar at the bottom. Wrap the landing content + BottomNavBar together. Update `src/routes/Landing.tsx` to include BottomNavBar:

Add after the closing `</motion.div>` and before the closing `</div>`:
```tsx
<BottomNavBar activeTab={tab} onTabChange={setTab} />
```

And import it:
```tsx
import BottomNavBar from '../components/BottomNavBar';
```

- [ ] **Step 3: Verify landing page renders**

```bash
npm run dev
```

Open `http://localhost:5173` — should see the 3 CTAs.

- [ ] **Step 4: Commit**

```bash
git add src/routes/Landing.tsx src/App.tsx src/components/BottomNavBar.tsx
git commit -m "feat: implement landing page with 3 CTAs and router-based nav"
```

---

### Task 5: Build Mode Select and Category Select Routes

**Files:**
- Modify: `src/routes/ModeSelect.tsx` (replace stub)
- Modify: `src/routes/CategorySelect.tsx` (replace stub)

- [ ] **Step 1: Implement `src/routes/ModeSelect.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Component() {
  const navigate = useNavigate();
  const [teamCount, setTeamCount] = useState<2 | 3 | 4>(2);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <h1 className="font-display text-4xl text-text-primary text-center mb-8 tracking-tight">
          GAME MODE
        </h1>

        <div className="space-y-4">
          {/* Individual Versus */}
          <motion.button
            onClick={() => {
              navigate('/host/categories', { state: { mode: 'individual' } });
            }}
            className="w-full bg-bg-card shadow-soft rounded-2xl p-6 text-left hover:bg-bg-elevated transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">⚔️</span>
              <div>
                <h2 className="font-display text-xl text-text-primary tracking-wide">
                  INDIVIDUAL VERSUS
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  Every player for themselves
                </p>
              </div>
            </div>
          </motion.button>

          {/* Team Versus */}
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-6"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">👥</span>
              <div>
                <h2 className="font-display text-xl text-text-primary tracking-wide">
                  TEAM VERSUS
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  Compete as teams
                </p>
              </div>
            </div>

            {/* Team count picker */}
            <div className="flex gap-2 mb-4">
              {([2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  onClick={() => setTeamCount(count)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    teamCount === count
                      ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-primary'
                      : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface'
                  }`}
                >
                  {count} Teams
                </button>
              ))}
            </div>

            <motion.button
              onClick={() => {
                navigate('/host/categories', {
                  state: { mode: 'team', teamCount },
                });
              }}
              className="w-full py-3 rounded-full font-display text-lg tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SELECT TEAMS
            </motion.button>
          </motion.div>
        </div>

        {/* Back */}
        <motion.button
          onClick={() => navigate('/')}
          className="w-full mt-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </motion.button>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/routes/CategorySelect.tsx`**

This reuses the pack picker UI from the old Landing page. Works for both Quick Play and Host flows:

```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useHostMultiplayer } from '../hooks/useMultiplayer';
import { useProfileStore } from '../stores/profileStore';
import type { MultiplayerMode } from '../types';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { availablePacks, initQuickPlay, initHostGame, addPlayer, startGame } = useGameStore();
  const { createRoom } = useHostMultiplayer();
  const profile = useProfileStore((s) => s.profile);

  // Determine flow from URL
  const isQuickPlay = location.pathname.startsWith('/quick-play');
  const isHost = location.pathname.startsWith('/host');

  // Mode info passed from ModeSelect via location state
  const locationState = location.state as { mode?: MultiplayerMode; teamCount?: 2 | 3 | 4 } | null;
  const hostMode = locationState?.mode ?? 'individual';
  const teamCount = locationState?.teamCount ?? 2;

  const [selectedPacks, setSelectedPacks] = useState<string[]>(
    availablePacks.length > 0 ? [availablePacks[0].pack_id] : []
  );

  const togglePack = (packId: string) => {
    setSelectedPacks((prev) => {
      if (prev.includes(packId) && prev.length <= 1) return prev;
      return prev.includes(packId)
        ? prev.filter((id) => id !== packId)
        : [...prev, packId];
    });
  };

  const toggleAll = () => {
    setSelectedPacks((prev) =>
      prev.length === availablePacks.length
        ? [availablePacks[0].pack_id]
        : availablePacks.map((p) => p.pack_id)
    );
  };

  const totalQuestions = availablePacks
    .filter((p) => selectedPacks.includes(p.pack_id))
    .reduce((sum, p) => sum + p.question_count, 0);

  const handleStart = async () => {
    if (selectedPacks.length === 0) return;

    if (isQuickPlay) {
      initQuickPlay(selectedPacks);
      addPlayer(profile?.name ?? 'Player', profile?.avatar);
      startGame();
      navigate('/quick-play/round-intro');
    } else if (isHost) {
      // Update teamCount in store if team mode
      initHostGame(hostMode, selectedPacks);
      if (hostMode === 'team') {
        // Re-init with correct team count
        const store = useGameStore.getState();
        if (store.session && teamCount !== 2) {
          // Reinitialize teams with correct count
          initHostGame(hostMode, selectedPacks);
        }
      }
      await createRoom();
      navigate('/host/lobby');
    }
  };

  const getCategoryIcon = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('science')) return '🔬';
    if (lower.includes('history')) return '📜';
    if (lower.includes('sport')) return '🏀';
    if (lower.includes('geo')) return '🌍';
    if (lower.includes('music') || lower.includes('entertainment') || lower.includes('pop')) return '🎬';
    if (lower.includes('food') || lower.includes('cook')) return '🍳';
    if (lower.includes('nature') || lower.includes('animal')) return '🌿';
    if (lower.includes('tech') || lower.includes('computer')) return '💻';
    if (lower.includes('math') || lower.includes('number')) return '🔢';
    if (lower.includes('language') || lower.includes('word')) return '📝';
    if (lower.includes('art')) return '🎨';
    if (lower.includes('brain') || lower.includes('logic')) return '🧠';
    return '📚';
  };

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary px-4 py-6">
      <motion.div
        className="flex-1 max-w-2xl mx-auto w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <h1 className="font-display text-4xl text-text-primary text-center mb-2 tracking-tight">
          CATEGORIES
        </h1>
        <p className="text-text-secondary text-center text-sm mb-6">
          {isQuickPlay ? 'Choose your categories' : 'Choose categories for your game'}
        </p>

        {/* Select All toggle */}
        <div className="flex justify-end mb-3">
          <button
            onClick={toggleAll}
            className="text-xs text-neon-cyan font-medium hover:text-neon-purple transition-colors"
          >
            {selectedPacks.length === availablePacks.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Pack grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {availablePacks.map((pack) => {
            const isSelected = selectedPacks.includes(pack.pack_id);
            return (
              <motion.button
                key={pack.pack_id}
                onClick={() => togglePack(pack.pack_id)}
                className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-bg-elevated shadow-primary'
                    : 'bg-bg-card shadow-soft hover:bg-bg-surface'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <span className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-primary-container/20' : 'bg-bg-elevated'
                }`}>
                  {getCategoryIcon(pack.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block font-medium text-sm text-text-primary truncate">{pack.name}</span>
                  <span className="text-[10px] text-text-muted">{pack.question_count} Qs</span>
                </div>
                {isSelected && (
                  <svg className="w-5 h-5 text-neon-cyan flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </motion.button>
            );
          })}
        </div>

        <p className="text-xs text-text-muted mb-6">
          {totalQuestions} questions from {selectedPacks.length} pack{selectedPacks.length !== 1 ? 's' : ''}
        </p>

        {/* Start */}
        <motion.button
          onClick={handleStart}
          disabled={selectedPacks.length === 0}
          className="w-full py-4 rounded-full font-display text-xl tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isQuickPlay ? 'START' : 'NEXT'}
        </motion.button>

        {/* Back */}
        <motion.button
          onClick={() => navigate(-1)}
          className="w-full mt-3 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </motion.button>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Verify navigation Quick Play → Categories works**

```bash
npm run dev
```

Click Quick Play on landing → should see category selection.

- [ ] **Step 4: Commit**

```bash
git add src/routes/ModeSelect.tsx src/routes/CategorySelect.tsx
git commit -m "feat: implement mode select and category select screens"
```

---

### Task 6: Build Host Lobby Route

**Files:**
- Modify: `src/routes/HostLobby.tsx` (replace stub)

- [ ] **Step 1: Implement `src/routes/HostLobby.tsx`**

Adapts the existing `Lobby.tsx` component but: host is auto-added, players pick their own teams, no local player input (only multiplayer join), and uses router navigation. The executing agent should read `src/components/Lobby/Lobby.tsx` (lines 1-405) and adapt it.

Key differences from the old Lobby:
1. Host is auto-added on mount (using profile name/avatar)
2. No local player add input — players join remotely
3. Team assignment is done by players (via broadcast), not host dropdown
4. Start navigates to `/host/round-intro` instead of calling `startGame()` which set `screen`
5. Back navigates to `/` and cleans up multiplayer

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { endHostGame, broadcastHostState } from '../hooks/useMultiplayer';
import { useProfileStore } from '../stores/profileStore';
import { PLAYER_COLOURS } from '../types';

function getJoinUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
}

export function Component() {
  const navigate = useNavigate();
  const { session, addPlayer, removePlayer, startGame, resetGame } = useGameStore();
  const { roomCode } = useMultiplayerStore();
  const mpReset = useMultiplayerStore((s) => s.reset);
  const profile = useProfileStore((s) => s.profile);
  const [copied, setCopied] = useState(false);

  // Auto-add host as player on mount
  useEffect(() => {
    if (!session) return;
    const hasHost = session.players.some((p) => p.isHost);
    if (!hasHost) {
      addPlayer(profile?.name ?? 'Host', profile?.avatar, true);
    }
  }, [session, addPlayer, profile]);

  if (!session || !roomCode) {
    navigate('/');
    return null;
  }

  const { players, settings } = session;
  const canStart = players.length >= 2;

  const handleStart = () => {
    startGame();
    broadcastHostState('/player/round-intro');
    navigate('/host/round-intro');
  };

  const handleBack = () => {
    endHostGame();
    mpReset();
    resetGame();
    navigate('/');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4 py-8 bg-bg-primary">
      <motion.div
        className="relative z-10 w-full max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center mb-6">
          <h1 className="font-display text-5xl text-text-primary tracking-tight">LOBBY</h1>

          <motion.div
            className="mt-4 bg-bg-card rounded-2xl shadow-soft-md p-6 inline-flex flex-col items-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <span className="text-xs text-text-muted block mb-1">ROOM CODE</span>
            <span className="font-display text-5xl text-neon-cyan font-bold tracking-[0.3em]">
              {roomCode}
            </span>

            <div className="mt-4 p-3 bg-white rounded-xl">
              <QRCodeSVG
                value={getJoinUrl(roomCode)}
                size={160}
                bgColor="#ffffff"
                fgColor="#0a0a0f"
                level="M"
              />
            </div>

            <motion.button
              onClick={() => {
                navigator.clipboard.writeText(getJoinUrl(roomCode));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-bg-elevated text-neon-cyan hover:bg-bg-surface transition-all"
              whileTap={{ scale: 0.95 }}
            >
              {copied ? '✓ COPIED!' : 'COPY INVITE LINK'}
            </motion.button>

            <p className="text-text-muted text-xs mt-2">
              Scan the QR code or share the link to join
            </p>
          </motion.div>

          <p className="text-text-secondary mt-3">
            Players join on their own devices
          </p>

          <div className="flex gap-3 justify-center mt-3">
            <span className="text-xs px-3 py-1 rounded-full bg-bg-elevated text-neon-cyan">
              {settings.teamMode ? 'TEAM VERSUS' : 'INDIVIDUAL'}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-neon-green/10 text-neon-green">
              MULTIPLAYER
            </span>
          </div>
        </div>

        {/* Player List */}
        <div className="space-y-2 mb-8 min-h-[120px]">
          <AnimatePresence mode="popLayout">
            {players.map((player, idx) => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center gap-3 bg-bg-card rounded-xl shadow-soft px-4 py-3"
              >
                <span className="text-2xl">{player.avatar}</span>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PLAYER_COLOURS[idx % PLAYER_COLOURS.length] }}
                />
                <span className="flex-1 text-lg font-medium text-text-primary">
                  {player.name}
                  {player.isHost && <span className="ml-1.5 text-neon-gold text-sm">👑</span>}
                </span>
                <span className="text-xs text-text-muted">P{idx + 1}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {players.length <= 1 && (
            <div className="flex items-center justify-center h-[80px] text-text-muted text-sm">
              Waiting for players to join...
            </div>
          )}
        </div>

        {/* Team display (if team mode) */}
        {settings.teamMode && session.teams.length > 0 && players.length > 1 && (
          <div className="mb-6">
            <h3 className="font-display text-sm text-text-secondary tracking-wide mb-3">TEAMS</h3>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${session.teams.length}, 1fr)` }}>
              {session.teams.map((team) => {
                const teamPlayers = players.filter((p) => p.teamId === team.id);
                return (
                  <div key={team.id} className="bg-bg-card rounded-xl shadow-soft p-3 min-h-[60px]">
                    <h4 className="font-display text-xs tracking-wide mb-2" style={{ color: team.colour }}>
                      {team.name}
                    </h4>
                    <div className="space-y-1">
                      {teamPlayers.map((p) => (
                        <div key={p.id} className="flex items-center gap-1 text-xs text-text-primary">
                          <span>{p.avatar}</span> {p.name}
                        </div>
                      ))}
                      {teamPlayers.length === 0 && (
                        <p className="text-xs text-text-muted">No players</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player count dots */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < players.length ? 'bg-neon-cyan scale-100' : 'bg-gray-200 scale-75'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-full font-display text-lg tracking-wide bg-bg-card shadow-soft text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            BACK
          </motion.button>
          <motion.button
            onClick={handleStart}
            disabled={!canStart}
            className={`flex-[2] py-3.5 rounded-full font-display text-lg tracking-wide transition-all ${
              canStart
                ? 'bg-gradient-to-r from-neon-cyan to-primary-container text-white hover:brightness-110 shadow-primary'
                : 'bg-bg-elevated text-text-muted cursor-not-allowed'
            }`}
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            {canStart
              ? 'START GAME'
              : `NEED ${2 - players.length} MORE PLAYER${2 - players.length === 1 ? '' : 'S'}`}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/HostLobby.tsx
git commit -m "feat: implement host lobby with auto-add host and QR sharing"
```

---

### Task 7: Build Round Intro, Play, and Reveal Routes (Host + Quick Play)

**Files:**
- Modify: `src/routes/RoundIntroPage.tsx`
- Modify: `src/routes/Play.tsx`
- Modify: `src/routes/Reveal.tsx`

- [ ] **Step 1: Implement `src/routes/RoundIntroPage.tsx`**

Shared between quick-play and host flows. Shows round number, difficulty, points. Auto-advances after 3s or tap:

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { formatRands, getDifficultyColour } from '../utils/helpers';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, getCurrentDifficulty, getCurrentPoints, getTotalRounds } = useGameStore();
  const role = useMultiplayerStore((s) => s.role);
  const [dismissed, setDismissed] = useState(false);
  const completedRef = useRef(false);

  const isQuickPlay = location.pathname.startsWith('/quick-play');
  const playRoute = isQuickPlay ? '/quick-play/play' : '/host/play';

  const difficulty = getCurrentDifficulty();
  const points = getCurrentPoints();
  const totalRounds = getTotalRounds();
  const roundIndex = session?.currentRound ?? 0;
  const diffColour = getDifficultyColour(difficulty);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        if (role === 'host') {
          broadcastHostState('/player/play');
        }
        navigate(playRoute, { replace: true });
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, playRoute, role]);

  const handleTap = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      if (role === 'host') {
        broadcastHostState('/player/play');
      }
      navigate(playRoute, { replace: true });
    }
  };

  if (!session) {
    navigate('/');
    return null;
  }

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleTap}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <span className="text-text-muted text-sm uppercase tracking-wider block mb-2">
          Round {roundIndex + 1} of {totalRounds}
        </span>
        <h2 className="font-display text-6xl md:text-7xl font-bold mb-3" style={{ color: diffColour }}>
          {difficulty}%
        </h2>
        <span className="font-score text-2xl text-neon-gold block mb-6">
          {formatRands(points)}
        </span>

        <div className="w-48 h-1.5 bg-bg-elevated rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: diffColour }}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        </div>

        <p className="text-text-muted text-xs mt-4">Tap to skip</p>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Implement `src/routes/Play.tsx`**

Adapts `GameScreen.tsx` but uses router navigation. The executing agent should read `src/components/Game/GameScreen.tsx` (lines 1-299) and adapt it. Key changes:
- No `showIntro` state (round intro is its own route now)
- Navigate to reveal route instead of store setting screen
- Hardcode timer to 30s
- Use `broadcastHostState('/player/reveal')` before navigating to reveal

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { useTimer } from '../hooks/useTimer';
import { useSound } from '../hooks/useSound';
import { DEFAULT_TIMER_SECONDS } from '../types';
import QuestionDisplay from '../components/Game/QuestionDisplay';
import AnswerInput from '../components/Game/AnswerInput';
import Timer from '../components/Game/Timer';
import PlayerStatusBar from '../components/Game/PlayerStatusBar';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    session,
    getCurrentQuestion,
    getActivePlayers,
    getCurrentDifficulty,
    getCurrentPoints,
    getTotalRounds,
    submitAnswer,
    revealAnswers,
    setAllAnswersIn,
  } = useGameStore();

  const role = useMultiplayerStore((s) => s.role);
  const isMultiplayer = role === 'host';
  const isQuickPlay = location.pathname.startsWith('/quick-play');
  const revealRoute = isQuickPlay ? '/quick-play/reveal' : '/host/reveal';

  const { play } = useSound();
  const [currentPassPlayIdx, setCurrentPassPlayIdx] = useState(0);

  const question = getCurrentQuestion();
  const activePlayers = getActivePlayers();
  const difficulty = getCurrentDifficulty();
  const points = getCurrentPoints();
  const totalRounds = getTotalRounds();

  const handleTimerExpire = useCallback(() => {
    play('timer_expired');
    const store = useGameStore.getState();
    if (store.session && !store.session.allAnswersIn) {
      setAllAnswersIn();
    }
  }, [play, setAllAnswersIn]);

  const { timeLeft, progress, isRunning, start: startTimer, reset: resetTimer } = useTimer({
    duration: DEFAULT_TIMER_SECONDS,
    onExpire: handleTimerExpire,
    autoStart: !isMultiplayer,
  });

  useEffect(() => {
    if (isMultiplayer && session?.timerStarted) {
      startTimer();
    }
  }, [isMultiplayer, session?.timerStarted, startTimer]);

  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && isRunning) {
      play('timer_tick');
    }
  }, [timeLeft, isRunning, play]);

  const allIn = session?.allAnswersIn;
  const revealedRef = useRef(false);

  useEffect(() => {
    if (!allIn || revealedRef.current) return;
    const delay = setTimeout(() => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      play('answer_submitted');
      revealAnswers();
      resetTimer();
      if (isMultiplayer) {
        broadcastHostState('/player/reveal');
      }
      navigate(revealRoute, { replace: true });
    }, 500);
    return () => clearTimeout(delay);
  }, [allIn, play, revealAnswers, resetTimer, navigate, revealRoute, isMultiplayer]);

  if (!session || !question) {
    navigate('/');
    return null;
  }

  const handleSubmitAnswer = (playerId: string, answer: string | number) => {
    submitAnswer(playerId, answer);
    play('answer_submitted');
    const nextIdx = currentPassPlayIdx + 1;
    if (nextIdx < activePlayers.length) {
      setCurrentPassPlayIdx(nextIdx);
    }
  };

  const handleReveal = () => {
    revealedRef.current = true;
    play('answer_submitted');
    revealAnswers();
    resetTimer();
    if (isMultiplayer) {
      broadcastHostState('/player/reveal');
    }
    navigate(revealRoute, { replace: true });
  };

  const currentPlayer = activePlayers[currentPassPlayIdx];
  const allAnswered = session.allAnswersIn || activePlayers.every((p) => p.hasAnswered);

  // Host plays: host answers first
  const hostPlayer = session.players.find((p) => p.isHost);
  const hostHasAnswered = hostPlayer?.hasAnswered ?? true;

  const handleHostAnswer = (answer: string | number) => {
    if (hostPlayer) {
      submitAnswer(hostPlayer.id, answer);
      play('answer_submitted');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary relative overflow-hidden">
      <div className="relative z-10 flex flex-col flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex-1" />
          <button
            onClick={() => navigate(isQuickPlay ? '/quick-play/results' : '/host/results')}
            className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1"
          >
            End Game
          </button>
        </div>
        <Timer timeLeft={timeLeft} progress={progress} />

        <div className="mt-4 mb-6">
          <PlayerStatusBar players={session.players} showAnswerStatus={true} />
        </div>

        <QuestionDisplay
          question={question}
          roundIndex={session.currentRound}
          difficulty={difficulty}
          points={points}
          totalRounds={totalRounds}
        />

        <div className="mt-6 flex-1">
          <AnimatePresence mode="wait">
            {isMultiplayer ? (
              !session.timerStarted ? (
                <motion.div
                  key="waiting-ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary text-lg mb-2">Waiting for players to get ready...</p>
                  <motion.button
                    onClick={() => {
                      useGameStore.setState({
                        session: { ...session, timerStarted: true },
                      });
                    }}
                    className="mt-4 py-3 px-8 rounded-lg font-display text-lg tracking-wider bg-bg-elevated text-neon-cyan hover:bg-bg-surface transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    START ROUND
                  </motion.button>
                </motion.div>
              ) : hostPlayer && !hostHasAnswered ? (
                <motion.div
                  key="host-answer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AnswerInput
                    question={question}
                    onSubmit={handleHostAnswer}
                    playerName={hostPlayer.name}
                    playerColour={hostPlayer.colour}
                  />
                </motion.div>
              ) : !allAnswered ? (
                <motion.div
                  key="waiting-remote"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary text-lg mb-2">Waiting for answers...</p>
                  <p className="text-text-muted text-sm">
                    {activePlayers.filter((p) => p.hasAnswered).length} / {activePlayers.length} locked in
                  </p>
                  <motion.button
                    onClick={() => setAllAnswersIn()}
                    className="mt-4 py-2 px-6 rounded-lg font-display text-sm tracking-wider bg-neon-gold/10 text-neon-gold hover:bg-neon-gold/20 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    CLOSE ANSWERS
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="all-in-mp"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-text-secondary mb-4 text-lg">All answers are in!</p>
                  <motion.button
                    onClick={handleReveal}
                    className="py-4 px-10 rounded-xl font-display text-2xl tracking-wider bg-neon-gold text-text-primary hover:brightness-110 shadow-gold"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    animate={{
                      boxShadow: [
                        '0 0 8px rgba(253,212,4,0.3)',
                        '0 0 24px rgba(253,212,4,0.5)',
                        '0 0 8px rgba(253,212,4,0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    REVEAL ANSWER
                  </motion.button>
                </motion.div>
              )
            ) : (
              !allAnswered && currentPlayer ? (
                <motion.div
                  key={currentPlayer.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <AnswerInput
                    question={question}
                    onSubmit={(answer) => handleSubmitAnswer(currentPlayer.id, answer)}
                    playerName={currentPlayer.name}
                    playerColour={currentPlayer.colour}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="all-in"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-text-secondary mb-4 text-lg">All answers are in!</p>
                  <motion.button
                    onClick={handleReveal}
                    className="py-4 px-10 rounded-xl font-display text-2xl tracking-wider bg-neon-gold text-text-primary hover:brightness-110 shadow-gold"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    REVEAL ANSWER
                  </motion.button>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `src/routes/Reveal.tsx`**

Adapts `RevealScreen.tsx`. Key changes: navigate to next round-intro or results instead of store screen change. The executing agent should read `src/components/Game/RevealScreen.tsx` (lines 1-190) and adapt:

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { useSound } from '../hooks/useSound';
import { formatRands } from '../utils/helpers';
import PlayerStatusBar from '../components/Game/PlayerStatusBar';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, proceedToNextRound, getCurrentPoints, getTotalRounds } = useGameStore();
  const role = useMultiplayerStore((s) => s.role);
  const { play } = useSound();
  const [phase, setPhase] = useState<'answer' | 'results' | 'ready'>('answer');

  const isQuickPlay = location.pathname.startsWith('/quick-play');
  const isMultiplayer = role === 'host';

  const lastRound = session?.roundHistory[session.roundHistory.length - 1];
  const totalRounds = getTotalRounds();

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('results');
      if (lastRound && lastRound.incorrectPlayers.length > 0) {
        play('wrong_reveal');
      } else {
        play('correct_reveal');
      }
    }, 1500);

    const t2 = setTimeout(() => setPhase('ready'), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lastRound, play]);

  if (!session || !lastRound) {
    navigate('/');
    return null;
  }

  const question = lastRound.question;
  const correctAnswer =
    question.type === 'multiple_choice' || question.type === 'image_based'
      ? question.options?.[Number(question.correct_answer)] ?? String(question.correct_answer)
      : question.type === 'sequence'
        ? String(question.correct_answer)
            .split(',')
            .map((i) => {
              const items = question.sequence_items ?? question.options;
              return items?.[Number(i)] ?? i;
            })
            .join(' → ')
        : String(question.correct_answer);

  const correctPlayers = session.players.filter((p) => lastRound.correctPlayers.includes(p.id));
  const incorrectPlayers = session.players.filter((p) => lastRound.incorrectPlayers.includes(p.id));
  const isGameOver = session.currentRound >= totalRounds - 1;

  const handleNext = () => {
    const result = proceedToNextRound();
    const prefix = isQuickPlay ? '/quick-play' : '/host';

    if (result === 'done') {
      if (isMultiplayer) broadcastHostState('/player/results');
      navigate(`${prefix}/results`, { replace: true });
    } else {
      if (isMultiplayer) broadcastHostState('/player/round-intro');
      navigate(`${prefix}/round-intro`, { replace: true });
    }
  };

  const handleEndGame = () => {
    const prefix = isQuickPlay ? '/quick-play' : '/host';
    if (isMultiplayer) broadcastHostState('/player/results');
    navigate(`${prefix}/results`, { replace: true });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary items-center justify-center relative overflow-hidden px-4 py-8">
      <motion.div
        className="relative z-10 w-full max-w-2xl text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={handleEndGame}
            className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1"
          >
            End Game
          </button>
        </div>

        <p className="text-text-secondary text-sm mb-3 line-clamp-2">{question.question}</p>

        <motion.div
          className="mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
        >
          <span className="text-xs text-text-muted uppercase tracking-wider block mb-2">The answer is</span>
          <h2 className="font-display text-5xl md:text-6xl text-neon-green">{correctAnswer}</h2>
          <p className="text-text-secondary mt-3 text-sm max-w-md mx-auto">{question.explanation}</p>
        </motion.div>

        <AnimatePresence>
          {phase !== 'answer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 mb-8"
            >
              {correctPlayers.length > 0 && (
                <div className="bg-neon-green/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <span className="text-green-600 text-lg">✓</span>
                    <span className="text-green-600 font-display text-lg tracking-wide">CORRECT</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {correctPlayers.map((p) => (
                      <motion.span
                        key={p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/20 text-neon-green text-sm font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                      >
                        {p.avatar} {p.name}
                        <span className="text-xs text-neon-gold ml-1">+{formatRands(getCurrentPoints())}</span>
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {incorrectPlayers.length > 0 && (
                <motion.div
                  className="bg-neon-pink/10 rounded-2xl p-4"
                  initial={{ x: 0 }}
                  animate={{ x: [0, -4, 4, -4, 4, 0] }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <span className="text-red-500 text-lg">✗</span>
                    <span className="text-red-500 font-display text-lg tracking-wide">INCORRECT</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {incorrectPlayers.map((p) => (
                      <motion.span
                        key={p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-pink/20 text-neon-pink text-sm font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                      >
                        {p.avatar} {p.name}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-6">
          <PlayerStatusBar players={session.players} />
        </div>

        <AnimatePresence>
          {phase === 'ready' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <motion.button
                onClick={handleNext}
                className={`py-4 px-10 rounded-full font-display text-2xl tracking-wider ${
                  isGameOver
                    ? 'bg-neon-gold text-text-primary shadow-gold'
                    : 'bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary'
                } hover:brightness-110`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isGameOver ? 'SEE FINAL RESULTS' : 'NEXT QUESTION'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/RoundIntroPage.tsx src/routes/Play.tsx src/routes/Reveal.tsx
git commit -m "feat: implement round intro, play, and reveal routes"
```

---

### Task 8: Build Results Route and Join/Player Routes

**Files:**
- Modify: `src/routes/ResultsPage.tsx`
- Modify: `src/routes/Join.tsx`
- Modify: `src/routes/PlayerLobby.tsx`
- Modify: `src/routes/PlayerRoundIntro.tsx`
- Modify: `src/routes/PlayerPlay.tsx`
- Modify: `src/routes/PlayerReveal.tsx`
- Modify: `src/routes/PlayerResults.tsx`

- [ ] **Step 1: Implement `src/routes/ResultsPage.tsx`**

Adapts `Results.tsx`. Key changes: "Play Again" re-navigates to round-intro (quick play) or lobby (host). "New Game" navigates to `/`. The executing agent should read `src/components/Results/Results.tsx` (lines 1-281) and adapt it with router navigation instead of `setScreen`.

```tsx
import { useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { endHostGame } from '../hooks/useMultiplayer';
import { useProfileStore } from '../stores/profileStore';
import { useHistoryStore } from '../stores/historyStore';
import { formatRands } from '../utils/helpers';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, resetGame } = useGameStore();
  const role = useMultiplayerStore((s) => s.role);
  const mpReset = useMultiplayerStore((s) => s.reset);
  const { profile, updateStats } = useProfileStore();
  const { addRecord } = useHistoryStore();
  const statsUpdated = useRef(false);
  const isQuickPlay = location.pathname.startsWith('/quick-play');

  useEffect(() => {
    if (!session || statsUpdated.current) return;
    statsUpdated.current = true;

    if (profile) {
      const me = session.players.find(
        (p) => p.name.toLowerCase() === profile.name.toLowerCase()
      );
      if (me) {
        const ranked = [...session.players].sort((a, b) => b.score - a.score);
        const won = ranked[0]?.id === me.id;
        const correctCount = session.roundHistory.filter((r) =>
          r.correctPlayers.includes(me.id)
        ).length;
        updateStats(me.score, won, correctCount, session.roundHistory.length);
      }
    }

    const rankedForRecord = [...session.players].sort((a, b) => b.score - a.score);
    addRecord({
      mode: 'classic',
      packIds: session.settings.packIds,
      packNames: [session.pack.name],
      playerCount: session.players.length,
      rounds: session.roundHistory.length,
      players: session.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        finalScore: p.score,
        questionsCorrect: session.roundHistory.filter((r) =>
          r.correctPlayers.includes(p.id)
        ).length,
        questionsAnswered: session.roundHistory.length,
      })),
      winnerId: rankedForRecord[0]?.id ?? '',
    });
  }, [session, profile, updateStats, addRecord]);

  if (!session) {
    navigate('/');
    return null;
  }

  const rankedPlayers = useMemo(
    () => [...session.players].sort((a, b) => b.score - a.score),
    [session.players]
  );

  const winner = rankedPlayers[0];
  const totalRounds = session.roundHistory.length;
  const winnerCorrect = winner
    ? session.roundHistory.filter((r) => r.correctPlayers.includes(winner.id)).length
    : 0;

  const handleNewGame = () => {
    if (role === 'host') {
      endHostGame();
      mpReset();
    }
    resetGame();
    navigate('/');
  };

  const handlePlayAgain = () => {
    if (role === 'host') {
      endHostGame();
      mpReset();
      resetGame();
      navigate('/');
    } else {
      // Quick play: re-init with same packs
      const packIds = session.settings.packIds;
      useGameStore.getState().initQuickPlay(packIds);
      useGameStore.getState().addPlayer(profile?.name ?? 'Player', profile?.avatar);
      useGameStore.getState().startGame();
      navigate('/quick-play/round-intro');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center bg-bg-primary px-4 py-8">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Trophy */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="font-display text-5xl text-text-primary tracking-tight mb-2">Great Job!</h1>
        </motion.div>

        {/* Winner card */}
        {winner && winner.score > 0 && (
          <motion.div
            className="text-center mb-6 bg-gradient-to-r from-neon-cyan to-primary-container rounded-3xl p-8 text-white shadow-primary"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.4 }}
          >
            <span className="text-5xl mb-3 block">{winner.avatar}</span>
            <h2 className="font-display text-4xl tracking-wide mb-1 text-white">{winner.name}</h2>
            <p className="text-white/80 text-sm font-medium tracking-wider uppercase mb-3">FINAL SCORE</p>
            <span className="font-score text-6xl text-white font-bold">{formatRands(winner.score)}</span>
            <p className="text-white/70 mt-3 text-sm">
              {totalRounds} round{totalRounds !== 1 ? 's' : ''} played
            </p>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-bg-card rounded-2xl p-4 shadow-soft text-center">
            <span className="text-2xl block mb-1">🎯</span>
            <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Accuracy</span>
            <p className="font-score text-2xl font-bold text-text-primary mt-1">{winnerCorrect}/{totalRounds}</p>
          </div>
          <div className="bg-bg-card rounded-2xl p-4 shadow-soft text-center">
            <span className="text-2xl block mb-1">💰</span>
            <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Earned</span>
            <p className="font-score text-2xl font-bold text-neon-gold mt-1">{formatRands(winner?.score ?? 0)}</p>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div className="mb-3" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
          <motion.button
            onClick={handlePlayAgain}
            className="w-full py-4 rounded-full font-display text-xl tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary hover:brightness-110"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            PLAY AGAIN
          </motion.button>
        </motion.div>

        <motion.div className="mb-8" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
          <motion.button
            onClick={handleNewGame}
            className="w-full bg-bg-card shadow-soft rounded-full py-3 text-text-secondary font-display tracking-wide"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            NEW GAME
          </motion.button>
        </motion.div>

        {/* Team standings */}
        {session.settings.teamMode && session.teams.length > 0 && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl overflow-hidden mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.75 }}
          >
            <div className="px-5 py-3">
              <h3 className="font-display text-lg text-text-muted tracking-wider uppercase">TEAM STANDINGS</h3>
            </div>
            {[...session.teams].sort((a, b) => b.score - a.score).map((team, idx) => (
              <div key={team.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`font-score text-lg w-8 text-center font-bold ${idx === 0 ? 'text-neon-gold' : 'text-text-muted'}`}>{idx + 1}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.colour }} />
                <span className="flex-1 font-medium" style={{ color: team.colour }}>{team.name}</span>
                <span className="font-score text-sm text-neon-gold font-bold">{formatRands(team.score)}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Rankings */}
        <motion.div className="mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
          <h3 className="font-display text-lg text-text-muted tracking-wider uppercase mb-3 text-center">RANKING</h3>
          <div className="bg-bg-card rounded-2xl shadow-soft overflow-hidden">
            {rankedPlayers.map((player, idx) => (
              <motion.div
                key={player.id}
                className="flex items-center gap-3 px-5 py-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + idx * 0.08 }}
              >
                <span className={`font-score text-lg w-8 text-center font-bold ${idx === 0 ? 'text-neon-gold' : 'text-text-muted'}`}>
                  {idx === 0 ? '🥇' : idx + 1}
                </span>
                <span className="text-xl">{player.avatar}</span>
                <span className="flex-1 font-medium text-text-primary">{player.name}</span>
                <span className="font-score text-sm text-neon-gold font-bold">{formatRands(player.score)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/routes/Join.tsx`**

Adapts `JoinGame.tsx`. Reads `?code=` query param. Navigates to `/player/lobby` on success:

```tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useProfileStore } from '../stores/profileStore';
import EmojiPicker, { ALL_EMOJIS } from '../components/Game/EmojiPicker';

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profile = useProfileStore((s) => s.profile);
  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() ?? '');
  const [name, setName] = useState(profile?.name ?? '');
  const [selectedEmoji, setSelectedEmoji] = useState(profile?.avatar ?? ALL_EMOJIS[0]);
  const [joining, setJoining] = useState(false);
  const { joinRoom } = usePlayerMultiplayer();
  const { error } = useMultiplayerStore();

  const handleJoin = async () => {
    if (!code.trim() || !name.trim() || joining) return;
    setJoining(true);
    try {
      await joinRoom(code.trim(), name.trim(), selectedEmoji);
      navigate('/player/lobby');
    } catch {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-bg-primary">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-neon-cyan tracking-tight mb-1">JOIN GAME</h1>
          <p className="text-text-secondary text-sm">Enter the room code from the host's screen</p>
        </div>

        <div className="mb-4">
          <label className="text-xs text-text-secondary font-medium block mb-2">Room Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="ABC12"
            maxLength={5}
            autoFocus
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            className="w-full py-3.5 px-4 rounded-xl bg-bg-card text-center text-text-primary text-3xl font-score tracking-[0.4em] uppercase outline-none focus:ring-2 focus:ring-neon-cyan/20 transition-colors placeholder:text-text-muted placeholder:tracking-[0.4em] placeholder:text-xl"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs text-text-secondary font-medium block mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full py-3 px-4 rounded-xl bg-bg-card text-text-primary text-lg font-medium outline-none focus:ring-2 focus:ring-neon-cyan/20 transition-colors placeholder:text-text-muted"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs text-text-secondary font-medium block mb-2">Your Avatar</label>
          <EmojiPicker selected={selectedEmoji} onSelect={setSelectedEmoji} />
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <motion.button
          onClick={handleJoin}
          disabled={!code.trim() || !name.trim() || joining}
          className="w-full py-3.5 rounded-full font-display text-xl tracking-wider bg-gradient-to-r from-neon-cyan to-primary-container text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {joining ? 'JOINING...' : 'JOIN'}
        </motion.button>

        <motion.button
          onClick={() => navigate('/')}
          className="w-full mt-3 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </motion.button>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Implement player routes**

Create `src/routes/PlayerLobby.tsx`, `PlayerRoundIntro.tsx`, `PlayerPlay.tsx`, `PlayerReveal.tsx`, `PlayerResults.tsx`. These adapt the sub-views from `PlayerView.tsx` (lines 78-482) into individual route components. Each watches `multiplayerStore.gameState.route` and navigates when it changes.

The executing agent should read `src/components/Player/PlayerView.tsx` in full and extract each sub-view into its own route file. The key pattern for each player route:

```tsx
// Pattern for all player routes:
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayerStore } from '../stores/multiplayerStore';

// Inside Component():
const navigate = useNavigate();
const { gameState } = useMultiplayerStore();

// Watch for host-driven route changes
useEffect(() => {
  if (gameState?.route && !gameState.route.includes('/lobby')) {
    // Navigate to whatever route the host broadcasts
    navigate(gameState.route, { replace: true });
  }
}, [gameState?.route, navigate]);
```

Each player route renders the same UI as the sub-view it replaces from `PlayerView.tsx`, but as a standalone route component.

**PlayerLobby.tsx**: Extract `PlayerLobbyView` (lines 151-185). Add team picker if `gameState.teamMode`.

**PlayerRoundIntro.tsx**: New — shows round info from `gameState.round`, auto-navigates when host broadcasts `/player/play`.

**PlayerPlay.tsx**: Extract `PlayerQuestionView` (lines 187-383). Watch for route change to `/player/reveal`.

**PlayerReveal.tsx**: Extract `PlayerRevealView` (lines 386-437). Watch for route change.

**PlayerResults.tsx**: Extract `PlayerResultsView` (lines 440-482). Add "Leave" button that navigates to `/`.

All player routes should include the player header bar (avatar, name, score, leave button) from `PlayerView.tsx` lines 27-43.

- [ ] **Step 4: Commit**

```bash
git add src/routes/
git commit -m "feat: implement results, join, and all player routes"
```

---

### Task 9: Clean Up Old Components, Remove Dead Code, Fix Imports

**Files:**
- Delete: `src/components/Game/PackVote.tsx`
- Delete: `src/components/Landing/Landing.tsx` (replaced by route)
- Delete: `src/components/Lobby/Lobby.tsx` (replaced by route)
- Delete: `src/components/Player/PlayerView.tsx` (split into routes)
- Delete: `src/components/Player/JoinGame.tsx` (replaced by route)
- Delete: `src/components/Player/JoinModal.tsx` (no longer needed — join via URL uses `/join?code=`)
- Delete: `src/components/Game/RevealScreen.tsx` (replaced by route)
- Delete: `src/components/Results/Results.tsx` (replaced by route)
- Modify: `src/components/Game/GameScreen.tsx` — can be deleted (replaced by Play route)

- [ ] **Step 1: Delete old component files**

```bash
rm src/components/Game/PackVote.tsx
rm src/components/Landing/Landing.tsx
rm src/components/Lobby/Lobby.tsx
rm src/components/Player/PlayerView.tsx
rm src/components/Player/JoinGame.tsx
rm src/components/Player/JoinModal.tsx
rm src/components/Game/RevealScreen.tsx
rm src/components/Game/GameScreen.tsx
rm src/components/Results/Results.tsx
```

- [ ] **Step 2: Fix any remaining imports**

Search the codebase for imports of deleted files and update them:

```bash
grep -r "from.*Landing/Landing" src/
grep -r "from.*Lobby/Lobby" src/
grep -r "from.*PackVote" src/
grep -r "from.*PlayerView" src/
grep -r "from.*JoinGame" src/
grep -r "from.*JoinModal" src/
grep -r "from.*RevealScreen" src/
grep -r "from.*GameScreen" src/
grep -r "from.*Results/Results" src/
```

Fix any hits. The main culprit will be the old `App.tsx` which was already replaced in Task 1.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Clean build with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old screen-based components replaced by routes"
```

---

### Task 10: Integration Testing and Bug Fixes

**Files:** Various — depends on what breaks

- [ ] **Step 1: Test Quick Play flow end-to-end**

```bash
npm run dev
```

Manual test:
1. Landing → Quick Play → Categories → select pack → Start
2. Round Intro appears (~3s) → Play screen with question
3. Answer → auto-reveal → Reveal screen → Next Question
4. Repeat through all 11 rounds → Results → New Game → Landing

- [ ] **Step 2: Test Host flow end-to-end**

1. Landing → Host → Individual Versus → Categories → select pack → Next
2. Lobby appears with room code + QR + host as player
3. Open second browser tab, navigate to `/#/join?code=XXXXX`
4. Join as player → player sees lobby
5. Host starts → Round Intro → Play (host answers + sees status) → Reveal → repeat → Results

- [ ] **Step 3: Test Team Versus flow**

1. Landing → Host → Team Versus (2 teams) → Categories → Next
2. Lobby → players join and pick teams
3. Play through → verify team scores on reveal and results

- [ ] **Step 4: Test Join via URL**

1. Copy invite link from lobby
2. Open in new tab → should land on `/join?code=XXXXX` with code pre-filled
3. Enter name → Join → player lobby → game flows

- [ ] **Step 5: Fix any bugs found**

Address issues discovered during testing. Common issues:
- Navigation timing with broadcasts
- State not being reset properly between games
- Player route not updating when host broadcasts

- [ ] **Step 6: Final build check**

```bash
npm run build
```

- [ ] **Step 7: Commit all fixes**

```bash
git add -A
git commit -m "fix: integration fixes for route-based user journey"
```
