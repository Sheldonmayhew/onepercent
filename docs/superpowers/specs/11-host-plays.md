# Host Plays — Implementation Spec

## Overview

Allow the host to participate in the game as a player while still controlling game flow (starting rounds, revealing answers, ending the game). Currently in multiplayer mode the host screen shows a passive "Waiting for answers..." view during each round. This feature lets the host answer questions on the same device that runs the game.

## Settings Change

Add to `GameSettings`:

```typescript
hostPlays: boolean; // default false
```

This option is only shown when multiplayer mode is active (meaningless in local pass-and-play since all players already use the host device).

## Host Player Registration

When `hostPlays` is enabled:

1. In the Lobby, the host enters their own name (and emoji, if that feature is active) using the same add-player form
2. The first player added is flagged as the host player via a new field on `Player`:

```typescript
isHost: boolean; // default false
```

3. The host player is included in the player list, scoring, and results like any other player
4. The host player's colour and avatar are assigned from the same pools

Alternatively, the host is auto-added as a player when `hostPlays` is toggled on, prompting for a name immediately.

## Game Screen — Host Answer Phase

When `hostPlays` is enabled, the multiplayer GameScreen flow changes:

**Current flow:**
1. "Waiting for players to get ready..." → START ROUND button
2. "Waiting for answers..." (spinner) → CLOSE ANSWERS button
3. "All answers are in!" → REVEAL ANSWER button

**New flow:**
1. "Waiting for players to get ready..." → START ROUND button (unchanged)
2. **Host answers the question** — show `AnswerInput` component for the host player, with the timer running. Remote players answer on their devices simultaneously.
3. After the host submits their answer, show the existing "Waiting for answers..." view with the CLOSE ANSWERS button for remaining remote players
4. "All answers are in!" → REVEAL ANSWER button (unchanged)

### Key Constraint
The host must NOT see the correct answer or other players' answers before submitting their own. The reveal button only appears after the host has answered (or the timer expires).

## Answer Submission

- The host's answer is submitted locally via `submitAnswer(hostPlayerId, answer)` — same as local mode
- Remote players' answers arrive via broadcast as usual
- The `allAnswered` check includes the host player

## Timer Behaviour

- Timer starts when the host taps START ROUND (same as current)
- Both the host and remote players answer within the same timer window
- If the timer expires before the host answers, their answer is treated as unanswered (no points)

## Multiplayer Broadcast

- The host player is included in the `players` array of the `GameBroadcast`
- Remote player devices see the host as a regular player in the status bar
- No changes to broadcast event types — the host's answer is resolved locally, not via broadcast

## Lobby Behaviour

- When `hostPlays` is on, the host appears in the player list with a small crown/star icon to distinguish them
- The host cannot remove themselves from the player list (they can toggle `hostPlays` off instead)
- Minimum player count for multiplayer remains 2 (host + at least 1 remote player)

## Results

The host player is ranked alongside all other players. No special treatment — if they win, they win.

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `hostPlays` to `GameSettings`, add `isHost` to `Player` |
| `src/stores/gameStore.ts` | Add host player creation when `hostPlays` enabled, include host in `getActivePlayers` |
| `src/components/Landing/Landing.tsx` | Add `hostPlays` toggle (shown only when multiplayer is selected) |
| `src/components/Lobby/Lobby.tsx` | Auto-add host player when `hostPlays` is on, show crown icon on host, prevent host self-removal |
| `src/components/Game/GameScreen.tsx` | Replace "Waiting for answers" with `AnswerInput` for host player, transition to waiting view after host submits |
| `src/components/Game/PlayerStatusBar.tsx` | Show host indicator (crown/star) next to host player name |
| `src/hooks/useMultiplayer.ts` | Include host player in broadcast player list |
