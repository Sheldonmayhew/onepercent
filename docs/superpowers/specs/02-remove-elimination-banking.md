# Remove Elimination / Risk It / Banking — Implementation Spec

## Overview

Simplify the game by removing the elimination mechanic, the "risk it" concept, and the banking phase entirely. All players play every round regardless of whether they answer correctly. Scoring is purely additive — correct answers earn points, wrong answers earn nothing.

## What Changes

### Removed
- `EliminationRule` type (`zero_score` | `keep_last_cleared`)
- `bankingEnabled` from `GameSettings`
- `isEliminated` and `isBanked` from `Player`
- `eliminatedPlayers` and `bankedPlayers` from `RoundResult`
- `bankingDecisions` from `GameSession`
- `BankingPhase` component
- `bankPlayer` and `recordBankingDecision` store actions
- `banking` screen state
- The `BroadcastBanking` type and banking-related broadcast events

### Kept
- All players compete every round
- Points accumulate — correct answer adds the round's point value to the player's score
- Wrong answer adds nothing (no penalty, no elimination)
- The Results screen shows final cumulative scores

## Settings Screen

Remove the "Elimination Rule" and "Banking" toggles from the Landing page settings panel. This simplifies the configuration to: game mode, question pack, timer speed, and sound.

## Game Flow Change

Current: Question → Answer → Reveal → (optional Banking) → Next Round
New: Question → Answer → Reveal → Next Round

The `banking` screen state is removed from the `GameScreen` type. The `proceedToNextRound` function no longer checks for banking phases.

## Reveal Screen

- Show which players got the answer right/wrong using colour-coded indicators
- No "eliminated" state — wrong players just don't earn points this round
- Remove any "ELIMINATED" or "BANKED" labels

## Migration Notes

- The `Player` interface keeps the `score` field and gains simplicity by dropping `isEliminated`, `isBanked`, and `lastCorrectRound`
- `getActivePlayers()` becomes trivial — returns all players (no filtering)
- Existing question pack data is unaffected

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Remove `EliminationRule`, `bankingEnabled`, `isEliminated`, `isBanked`, `bankedPlayers`, `eliminatedPlayers`, `bankingDecisions`, `banking` screen state |
| `src/stores/gameStore.ts` | Remove banking/elimination logic from `revealAnswers`, `proceedToNextRound`, `bankPlayer`, `recordBankingDecision`, simplify `getActivePlayers` |
| `src/stores/multiplayerStore.ts` | Remove `BroadcastBanking`, banking screen handling |
| `src/components/Game/BankingPhase.tsx` | Delete file |
| `src/components/Game/RevealScreen.tsx` | Remove eliminated/banked player display, show correct/incorrect only |
| `src/components/Game/PlayerStatusBar.tsx` | Remove eliminated/banked visual states |
| `src/components/Landing/Landing.tsx` | Remove elimination rule and banking toggles |
| `src/components/Player/PlayerView.tsx` | Remove banking screen handling |
| `src/hooks/useMultiplayer.ts` | Remove banking broadcast events |
| `src/App.tsx` | Remove banking screen route |
