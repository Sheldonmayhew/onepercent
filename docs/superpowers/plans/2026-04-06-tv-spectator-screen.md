# TV Spectator Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/tv` spectator route that connects to an active game room and displays a cinematic, non-interactive view of the leaderboard, timer, question, and player status — designed for casting to a TV screen.

**Architecture:** The TV screen subscribes to the same Supabase broadcast channel as players (`room:{CODE}`), listening for `game_state` and `game_ended` events. It renders a different view for each game phase (lobby, round-intro, play, reveal, results) based on `broadcast.route`. No new backend or broadcast changes needed — the existing `GameBroadcast` payload has everything required.

**Tech Stack:** React, React Router, Zustand (multiplayerStore), Supabase Realtime, Framer Motion, Tailwind CSS

---

### Task 1: TV Spectator Hook — `useSpectator`

**Files:**
- Create: `src/hooks/useSpectator.ts`

This hook connects to the broadcast channel as a read-only spectator. It reuses `multiplayerStore.setGameState` to store incoming state, and sets the role to `'spectator'` (we'll add this to `AppRole`).

- [ ] **Step 1: Add `'spectator'` to the `AppRole` type**

In `src/stores/multiplayerStore.ts`, update the type:

```typescript
export type AppRole = 'host' | 'player' | 'spectator' | null;
```

- [ ] **Step 2: Create `src/hooks/useSpectator.ts`**

```typescript
import { useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import type { GameBroadcast } from '../stores/multiplayerStore';

let spectatorChannel: RealtimeChannel | null = null;

export function useSpectator() {
  const { setRole, setRoomCode, setConnected, setError, setGameState } =
    useMultiplayerStore();

  const connect = useCallback(
    async (code: string) => {
      const upperCode = code.toUpperCase().trim();

      // Clean up any existing connection
      if (spectatorChannel) {
        supabase.removeChannel(spectatorChannel);
        spectatorChannel = null;
      }

      const channel = supabase.channel(`room:${upperCode}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'game_state' }, (msg) => {
          const state = msg.payload as GameBroadcast;
          setGameState(state);
        })
        .on('broadcast', { event: 'game_ended' }, () => {
          useMultiplayerStore.getState().reset();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
          }
        });

      spectatorChannel = channel;
      setRole('spectator');
      setRoomCode(upperCode);
    },
    [setRole, setRoomCode, setConnected, setError, setGameState]
  );

  const disconnect = useCallback(() => {
    if (spectatorChannel) {
      supabase.removeChannel(spectatorChannel);
      spectatorChannel = null;
    }
    useMultiplayerStore.getState().reset();
  }, []);

  return { connect, disconnect };
}
```

- [ ] **Step 3: Verify the app builds**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSpectator.ts src/stores/multiplayerStore.ts
git commit -m "feat: add useSpectator hook for TV spectator channel connection"
```

---

### Task 2: TV Join Screen — `/tv` route

**Files:**
- Create: `src/routes/TvJoin.tsx`
- Modify: `src/router.tsx`

This is the entry point. The spectator enters a room code (or arrives via `?code=XXXXX` URL param), connects, and then gets routed to the spectator display. Designed to be simple — big text, easy to read from across a room.

