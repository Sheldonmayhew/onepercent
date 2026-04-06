# Mobile Native / Mobile First — Implementation Spec

## Overview

Redesign the app to be mobile-first, ensuring the primary experience is optimised for phone-sized screens. The host experience remains best on a large screen (TV/laptop), but all player-facing screens must work flawlessly on mobile. Consider wrapping the app with Capacitor for native mobile distribution.

## Current State

The app already uses `dvh` units and Tailwind responsive utilities, but several screens are designed desktop-first with layouts that don't adapt well to small viewports.

## Mobile-First Layout Changes

### Player Screens (JoinGame, PlayerView)
These are the primary mobile surfaces — players use their phones.

- **Touch targets:** All buttons minimum 48x48px tap area
- **Input fields:** Large text inputs with `inputmode` attributes (`numeric` for number answers, `text` for text)
- **Font sizes:** Minimum 16px for inputs (prevents iOS zoom on focus)
- **Scrolling:** Prevent body scroll, use inner scroll containers where needed
- **Viewport:** Handle mobile keyboard appearance — use `visualViewport` API to adjust layout when keyboard opens
- **Orientation:** Lock to portrait via meta tag / Capacitor config

### Host Screens (Landing, Lobby, GameScreen, Results)
Optimised for large screens but must remain functional on mobile.

- **Landing:** Stack settings vertically on narrow viewports (currently may overflow)
- **Lobby:** Player list wraps to accommodate smaller screens
- **GameScreen:** Question text scales with `clamp()` font sizing
- **Results:** Scrollable player list if it exceeds viewport

## Touch Interactions

- Replace any hover-dependent interactions with tap/press equivalents
- Add haptic feedback hints via `navigator.vibrate()` for answer submission and round transitions (where supported)
- Swipe-to-dismiss for modals (optional enhancement)

## Performance

- Lazy-load question pack data — don't load all 15 packs on initial render
- Reduce Framer Motion animation complexity on devices with `prefers-reduced-motion`
- Test and optimise for 60fps on mid-range Android devices

## Native Wrapper (Capacitor)

For app store distribution:

```
npm install @capacitor/core @capacitor/cli
npx cap init "The 1% Club" com.onepercent.app
npx cap add android
npx cap add ios
```

- **Splash screen / status bar:** Configure via Capacitor plugins
- **Deep links:** Handle `onepercent://join?code=ABC12` for native join flow
- **Push notifications:** Not needed initially — real-time is handled by Supabase channels
- **Build:** Vite builds to `dist/`, Capacitor syncs from there

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add mobile-first base styles, touch target utilities, clamp font sizes |
| `src/components/Player/PlayerView.tsx` | Refactor layout for mobile-first, add viewport keyboard handling |
| `src/components/Player/JoinGame.tsx` | Enlarge inputs and buttons, add `inputmode` attributes |
| `src/components/Game/AnswerInput.tsx` | Add `inputmode`, larger touch targets, keyboard-aware positioning |
| `src/components/Game/GameScreen.tsx` | Responsive question text with `clamp()` |
| `src/components/Landing/Landing.tsx` | Stack layout on narrow viewports |
| `src/components/Lobby/Lobby.tsx` | Responsive player grid |
| `src/components/Results/Results.tsx` | Scrollable results for small screens |
| `capacitor.config.ts` | New — Capacitor configuration |
| `package.json` | Add Capacitor dependencies |
