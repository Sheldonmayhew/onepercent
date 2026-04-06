# Pack Voting — Implementation Spec

## Overview

Before each question round, players vote on which question pack the next question should come from. The pack with the most votes is selected, and a question of the appropriate difficulty is drawn from that pack. This adds a social/strategic layer to the game.

## Settings Change

Add to `GameSettings`:

```typescript
packVotingEnabled: boolean; // default false
```

Pack voting requires multiplayer mode (meaningless in single-player). It also requires multiple packs selected (see Pack Pooling feature). If only 1 pack is selected, this toggle is disabled/hidden.

## Voting Flow

New screen state added to `GameScreen`: `'pack_vote'`

**Flow:** Reveal → Pack Vote → Playing → Reveal → Pack Vote → ...

1. After the reveal screen (or at game start for round 1), transition to the `pack_vote` screen
2. Host screen shows the available packs as large vote cards with a live vote tally
3. Player devices show the same pack options as tappable buttons — one vote per player
4. Voting has a 10-second timer (displayed on both host and player screens)
5. When the timer expires (or all players have voted), the winning pack is highlighted with an animation
6. A question of the current round's difficulty is drawn from the winning pack
7. If tied, one of the tied packs is chosen at random
8. Transition to the playing screen with the selected question

## Host Screen — Vote Display

- Pack cards arranged in a row/grid
- Each card shows: pack name, current vote count, voter avatars
- Live updates as votes arrive via broadcast
- Winning pack gets a glow animation before transitioning

## Player Screen — Vote UI

- Simple list of pack name buttons
- Tap to vote (single selection, can change before timer expires)
- Selected pack is highlighted
- Show countdown timer

## Multiplayer Broadcast

New broadcast events:

| Event | Direction | Payload |
|-------|-----------|---------|
| `pack_vote_start` | Host → Players | `{ packs: { id, name }[], timerSeconds: 10 }` |
| `pack_vote` | Player → Host | `{ playerId, packId }` |
| `pack_vote_result` | Host → Players | `{ winningPackId, votes: Record<string, number> }` |

## Question Selection

After voting resolves, the host draws a question from the winning pack at the current difficulty tier. If the winning pack has no remaining question at that tier, fall back to any other selected pack.

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `packVotingEnabled` to `GameSettings`, add `'pack_vote'` to `GameScreen` |
| `src/stores/gameStore.ts` | Add vote collection logic, pack vote resolution, draw question from voted pack |
| `src/stores/multiplayerStore.ts` | Add vote broadcast types and handlers |
| `src/components/Game/PackVote.tsx` | New component — host vote display with timer and results |
| `src/components/Player/PlayerView.tsx` | Add pack vote screen with vote buttons |
| `src/components/Landing/Landing.tsx` | Add pack voting toggle (conditional on multi-pack + multiplayer) |
| `src/hooks/useMultiplayer.ts` | Handle `pack_vote_start`, `pack_vote`, `pack_vote_result` events |
| `src/App.tsx` | Add `pack_vote` screen routing |
