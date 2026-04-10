import { useEffect, useRef } from 'react';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useGameStore } from '../stores/gameStore';
import { buildBroadcastFromSession } from './mockData';

/**
 * Mock driver hook — when mockMode is active for player/TV roles,
 * drives game state transitions locally using the game store as the
 * source of truth, then projects broadcast state to the multiplayer store.
 *
 * Flow: lobby → round-intro → play → (player answers) → reveal → next round → … → results
 */
export function useMockDriver() {
  const mockMode = useMultiplayerStore((s) => s.mockMode);
  const role = useMultiplayerStore((s) => s.role);
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<string | null>(null);

  const isActive = mockMode && (role === 'player' || role === 'spectator');

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Drive transitions based on the current broadcast route
  useEffect(() => {
    if (!isActive || !gameState) return;

    const route = gameState.route;
    // Prevent re-triggering for same phase
    if (route === phaseRef.current) return;
    phaseRef.current = route;

    if (timerRef.current) clearTimeout(timerRef.current);

    const playerRoute = role === 'spectator' ? mapHostToPlayerRoute(route) : route;

    if (playerRoute.includes('/lobby')) {
      // Auto-advance from lobby → round-intro after 2s
      timerRef.current = setTimeout(() => {
        advanceToRoute('/player/round-intro');
      }, 2000);
    } else if (playerRoute.includes('/round-intro')) {
      // Auto-advance from round-intro → play after 3s (matches real intro)
      timerRef.current = setTimeout(() => {
        // Start the timer
        const session = useGameStore.getState().session;
        if (session && !session.timerStarted) {
          useGameStore.setState({
            session: { ...session, timerStarted: true },
          });
        }
        advanceToRoute('/player/play');
      }, 3000);
    }
    // play → wait for player answer (handled by the answer watcher below)
    // reveal is handled below
    else if (playerRoute.includes('/reveal')) {
      // Auto-advance from reveal → next round after 3s
      timerRef.current = setTimeout(() => {
        const store = useGameStore.getState();
        const result = store.proceedToNextRound();

        if (result === 'next_question') {
          advanceToRoute('/player/play');
        } else if (result === 'next_round') {
          advanceToRoute('/player/round-intro');
        } else {
          advanceToRoute('/player/results');
        }
      }, 3000);
    }
  }, [isActive, gameState?.route]);

  // Watch for the mock player's answer submission to trigger reveal (player role only)
  useEffect(() => {
    if (!isActive || role !== 'player' || !gameState || !playerId) return;

    const route = gameState.route;
    if (!route.includes('/play')) return;

    const me = gameState.players.find((p) => p.id === playerId);
    if (!me?.hasAnswered) return;

    // Player has answered — simulate other players answering, then reveal
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const session = useGameStore.getState().session;
      if (!session) return;

      // Submit random answers for all players
      const store = useGameStore.getState();
      const question = store.getCurrentQuestion();
      if (!question) return;

      for (const player of session.players) {
        if (!player.hasAnswered) {
          const answer = pickRandomAnswer(question);
          store.submitAnswer(player.id, answer);
        }
      }

      // Set all answers in and reveal
      useGameStore.getState().setAllAnswersIn();

      setTimeout(() => {
        useGameStore.getState().revealAnswers();
        advanceToRoute('/player/reveal');
      }, 500);
    }, 1000);
  }, [isActive, gameState?.players, playerId]);

  // For TV/spectator: auto-advance play after a delay (no player interaction)
  useEffect(() => {
    if (!isActive || role !== 'spectator' || !gameState) return;

    const route = mapHostToPlayerRoute(gameState.route);
    if (!route.includes('/play')) return;

    // Spectator: auto-play after 5s
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const session = useGameStore.getState().session;
      if (!session) return;

      const store = useGameStore.getState();
      const question = store.getCurrentQuestion();
      if (!question) return;

      // Submit answers for all players
      for (const player of session.players) {
        if (!player.hasAnswered) {
          store.submitAnswer(player.id, pickRandomAnswer(question));
        }
      }

      useGameStore.getState().setAllAnswersIn();

      setTimeout(() => {
        useGameStore.getState().revealAnswers();
        advanceToRoute('/player/reveal');
      }, 500);
    }, 5000);
  }, [isActive, role, gameState?.route]);
}

// ── Helpers ──────────────────────────────────────────────────

function advanceToRoute(playerRoute: string) {
  const session = useGameStore.getState().session;
  if (!session) return;

  const role = useMultiplayerStore.getState().role;
  const hostRoute = playerRoute.replace('/player/', '/host/');
  const broadcastRoute = role === 'spectator' ? hostRoute : playerRoute;

  const broadcast = buildBroadcastFromSession(session, broadcastRoute);
  useMultiplayerStore.setState({ gameState: broadcast });
}

function mapHostToPlayerRoute(route: string): string {
  return route.replace('/host/', '/player/');
}

function pickRandomAnswer(question: { type: string; options?: string[] }): string | number {
  if (question.options && question.options.length > 0) {
    return Math.floor(Math.random() * question.options.length);
  }
  // Numeric: return a plausible number
  return 1994;
}
