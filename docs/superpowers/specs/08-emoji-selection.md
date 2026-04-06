# Emoji Selection — Implementation Spec

## Overview

Allow players to choose their own emoji avatar instead of being auto-assigned from the fixed `PLAYER_AVATARS` array. This adds personality and makes it easier to identify players on the host screen.

## Current State

Players are auto-assigned from `PLAYER_AVATARS = ['🦁', '🐆', '🦏', '🐘', '🦒', '🦓', '🐊', '🦅']` based on join order. No player choice.

## Emoji Picker

### Available Emoji Set
Rather than a full unicode emoji picker (too large, inconsistent cross-platform), provide a curated set of ~40-50 emojis organised by category:

| Category | Emojis |
|----------|--------|
| Animals | 🦁🐆🦏🐘🦒🦓🐊🦅🐍🦈🐺🦊🐻🐼🦄🐲 |
| Faces | 😎🤓🥸🤠🥳🤩😈👻💀🤖👽🎃 |
| Objects | 🔥⚡💎👑🎯🏆🎪🚀💣🎸 |
| Flags/Symbols | 🇿🇦⭐💫✨🌟💥🎵 |

### Selection UI

**In Lobby (Local Play):**
- When adding a player, show the emoji grid below the name input
- Player taps an emoji to select it (highlighted with a border)
- Already-taken emojis are greyed out / disabled
- Default: first available emoji from the Animals row (preserves current behaviour if skipped)

**In JoinGame (Multiplayer):**
- After entering their name, player sees the emoji grid
- Selection is sent with the `player_join` broadcast event
- If two players pick the same emoji simultaneously, second player gets a "taken" error and must pick again

## Data Flow

### Local
- `addPlayer(name, emoji)` — the emoji parameter replaces auto-assignment
- Store validates uniqueness within the session

### Multiplayer
- `player_join` event payload gains an `avatar` field
- Host validates uniqueness and either accepts or rejects with an error

## Types Change

No change to the `Player` interface — it already has `avatar: string`. The change is in how the avatar value is set (player-chosen vs auto-assigned).

`PLAYER_AVATARS` constant is replaced by `AVAILABLE_EMOJIS` — the curated set above.

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Replace `PLAYER_AVATARS` with `AVAILABLE_EMOJIS` organised by category |
| `src/stores/gameStore.ts` | Update `addPlayer` to accept emoji parameter, validate uniqueness |
| `src/components/Lobby/Lobby.tsx` | Add emoji grid to the add-player form |
| `src/components/Player/JoinGame.tsx` | Add emoji grid to the join form |
| `src/components/Game/EmojiPicker.tsx` | New component — reusable emoji grid with categories and selection state |
| `src/hooks/useMultiplayer.ts` | Include avatar in `player_join` payload, handle conflicts |
