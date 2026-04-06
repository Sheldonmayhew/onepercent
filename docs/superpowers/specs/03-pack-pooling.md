# Pack Pooling — Implementation Spec

## Overview

Allow the host to select multiple question packs before starting a game. Questions are drawn from the combined pool across all selected packs, giving more variety and replayability.

## Settings Change

Replace the single `packId: string` in `GameSettings` with:

```typescript
packIds: string[]; // one or more selected pack IDs
```

Minimum 1 pack must be selected. No maximum — all 15+ packs can be selected.

## Landing Screen — Pack Selection

Replace the current single-select pack dropdown with a multi-select UI:

- Display packs as a scrollable grid of cards (pack name + question count)
- Each card is toggleable (tap to select/deselect, highlighted border when selected)
- Show total question count from all selected packs at the bottom: "142 questions selected from 3 packs"
- A "Select All" / "Deselect All" toggle at the top
- At least 1 pack must remain selected — prevent deselecting the last one

## Question Selection Logic

Update `selectQuestionsForGame()` in `src/utils/helpers.ts`:

1. Merge all questions from the selected packs into a single array
2. Group by difficulty tier (90%, 80%, ..., 1%)
3. For each tier, randomly select one question from the pooled group
4. If a tier has no questions across any selected pack, skip it (shouldn't happen with well-formed packs)

This replaces the current logic that draws from a single pack.

## Multiplayer Broadcast

The `GameBroadcast` already sends questions per-round, so no structural change is needed. The host resolves the pooled questions locally before broadcasting each round.

## Lobby Display

Show the selected pack names in the lobby settings summary so players know what content to expect. Example: "Packs: Mzansi Mix Vol 1, Brain Teasers, Numbers Game"

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Change `packId: string` to `packIds: string[]` in `GameSettings` |
| `src/stores/gameStore.ts` | Update `createGame` to load questions from multiple packs, update `selectQuestionsForGame` call |
| `src/utils/helpers.ts` | Update `selectQuestionsForGame` to accept merged question arrays |
| `src/components/Landing/Landing.tsx` | Replace single pack dropdown with multi-select grid |
| `src/components/Lobby/Lobby.tsx` | Display selected pack names in settings summary |
| `src/data/loadPacks.ts` | No change — already loads all packs |