- [ ] **Step 1: Create `src/routes/TvJoin.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSpectator } from '../hooks/useSpectator';
import { useMultiplayerStore } from '../stores/multiplayerStore';

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { connect } = useSpectator();
  const isConnected = useMultiplayerStore((s) => s.isConnected);
  const gameState = useMultiplayerStore((s) => s.gameState);
  const error = useMultiplayerStore((s) => s.error);

  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [connecting, setConnecting] = useState(false);

  // Auto-connect if code is in URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !isConnected) {
      setConnecting(true);
      connect(urlCode);
    }
  }, []);

  // Navigate to display once we receive first game state
  useEffect(() => {
    if (isConnected && gameState) {
      navigate('/tv/display', { replace: true });
    }
  }, [isConnected, gameState, navigate]);

  const handleConnect = () => {
    if (!code.trim()) return;
    setConnecting(true);
    connect(code.trim());
  };

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="font-display text-6xl text-text-primary text-center tracking-tight mb-2">
        TV MODE
      </h1>
      <p className="text-text-muted text-lg mb-10">
        Enter the room code to spectate
      </p>

      {error && (
        <p className="text-neon-pink text-sm mb-4">{error}</p>
      )}

      <div className="flex flex-col items-center gap-5 w-full max-w-sm">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ROOM CODE"
          maxLength={5}
          className="w-full text-center font-display text-5xl tracking-[0.4em] bg-bg-card shadow-soft rounded-2xl px-6 py-5 text-neon-cyan placeholder:text-text-muted/30 outline-none focus:ring-2 focus:ring-neon-cyan/40"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
        />

        <motion.button
          onClick={handleConnect}
          disabled={!code.trim() || connecting}
          className={`w-full py-4 rounded-full font-display text-xl tracking-wide transition-all ${
            code.trim() && !connecting
              ? 'bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary'
              : 'bg-bg-elevated text-text-muted cursor-not-allowed'
          }`}
          whileHover={code.trim() ? { scale: 1.02 } : {}}
          whileTap={code.trim() ? { scale: 0.98 } : {}}
        >
          {connecting ? 'CONNECTING...' : 'CONNECT'}
        </motion.button>
      </div>

      {connecting && !gameState && (
        <motion.div
          className="mt-8 flex items-center gap-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm">Waiting for host to broadcast...</p>
        </motion.div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Add TV routes to `src/router.tsx`**

Add these two routes inside the children array, after the player routes:

```typescript
// TV spectator routes
{
  path: 'tv',
  lazy: () => import('./routes/TvJoin'),
},
{
  path: 'tv/display',
  lazy: () => import('./routes/TvDisplay'),
},
```

- [ ] **Step 3: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds (TvDisplay doesn't exist yet — the lazy import won't fail at build time since it's dynamic)

- [ ] **Step 4: Commit**

```bash
git add src/routes/TvJoin.tsx src/router.tsx
git commit -m "feat: add TV join screen with room code entry"
```

---

### Task 3: TV Display — Main Spectator View

**Files:**
- Create: `src/routes/TvDisplay.tsx`

This is the main TV route. It reads `gameState` from `multiplayerStore` and renders the correct phase based on `gameState.route`. It's a single component that switches between inline sub-views. Full-screen, landscape-optimized, no scrolling.

- [ ] **Step 1: Create `src/routes/TvDisplay.tsx`**

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useSpectator } from '../hooks/useSpectator';
import TvLobby from '../components/Tv/TvLobby';
import TvRoundIntro from '../components/Tv/TvRoundIntro';
import TvPlay from '../components/Tv/TvPlay';
import TvReveal from '../components/Tv/TvReveal';
import TvResults from '../components/Tv/TvResults';

function getPhase(route: string): string {
  if (route.includes('/lobby')) return 'lobby';
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const role = useMultiplayerStore((s) => s.role);
  const roomCode = useMultiplayerStore((s) => s.roomCode);
  const { disconnect } = useSpectator();

  // Redirect if not connected as spectator
  useEffect(() => {
    if (role !== 'spectator') {
      navigate('/tv', { replace: true });
    }
  }, [role, navigate]);

  // Handle game_ended (role gets reset to null by the hook)
  useEffect(() => {
    if (role === null && !gameState) {
      navigate('/tv', { replace: true });
    }
  }, [role, gameState, navigate]);

  if (!gameState) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg-primary">
        <motion.div
          className="flex flex-col items-center gap-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
          <p className="text-text-secondary font-display text-2xl tracking-wide">
            WAITING FOR HOST...
          </p>
          {roomCode && (
            <p className="text-text-muted font-display text-lg tracking-[0.3em]">{roomCode}</p>
          )}
        </motion.div>
      </div>
    );
  }

  const phase = getPhase(gameState.route);

  return (
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
        {phase === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvLobby gameState={gameState} roomCode={roomCode} />
          </motion.div>
        )}
        {phase === 'round-intro' && (
          <motion.div key="round-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvRoundIntro gameState={gameState} />
          </motion.div>
        )}
        {phase === 'play' && (
          <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvPlay gameState={gameState} />
          </motion.div>
        )}
        {phase === 'reveal' && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvReveal gameState={gameState} />
          </motion.div>
        )}
        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvResults gameState={gameState} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify the app builds**

Run: `npm run build`
Expected: Build will fail because the Tv components don't exist yet — that's expected. We'll create them in the following tasks.

- [ ] **Step 3: Commit**

```bash
git add src/routes/TvDisplay.tsx
git commit -m "feat: add TvDisplay route with phase-based view switching"
```

---

### Task 4: TV Lobby Component

**Files:**
- Create: `src/components/Tv/TvLobby.tsx`

Big-screen lobby: giant room code, QR code, player list animating in as people join. Landscape-friendly layout with the join info on the left and player list on the right.

- [ ] **Step 1: Create `src/components/Tv/TvLobby.tsx`**

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import type { GameBroadcast } from '../../stores/multiplayerStore';

interface TvLobbyProps {
  gameState: GameBroadcast;
  roomCode: string | null;
}

function getJoinUrl(code: string): string {
  return `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
}

