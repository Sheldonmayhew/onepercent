# Teams — Implementation Spec

## Overview

Allow players to form teams and compete collectively. Teams share a combined score and win or lose together. The host assigns teams during the lobby phase, and the game tracks team-level scoring alongside individual contributions.

## Team Model

```typescript
export interface Team {
  id: string;
  name: string;
  colour: string; // team accent colour
  playerIds: string[];
  score: number;
}
```

Add `teamId: string | null` to the existing `Player` interface. When `null`, the game operates in individual mode (current behaviour).

## Settings Change

Add to `GameSettings`:

```typescript
teamMode: boolean; // default false
teamCount: 2 | 3 | 4; // number of teams
```

When `teamMode` is enabled on the Landing screen, show a team count selector (2–4). Team names default to "Team 1", "Team 2", etc. and can be renamed in the lobby.

## Lobby — Team Assignment

- Teams are displayed as columns/sections in the lobby
- Host can drag players between teams, or tap a player to cycle their team
- Unassigned players cannot start the game — the host must assign all players before "Start Game" is enabled
- Each team gets a distinct colour from a predefined team palette (separate from individual player colours)
- Minimum 1 player per team to start

## Scoring

- When a player answers correctly, points are added to both their individual `score` and their team's `score`
- The Results screen shows the winning **team** first, then individual top scorers within each team
- In `zero_score` mode, elimination applies to the individual player, not the whole team — remaining teammates continue

## Multiplayer Broadcast

Extend `BroadcastPlayer` with `teamId`. Add a `teams: Team[]` array to the `GameBroadcast` payload so player devices can display team context.

## Results Screen

- Primary display: team ranking (1st, 2nd, 3rd, 4th) with combined scores
- Secondary display: MVP (top individual scorer per team)
- Team colour accent used for each team's result card

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `Team` interface, `teamId` to `Player`, `teamMode`/`teamCount` to `GameSettings` |
| `src/stores/gameStore.ts` | Add team creation, assignment logic, team scoring in `revealAnswers` |
| `src/stores/multiplayerStore.ts` | Add `teams` to broadcast types |
| `src/components/Landing/Landing.tsx` | Add team mode toggle and team count selector |
| `src/components/Lobby/Lobby.tsx` | Add team columns, drag/tap assignment UI |
| `src/components/Results/Results.tsx` | Add team results view with team ranking and MVP |
| `src/components/Game/PlayerStatusBar.tsx` | Show team indicator next to player name |
| `src/hooks/useMultiplayer.ts` | Broadcast team data to players |
