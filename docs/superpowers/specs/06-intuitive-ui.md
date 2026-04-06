# Intuitive UI — Implementation Spec

## Overview

Improve the overall user experience by making game flows clearer, reducing confusion points, and adding visual cues that guide players through each phase of the game without needing instructions.

## Key Improvements

### 1. Onboarding Hints
- First-time host sees brief tooltip overlays explaining: how to add players, how to configure settings, what each game mode means
- Use `localStorage` flag (`onboarding_seen`) to show once
- Dismissible with a tap anywhere

### 2. Game Mode Descriptions
- On the Landing screen, each game mode (Classic, Quick, Practice) shows a one-line description beneath it:
  - Classic: "11 rounds, full difficulty ladder"
  - Quick: "5 rounds, fast game"
  - Practice: "Solo play, unlimited attempts"
- Timer speed options also get brief descriptions

### 3. Round Progress Indicator
- Replace or supplement the current round counter with a visual difficulty ladder
- Show all difficulty tiers as steps, highlight the current tier, grey out completed tiers
- Players can see at a glance how far through the game they are and what's coming

### 4. Answer Feedback
- After submitting an answer, show a clear visual confirmation ("Answer locked in" with a checkmark animation)
- On the reveal screen, animate correct/incorrect results with distinct colour and icon (green check / red X)
- Show the player's submitted answer alongside the correct answer for comparison

### 5. Clearer Player Status
- During gameplay, each player's status is visible: "Answering...", "Locked in", "Waiting"
- Use subtle pulse animation for players still answering
- Use a solid checkmark for players who have submitted

### 6. Simplified Settings
- Group related settings visually (game mode + timer together, content settings together)
- Use icons alongside labels for faster scanning
- Default settings should be sensible for the most common use case — highlight when a setting is non-default

### 7. Transition Animations
- Add brief interstitial screens between phases: "Round 3 — 70% Difficulty — 300 Points"
- 2-second auto-advance with a progress bar
- Gives players time to prepare and understand what's happening next

## Files Changed

| File | Change |
|------|--------|
| `src/components/Landing/Landing.tsx` | Add game mode descriptions, group settings, add icons, onboarding hints |
| `src/components/Game/GameScreen.tsx` | Add round progress ladder, transition interstitial |
| `src/components/Game/RevealScreen.tsx` | Animate correct/incorrect results, show submitted vs correct answer |
| `src/components/Game/AnswerInput.tsx` | Add "locked in" confirmation animation |
| `src/components/Game/PlayerStatusBar.tsx` | Show answering/locked-in/waiting states with animations |
| `src/components/Game/RoundIntro.tsx` | New component — interstitial screen between rounds |
| `src/index.css` | Add animation keyframes for feedback and transitions |
