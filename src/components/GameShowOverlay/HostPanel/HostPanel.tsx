import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../../../stores/multiplayerStore';
import { useOverlayStore } from '../../../stores/overlayStore';
import { getRoundDefinition } from '../../../roundTypes/registry';
import { getCommentary } from './hostCommentary';
import { speak, cancelSpeech } from './ttsEngine';
import type { Tier } from './ttsEngine';

function getPhase(route: string): string {
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

function getTier(roundType: string | undefined): Tier {
  if (!roundType) return 'warmup';
  const def = getRoundDefinition(roundType as import('../../../types').RoundTypeId);
  return def.tier;
}

export default function HostPanel() {
  const gameState = useMultiplayerStore((s) => s.gameState);
  const hostVoiceEnabled = useOverlayStore((s) => s.hostVoiceEnabled);
  const [line, setLine] = useState('');
  const [visible, setVisible] = useState(false);
  const lastPhaseRef = useRef('');
  const lastRoundRef = useRef(-1);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const revealDelayRef = useRef<ReturnType<typeof setTimeout>>();

  const showLine = useCallback(
    (text: string, tier: Tier) => {
      if (!text) return;
      setLine(text);
      setVisible(true);

      clearTimeout(hideTimerRef.current);

      if (hostVoiceEnabled) {
        speak(text, tier).then(() => {
          hideTimerRef.current = setTimeout(() => setVisible(false), 1500);
        });
      } else {
        // Text-only: show for reading time (~80ms per character, min 3s)
        const readTime = Math.max(3000, text.length * 80);
        hideTimerRef.current = setTimeout(() => setVisible(false), readTime);
      }
    },
    [hostVoiceEnabled]
  );

  useEffect(() => {
    if (!gameState) return;

    const phase = getPhase(gameState.route);
    const roundIndex = gameState.round?.index ?? -1;
    const roundType = gameState.round?.roundType ?? gameState.reveal?.roundType;
    const tier = getTier(roundType);

    // Only trigger on phase or round changes
    const phaseKey = `${phase}_${roundIndex}`;
    if (phaseKey === lastPhaseRef.current) return;
    lastPhaseRef.current = phaseKey;

    if (phase === 'round-intro' && gameState.round) {
      // Check for tier transition
      if (lastRoundRef.current >= 0 && roundIndex > lastRoundRef.current) {
        // Tier boundaries at rounds 3, 6, 9
        if (roundIndex === 3 || roundIndex === 6 || roundIndex === 9) {
          const tierText = getCommentary('tier_transition', tier);
          if (tierText) {
            showLine(tierText, tier);
            lastRoundRef.current = roundIndex;
            return;
          }
        }
      }

      lastRoundRef.current = roundIndex;
      const def = getRoundDefinition(gameState.round.roundType);
      const text = getCommentary('round_intro', tier, {
        roundName: def.name,
        difficulty: gameState.round.difficulty,
        playerCount: gameState.players.length,
      });
      showLine(text, tier);
    }

    if (phase === 'reveal' && gameState.reveal) {
      const correct = gameState.reveal.correctPlayerIds;
      const incorrect = gameState.reveal.incorrectPlayerIds;
      const total = correct.length + incorrect.length;

      let event: import('./hostCommentary').CommentaryEvent;
      if (correct.length === 0) {
        event = 'none_correct';
      } else if (correct.length >= total * 0.6) {
        event = 'many_correct';
      } else {
        event = 'few_correct';
      }

      // Delay commentary to let the reveal animation start
      clearTimeout(revealDelayRef.current);
      revealDelayRef.current = setTimeout(() => {
        const text = getCommentary(event, tier, {
          correctCount: correct.length,
        });
        showLine(text, tier);
      }, 2500);
    }
  }, [gameState, showLine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      clearTimeout(hideTimerRef.current);
      clearTimeout(revealDelayRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-8 left-8 z-40 flex items-end gap-4 max-w-md"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Avatar */}
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-neon-cyan/30">
            🎤
          </div>

          {/* Speech bubble */}
          <div className="relative bg-bg-secondary/90 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-5 py-3 shadow-xl">
            <p className="text-sm font-medium text-white/60 mb-0.5 tracking-wide">THE HOST</p>
            <motion.p
              key={line}
              className="text-lg font-display text-white leading-snug"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {line}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
