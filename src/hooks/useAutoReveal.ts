import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { broadcastHostState } from './useMultiplayer';
import { getRoundDefinition } from '../roundTypes/registry';
import { shuffleArray } from '../utils/helpers';
import { DIFFICULTY_TIERS } from '../types';
import type { GameSession, Question, Player } from '../types';

interface UseAutoRevealParams {
  session: GameSession | null;
  isQuickPlay: boolean;
  isHost: boolean;
  getCurrentQuestion: () => Question | null;
  getActivePlayers: () => Player[];
}

/**
 * Handles auto-reveal logic for timed_reveal (Snap), progressive_reveal (LookBeforeYouLeap),
 * and categorized (Switchagories) round types.
 */
export function useAutoReveal({
  session,
  isQuickPlay,
  isHost,
  getCurrentQuestion,
  getActivePlayers: _getActivePlayers,
}: UseAutoRevealParams) {
  // Auto-reveal for timed_reveal (Snap) and progressive_reveal (LookBeforeYouLeap)
  const autoRevealInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (autoRevealInterval.current) {
      clearInterval(autoRevealInterval.current);
      autoRevealInterval.current = null;
    }

    if (!session) return;
    const timerActive = isQuickPlay || session.timerStarted;
    if (!timerActive) return;

    const roundTypeId = session.roundTypeSequence?.[session.currentRound];
    if (!roundTypeId) return;
    const def = getRoundDefinition(roundTypeId);
    const q = getCurrentQuestion();
    if (!q) return;

    // Snap: reveal answer options one at a time
    if (def.questionFormat === 'timed_reveal' && q.options) {
      const delayMs = q.reveal_delay_ms ?? 3000;
      const total = q.options.length;

      // Reveal first option immediately if none revealed yet
      const cur = (session.activeRoundState as any)?.revealedOptions ?? [];
      if (cur.length === 0) {
        useGameStore.getState().updateRoundState((prev: any) => ({
          ...prev,
          revealedOptions: [0],
        }));
        if (isHost) broadcastHostState();
      }

      autoRevealInterval.current = setInterval(() => {
        const s = useGameStore.getState().session;
        if (!s) return;
        const revealed: number[] = (s.activeRoundState as any)?.revealedOptions ?? [];
        if (revealed.length >= total) {
          clearInterval(autoRevealInterval.current!);
          autoRevealInterval.current = null;
          return;
        }
        const nextIdx = revealed.length;
        useGameStore.getState().updateRoundState((prev: any) => ({
          ...prev,
          revealedOptions: [...((prev as any)?.revealedOptions ?? []), nextIdx],
        }));
        if (isHost) broadcastHostState();
      }, delayMs);
    }

    // LookBeforeYouLeap: reveal clue chunks one at a time
    if (def.questionFormat === 'progressive_reveal' && q.reveal_chunks) {
      const total = q.reveal_chunks.length;
      // Spread reveals over ~80% of the timer, leaving time to answer at end
      const chunkDelay = Math.floor((q.time_limit_seconds * 1000 * 0.8) / Math.max(total, 1));

      // Reveal first chunk immediately if none revealed yet
      const cur = (session.activeRoundState as any)?.revealedChunks ?? 0;
      if (cur === 0) {
        useGameStore.getState().updateRoundState((prev: any) => ({
          ...prev,
          revealedChunks: 1,
        }));
        if (isHost) broadcastHostState();
      }

      autoRevealInterval.current = setInterval(() => {
        const s = useGameStore.getState().session;
        if (!s) return;
        const current: number = (s.activeRoundState as any)?.revealedChunks ?? 0;
        if (current >= total) {
          clearInterval(autoRevealInterval.current!);
          autoRevealInterval.current = null;
          return;
        }
        useGameStore.getState().updateRoundState((prev: any) => ({
          ...prev,
          revealedChunks: ((prev as any)?.revealedChunks ?? 0) + 1,
        }));
        if (isHost) broadcastHostState();
      }, chunkDelay);
    }

    return () => {
      if (autoRevealInterval.current) {
        clearInterval(autoRevealInterval.current);
        autoRevealInterval.current = null;
      }
    };
  }, [session?.currentRound, session?.timerStarted, isQuickPlay, isHost]);

  // Switchagories: when picker selects a pack, find a question from that pack and transition
  useEffect(() => {
    if (!session) return;
    const roundTypeId = session.roundTypeSequence?.[session.currentRound];
    if (!roundTypeId) return;
    const def = getRoundDefinition(roundTypeId);
    if (def.questionFormat !== 'categorized') return;

    const state = session.activeRoundState as any;
    if (state?.phase === 'answering') return;

    // Transition once the picker has made their pack choice
    if (state?.categoryPick) {
      const store = useGameStore.getState();

      // Search all available packs (not just selected) since pack options come from all packs
      const chosenPack = store.availablePacks.find((p) => p.name === state.categoryPick);
      if (chosenPack) {
        const difficulty = [...DIFFICULTY_TIERS][session.currentRound] ?? 60;
        const usedIds = new Set(
          session.roundHistory.map((r) => r.question.id),
        );

        // Find matching questions, preferring exact difficulty then nearest
        let pool = chosenPack.questions.filter(
          (q) => q.difficulty === difficulty && !usedIds.has(q.id),
        );
        if (pool.length === 0) {
          pool = chosenPack.questions.filter((q) => !usedIds.has(q.id));
          pool.sort(
            (a, b) =>
              Math.abs(a.difficulty - difficulty) -
              Math.abs(b.difficulty - difficulty),
          );
        }
        if (pool.length === 0) {
          pool = chosenPack.questions;
        }

        const picked = shuffleArray(pool)[0];
        if (picked) {
          store.replaceCurrentQuestion(picked);
        }
      }

      store.updateRoundState((prev: any) => ({
        ...prev,
        phase: 'answering',
      }));
      if (isHost) broadcastHostState();
    }
  });
}
