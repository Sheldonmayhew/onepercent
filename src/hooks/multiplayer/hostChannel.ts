import type { RealtimeChannel } from '@supabase/supabase-js';

// ──────────────────────────────────────────
// Module-level channels — persist across component mount/unmount cycles.
// ──────────────────────────────────────────
let hostChannel: RealtimeChannel | null = null;
let hostBeforeUnloadHandler: (() => void) | null = null;
let lastBroadcastRoute: string | null = null;
const readyPlayers = new Set<string>();
let readyPlayersRound = -1;

export function getHostChannel() { return hostChannel; }
export function setHostChannel(ch: RealtimeChannel | null) { hostChannel = ch; }

export function getHostBeforeUnloadHandler() { return hostBeforeUnloadHandler; }
export function setHostBeforeUnloadHandler(fn: (() => void) | null) { hostBeforeUnloadHandler = fn; }

export function getLastBroadcastRoute() { return lastBroadcastRoute; }
export function setLastBroadcastRoute(route: string | null) { lastBroadcastRoute = route; }

export function getReadyPlayersRound() { return readyPlayersRound; }
export function setReadyPlayersRound(round: number) { readyPlayersRound = round; }

export { readyPlayers };
