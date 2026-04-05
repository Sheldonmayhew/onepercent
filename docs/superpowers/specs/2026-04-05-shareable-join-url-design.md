# Shareable Join URL — Design Spec

## Overview

Allow the host to share a URL that players can open to join the game directly, bypassing the Landing and JoinGame screens. The URL encodes the room code in the hash fragment. Players are prompted for their name via a modal, then auto-join the lobby.

## URL Scheme

**Format:** `https://<app-domain>/#join=ABC12`

- Hash-based to avoid server-side routing requirements
- Compatible with any static hosting (Vercel, Netlify, etc.)
- Does not trigger page reloads or server requests

## Player Join-via-URL Flow

1. Player opens the shared URL
2. `App.tsx` detects `#join=XXXXX` on mount via `window.location.hash`
3. App clears the hash from the URL (clean browser bar)
4. A name-entry modal is displayed (minimal overlay with a text input and Join button)
5. On submit, the app calls `joinRoom(code, name)` from `usePlayerMultiplayer` — identical to the existing JoinGame flow
6. Player lands in the PlayerView lobby screen, connected to the host

### Error Handling

- If the room code is invalid or the game is no longer in the lobby phase, show an error message with a button to navigate to the Landing page.
- Error state is handled within the modal itself (e.g., "Room not found" or "Game already in progress").

## Host Lobby — Share UI

On the Lobby screen, below the existing room code display, add:

### Copy Link Button

- Constructs the join URL: `${window.location.origin}${window.location.pathname}#join=${roomCode}`
- Copies to clipboard via `navigator.clipboard.writeText()`
- Shows brief "Copied!" feedback (1.5s timeout, then reverts to "Copy Link")

### QR Code

- Rendered inline using `qrcode.react` (QRCodeSVG component)
- Encodes the same join URL as the copy button
- Sized for easy scanning when displayed on a TV or shared screen (~180x180px)
- Styled to match the existing neon/dark theme (dark background, light foreground)

## Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `qrcode.react` | Client-side QR code rendering | ~5KB gzipped |

No other new dependencies required. `qrcode.react` has a peer dependency on React (already installed).

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Add hash detection on mount, conditional rendering of JoinModal |
| `src/components/Lobby/Lobby.tsx` | Add Copy Link button and QR code display |
| `src/components/Player/JoinModal.tsx` | New component — modal for name entry when joining via URL |
| `package.json` | Add `qrcode.react` dependency |

## Architecture Notes

- The join-via-URL flow reuses the existing `usePlayerMultiplayer().joinRoom()` function — no changes to multiplayer logic needed.
- The JoinModal component is intentionally minimal: a styled overlay with a name input, join button, and error display.
- Hash is cleared after reading to prevent re-triggering on refresh after joining.
- The existing JoinGame component and manual code-entry flow remain unchanged as a fallback.