export default function TvLobby({ gameState, roomCode }: TvLobbyProps) {
  const { players, packName, teamMode, teams } = gameState;

  return (
    <div className="min-h-dvh flex items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Join info */}
        <div className="flex flex-col items-center gap-6">
          <h1 className="font-display text-5xl lg:text-7xl text-text-primary tracking-tight">
            JOIN THE GAME
          </h1>

          {roomCode && (
            <>
              <div className="bg-bg-card shadow-soft rounded-3xl p-8 flex flex-col items-center gap-4">
                <span className="text-xs text-text-muted tracking-[0.2em] uppercase">
                  Room Code
                </span>
                <span className="font-display text-7xl lg:text-8xl text-neon-cyan font-bold tracking-[0.35em]">
                  {roomCode}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <QRCodeSVG
                  value={getJoinUrl(roomCode)}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0a0a0f"
                  level="M"
                />
              </div>
            </>
          )}

          {packName && (
            <span className="inline-block px-4 py-2 rounded-full bg-bg-elevated text-sm font-bold text-text-secondary uppercase tracking-wider">
              {packName}
            </span>
          )}
        </div>

        {/* Right: Players */}
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3 mb-2">
            <h2 className="font-display text-3xl text-text-primary tracking-wide">
              PLAYERS
            </h2>
            <span className="font-score text-2xl text-neon-cyan">{players.length}</span>
          </div>

          {/* Player count dots */}
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < players.length ? 'bg-neon-cyan' : 'bg-bg-elevated'
                }`}
                animate={i < players.length ? { scale: [1, 1.3, 1] } : { scale: 0.75 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Player list */}
          <div className="space-y-3 min-h-[200px]">
            <AnimatePresence mode="popLayout">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center gap-4 bg-bg-card shadow-soft rounded-2xl px-5 py-4"
                >
                  <span className="text-3xl">{player.avatar}</span>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.colour }}
                  />
                  <span className="text-xl font-medium text-text-primary flex-1">
                    {player.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {players.length === 0 && (
              <motion.div
                className="flex items-center justify-center h-48"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                <p className="text-text-muted text-xl">Waiting for players...</p>
              </motion.div>
            )}
          </div>

          {/* Team display */}
          {teamMode && teams && teams.length > 0 && (
            <div className="mt-4">
              <h3 className="font-display text-sm text-text-muted tracking-[0.15em] uppercase mb-3">
                Teams
              </h3>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
                {teams.map((team) => {
                  const teamPlayers = players.filter((p) =>
                    team.playerIds.includes(p.id)
                  );
                  return (
                    <div
                      key={team.id}
                      className="bg-bg-card shadow-soft rounded-xl p-4"
                    >
                      <h4
                        className="font-display text-sm tracking-wide mb-2"
                        style={{ color: team.colour }}
                      >
                        {team.name}
                      </h4>
                      <div className="space-y-1.5">
                        {teamPlayers.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-sm text-text-primary">
                            <span>{p.avatar}</span>
                            <span>{p.name}</span>
                          </div>
                        ))}
                        {teamPlayers.length === 0 && (
                          <p className="text-text-muted text-xs italic">Empty</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Tv/TvLobby.tsx
git commit -m "feat: add TvLobby component with room code, QR, and player list"
```

---

### Task 5: TV Round Intro Component

**Files:**
- Create: `src/components/Tv/TvRoundIntro.tsx`

A cinematic full-screen overlay showing the round number, difficulty percentage (colour-coded), and point value. Auto-progresses like the existing `RoundIntro` but scaled for TV.

- [ ] **Step 1: Create `src/components/Tv/TvRoundIntro.tsx`**

```tsx
import { motion } from 'framer-motion';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { formatRands, getDifficultyColour } from '../../utils/helpers';

interface TvRoundIntroProps {
  gameState: GameBroadcast;
}

export default function TvRoundIntro({ gameState }: TvRoundIntroProps) {
  const round = gameState.round;
  const roundIndex = round?.index ?? 0;
  const totalRounds = round?.totalRounds ?? 11;
  const difficulty = round?.difficulty ?? 90;
  const points = round?.points ?? 0;
  const diffColour = getDifficultyColour(difficulty);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      >
        <motion.span
          className="text-text-muted text-xl uppercase tracking-[0.2em] block mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Round {roundIndex + 1} of {totalRounds}
        </motion.span>

        <motion.h1
          className="font-display text-[10rem] lg:text-[12rem] font-bold leading-none mb-4"
          style={{ color: diffColour }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
        >
          {difficulty}%
        </motion.h1>

        <motion.span
          className="font-score text-4xl text-neon-gold block mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {formatRands(points)}
        </motion.span>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-bg-elevated rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: diffColour }}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Tv/TvRoundIntro.tsx
git commit -m "feat: add TvRoundIntro with cinematic difficulty reveal"
```

---

### Task 6: TV Play Component

**Files:**
- Create: `src/components/Tv/TvPlay.tsx`

The heart of the TV experience. Shows the question prominently, a large countdown timer, the multiple-choice options (without highlighting any answer), and live "answered" indicators for each player. Uses `useTimer` to run a local countdown synced to `timerStarted`.

- [ ] **Step 1: Create `src/components/Tv/TvPlay.tsx`**

```tsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { useTimer } from '../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../utils/helpers';

interface TvPlayProps {
  gameState: GameBroadcast;
}

export default function TvPlay({ gameState }: TvPlayProps) {
  const round = gameState.round;
  const players = gameState.players;
  const timerStarted = gameState.timerStarted ?? false;

  const timerDuration = round?.timerDuration ?? 30;
  const { timeLeft, progress, start } = useTimer({
    duration: timerDuration,
    autoStart: false,
  });

  useEffect(() => {
    if (timerStarted) {
      start();
    }
  }, [timerStarted, start]);

  if (!round) return null;

  const answeredCount = players.filter((p) => p.hasAnswered).length;
  const diffColour = getDifficultyColour(round.difficulty);
  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="min-h-dvh flex flex-col p-6 lg:p-10">
      {/* Top bar: round info + timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="font-display text-lg text-text-secondary uppercase tracking-wider">
            Round {round.index + 1} of {round.totalRounds}
          </span>
          <span
            className="font-display text-lg font-bold"
            style={{ color: diffColour }}
          >
            {round.difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">
            {formatRands(round.points)}
          </span>
        </div>

        {/* Timer */}
        {timerStarted && (
          <motion.div
            className={`font-score text-6xl font-bold tabular-nums ${
              isCritical
                ? 'text-neon-pink animate-timer-pulse'
                : isUrgent
                  ? 'text-neon-gold'
                  : 'text-neon-cyan'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {timeLeft}
          </motion.div>
        )}
      </div>

      {/* Timer bar */}
      {timerStarted && (
        <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden mb-8">
          <motion.div
            className={`h-full rounded-full transition-colors duration-300 ${
              isCritical ? 'bg-neon-pink' : isUrgent ? 'bg-neon-gold' : 'bg-neon-cyan'
            }`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      )}

      {/* Main content: question + options on left, players on right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Question area — takes 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Category */}
          {round.categoryName && (
            <span className="inline-block self-start px-4 py-1.5 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider">
              {round.categoryName}
            </span>
          )}

          {/* Question text */}
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-snug">
            {round.question.question}
          </h2>

          {/* Image */}
          {round.question.image_url && (
            <img
              src={round.question.image_url}
              alt="Question visual"
              className="rounded-2xl max-h-72 object-contain"
            />
          )}

          {/* Options (for multiple choice / image based) */}
          {round.question.options && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {round.question.options.map((option, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-bg-card shadow-soft rounded-xl px-5 py-4"
                >
                  <span className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center font-display text-sm text-text-secondary font-bold">
                    {optionLetters[i]}
                  </span>
                  <span className="text-lg text-text-primary font-medium">{option}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sequence items (for sequence type) */}
          {round.question.type === 'sequence' && round.question.sequence_items && (
            <div className="flex flex-wrap gap-3 mt-2">
              {round.question.sequence_items.map((item, i) => (
                <div
                  key={i}
                  className="bg-bg-card shadow-soft rounded-xl px-5 py-3 text-lg text-text-primary font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Players sidebar — 1/3 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-display text-sm text-text-muted tracking-[0.15em] uppercase">
              Players
            </h3>
            <span className="font-score text-sm text-neon-cyan">
              {answeredCount}/{players.length}
            </span>
          </div>

          {players.map((player) => (
            <motion.div
              key={player.id}
              layout
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                player.hasAnswered
                  ? 'bg-neon-green/10 border border-neon-green/20'
                  : 'bg-bg-card shadow-soft'
              }`}
            >
              <span className="text-2xl">{player.avatar}</span>
              <span className="flex-1 text-text-primary font-medium">{player.name}</span>
              {player.hasAnswered && (
                <motion.span
                  className="text-neon-green text-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  ✓
                </motion.span>
              )}
              <span className="text-xs text-text-muted font-score">
                R{player.score.toLocaleString('en-ZA')}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Waiting for timer start */}
      {!timerStarted && (
        <motion.div
          className="flex items-center justify-center gap-3 mt-6"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-3 h-3 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-lg">Waiting for host to start the round...</p>
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Tv/TvPlay.tsx
git commit -m "feat: add TvPlay with question display, timer, and live player status"
```

---

### Task 7: TV Reveal Component

**Files:**
- Create: `src/components/Tv/TvReveal.tsx`

Shows the correct answer dramatically, then reveals who got it right/wrong with animated player pills. Auto-phases like the host Reveal page but scaled up.

- [ ] **Step 1: Create `src/components/Tv/TvReveal.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { formatRands } from '../../utils/helpers';
import { POINTS_PER_ROUND } from '../../types';

interface TvRevealProps {
  gameState: GameBroadcast;
}

type Phase = 'answer' | 'results';

export default function TvReveal({ gameState }: TvRevealProps) {
  const { players, reveal, round } = gameState;
  const [phase, setPhase] = useState<Phase>('answer');

  const difficulty = round?.difficulty ?? 90;
  const pointsAtStake = POINTS_PER_ROUND[difficulty] ?? 0;

  useEffect(() => {
    setPhase('answer');
    const timer = setTimeout(() => setPhase('results'), 2000);
    return () => clearTimeout(timer);
  }, [reveal?.correctAnswer]);

  if (!reveal) return null;

  const correctPlayers = players.filter((p) => reveal.correctPlayerIds.includes(p.id));
  const incorrectPlayers = players.filter((p) => reveal.incorrectPlayerIds.includes(p.id));

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Correct answer card */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-3xl p-8 lg:p-10 flex flex-col items-center gap-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <span className="text-sm text-text-muted tracking-[0.2em] uppercase">
            Correct Answer
          </span>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-neon-green text-center">
            {reveal.correctAnswer}
          </h2>
          {reveal.explanation && (
            <p className="text-lg text-text-secondary text-center leading-relaxed max-w-2xl">
              {reveal.explanation}
            </p>
          )}
          <span className="font-score text-xl text-neon-gold">
            Worth {formatRands(pointsAtStake)}
          </span>
        </motion.div>

        {/* Player results — animate in after delay */}
        <AnimatePresence>
          {phase === 'results' && (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Correct */}
              {correctPlayers.length > 0 && (
                <div className="bg-neon-green/5 border border-neon-green/20 rounded-2xl p-6">
                  <h3 className="text-sm text-neon-green tracking-[0.15em] uppercase mb-4">
                    Correct
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {correctPlayers.map((p, i) => (
                      <motion.div
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neon-green/10 border border-neon-green/20"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 }}
                      >
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="text-lg text-text-primary font-medium">{p.name}</span>
                        <span className="text-neon-green font-score">
                          +{formatRands(pointsAtStake)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incorrect */}
              {incorrectPlayers.length > 0 && (
                <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-2xl p-6">
                  <h3 className="text-sm text-neon-pink tracking-[0.15em] uppercase mb-4">
                    Incorrect
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {incorrectPlayers.map((p, i) => (
                      <motion.div
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neon-pink/10 border border-neon-pink/20"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 }}
                      >
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="text-lg text-text-primary font-medium">{p.name}</span>
                        <span className="text-text-muted">--</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live leaderboard */}
        <AnimatePresence>
          {phase === 'results' && (
            <motion.div
              className="bg-bg-card shadow-soft rounded-2xl p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
                Leaderboard
              </h3>
              <div className="flex flex-wrap gap-3">
                {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
                  <motion.div
                    key={p.id}
                    layout
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated"
                  >
                    <span className={`font-score text-sm w-5 text-center ${
                      idx === 0 ? 'text-neon-gold' : 'text-text-muted'
                    }`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <span className="text-xl">{p.avatar}</span>
                    <span className="text-text-primary font-medium">{p.name}</span>
                    <span className="font-score text-neon-gold text-sm">
                      {formatRands(p.score)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Tv/TvReveal.tsx
git commit -m "feat: add TvReveal with phased answer reveal and leaderboard"
```

---

### Task 8: TV Results Component

**Files:**
- Create: `src/components/Tv/TvResults.tsx`

Final screen. Big winner card, full ranked leaderboard with team standings if in team mode. Celebratory feel.

- [ ] **Step 1: Create `src/components/Tv/TvResults.tsx`**

```tsx
import { motion } from 'framer-motion';
import type { GameBroadcast } from '../../stores/multiplayerStore';
import { formatRands } from '../../utils/helpers';

interface TvResultsProps {
  gameState: GameBroadcast;
}

export default function TvResults({ gameState }: TvResultsProps) {
  const { players, teamMode, teams } = gameState;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-8 lg:p-12">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Title */}
        <motion.h1
          className="font-display text-7xl lg:text-8xl text-text-primary text-center tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          GAME OVER
        </motion.h1>

        {/* Winner card */}
        {winner && (
          <motion.div
            className="bg-gradient-to-br from-neon-gold/20 to-neon-pink/10 rounded-3xl shadow-soft p-8 lg:p-10 flex flex-col items-center gap-4 border border-neon-gold/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <span className="text-7xl">🏆</span>
            <span className="text-6xl">{winner.avatar}</span>
            <p className="font-display text-4xl text-text-primary tracking-wide">
              {winner.name}
            </p>
            <p className="font-score text-5xl text-neon-gold font-bold">
              {formatRands(winner.score)}
            </p>
            <p className="text-sm text-text-muted tracking-[0.2em] uppercase">Winner</p>
          </motion.div>
        )}

        {/* Team standings */}
        {teamMode && teams && teams.length > 0 && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
              Team Standings
            </h3>
            <div className="flex flex-col gap-3">
              {[...teams].sort((a, b) => b.score - a.score).map((team, idx) => (
                <div
                  key={team.id}
                  className="flex items-center gap-4 px-5 py-3 rounded-xl bg-bg-elevated"
                >
                  <span className="font-score text-lg w-6 text-center text-text-muted">
                    {idx + 1}
                  </span>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: team.colour }}
                  />
                  <span className="flex-1 text-xl font-medium text-text-primary">
                    {team.name}
                  </span>
                  <span className="font-score text-xl text-neon-gold">
                    {formatRands(team.score)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Individual rankings */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
            Final Rankings
          </h3>
          <div className="flex flex-col gap-3">
            {sorted.map((player, idx) => (
              <motion.div
                key={player.id}
                className="flex items-center gap-4 px-5 py-3 rounded-xl bg-bg-elevated"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + idx * 0.07 }}
              >
                <span
                  className={`font-score text-xl w-8 text-center ${
                    idx === 0 ? 'text-neon-gold' : idx === 1 ? 'text-text-secondary' : 'text-text-muted'
                  }`}
                >
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                </span>
                <span className="text-3xl">{player.avatar}</span>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.colour }}
                />
                <span className="flex-1 text-xl font-medium text-text-primary">
                  {player.name}
                </span>
                <span className="font-score text-xl text-neon-gold">
                  {formatRands(player.score)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Tv/TvResults.tsx
git commit -m "feat: add TvResults with winner card and final rankings"
```

---

### Task 9: Integration — Build & Verify

**Files:**
- Verify all TV components created in Tasks 4-8 import correctly in `TvDisplay.tsx`

- [ ] **Step 1: Verify the full app builds**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Test the flow manually**

1. Open the app, start a host game (select a pack, go to lobby)
2. In a new tab, navigate to `/#/tv?code=XXXXX` (use the room code from the lobby)
3. Verify the TV screen shows the lobby with the room code, QR, and player list
4. Start the game on the host — verify the TV transitions through round-intro, play, reveal, results
5. Verify the timer runs, player answer indicators appear, and the leaderboard updates

- [ ] **Step 3: Fix any build or runtime issues**

Address any TypeScript errors, missing imports, or layout issues found during manual testing.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve integration issues with TV spectator screen"
```

---

### Task 10: Landing Page — Add TV Mode Entry Point

**Files:**
- Modify: `src/routes/Landing.tsx`

Add a small "TV Mode" button to the landing page so users can easily navigate to the spectator screen.

- [ ] **Step 1: Read the current Landing page**

Read `src/routes/Landing.tsx` to understand the existing layout.

- [ ] **Step 2: Add a TV Mode link**

Add a subtle button or link (styled consistently with the existing page) that navigates to `/tv`. Position it where it doesn't compete with the primary CTAs (Quick Play / Host) — e.g., bottom of the page or in a secondary section. The exact placement depends on the current layout.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/routes/Landing.tsx
git commit -m "feat: add TV Mode entry point to landing page"
```
