# Game History — Implementation Spec

## Overview

Record and display a history of past games so players can look back at their performance, see past scores, and track improvement over time.

## History Model

```typescript
export interface GameRecord {
  id: string;              // UUID
  date: string;            // ISO timestamp
  mode: GameMode;
  packIds: string[];       // packs used (supports pack pooling)
  playerCount: number;
  rounds: number;
  players: GameRecordPlayer[];
  winnerId: string;        // player id of the winner
}

export interface GameRecordPlayer {
  id: string;
  name: string;
  avatar: string;
  finalScore: number;
  questionsCorrect: number;
  questionsAnswered: number;
}
```

## Storage

### Local (Phase 1)
- Store in `localStorage` under key `onepercent_history`
- Keep the last 50 games (FIFO — oldest dropped when limit reached)
- Each record is ~500 bytes, so 50 games ≈ 25KB — well within localStorage limits

### Supabase (Phase 2, optional)
- New `game_history` table for persistent, cross-device history
- Linked to player profiles if available

## Recording a Game

At the end of each game (when the Results screen mounts):

1. Build a `GameRecord` from the current `GameSession`
2. Append to the history array in localStorage
3. If linked to a profile, also update profile stats (see Profiles feature)

## History Screen

Accessible from the Landing page via a "History" button/icon.

### Game List View
- Scrollable list of past games, newest first
- Each row shows: date, game mode, pack name(s), player count, winner name + avatar
- Tap a row to expand or navigate to detail view

### Game Detail View
- Full scoreboard: all players ranked by score
- Per-round breakdown: which players got each question right/wrong
- Pack(s) used, game mode, total rounds

### Stats Summary (top of History screen)
- Total games played
- Win rate (if profile exists)
- Average score
- Best game (highest score)

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `GameRecord` and `GameRecordPlayer` interfaces |
| `src/stores/historyStore.ts` | New Zustand store — history CRUD, localStorage persistence, 50-game limit |
| `src/components/History/HistoryScreen.tsx` | New component — game list with stats summary |
| `src/components/History/GameDetail.tsx` | New component — expanded view of a single game |
| `src/components/Landing/Landing.tsx` | Add "History" button/link |
| `src/components/Results/Results.tsx` | Save `GameRecord` on mount |
| `src/App.tsx` | Add history screen routing |
