# Player Profiles — Implementation Spec

## Overview

Allow players to create and save a profile so they don't have to re-enter their name and emoji each time they play. Profiles are stored locally and optionally synced to Supabase for cross-device persistence.

## Profile Model

```typescript
export interface PlayerProfile {
  id: string;          // UUID
  name: string;
  avatar: string;      // chosen emoji
  colour: string;      // preferred colour
  createdAt: string;   // ISO timestamp
  stats: PlayerStats;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestScore: number;
  questionsCorrect: number;
  questionsAnswered: number;
  currentStreak: number;  // consecutive games with at least 1 correct answer
}
```

## Storage

### Local (Phase 1)
- Store profile in `localStorage` under key `onepercent_profile`
- Stats update at the end of each game
- Works offline, no account required

### Supabase (Phase 2, optional)
- New `player_profiles` table with the fields above
- Sync on game end if online
- Allow linking profile to a device fingerprint or simple PIN (no full auth)

## Profile Creation Flow

**First time playing:**
1. On JoinGame or Lobby add-player screen, detect no saved profile
2. Show a "Create Profile" form: name, emoji picker, colour picker
3. Save to `localStorage`
4. Pre-fill the join/add-player form with profile data on subsequent visits

**Returning player:**
1. Detect saved profile on mount
2. Auto-fill name and emoji on the join/add-player screen
3. Show "Playing as [name] [emoji]" with an "Edit" button

## Profile Screen

Accessible from the Landing page via a profile icon in the top corner:

- Display name, avatar, colour
- Edit name/avatar/colour
- View stats (games played, win rate, total score, highest score, accuracy %)
- "Clear Profile" option to reset

## Game Integration

- At game end, update the profile's `stats` fields
- `gamesWon` increments if the player has the highest score (or is on the winning team)
- `questionsCorrect` / `questionsAnswered` track accuracy

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `PlayerProfile` and `PlayerStats` interfaces |
| `src/stores/profileStore.ts` | New Zustand store — profile CRUD, stats updates, localStorage persistence |
| `src/components/Profile/ProfileScreen.tsx` | New component — profile view/edit with stats |
| `src/components/Profile/ProfileBadge.tsx` | New component — small profile indicator for Landing page header |
| `src/components/Landing/Landing.tsx` | Add profile badge / link to profile screen |
| `src/components/Lobby/Lobby.tsx` | Pre-fill player name/emoji from profile |
| `src/components/Player/JoinGame.tsx` | Pre-fill from profile, show "Playing as" label |
| `src/components/Results/Results.tsx` | Update profile stats on game end |
| `src/App.tsx` | Add profile screen routing |
