import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import RevealContent from '../components/Game/RevealContent';
import type { RevealData } from '../components/Game/RevealContent';
import GameLayout from '../components/Game/GameLayout';

const CURRENT_ROUTE = '/player/reveal';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const { disconnect } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  const reveal = gameState?.reveal;
  const players = gameState?.players ?? [];
  const round = gameState?.round;

  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const handleLeave = () => {
    disconnect();
    mpReset();
    navigate('/', { replace: true });
  };

  if (!reveal) return null;

  const totalQuestions = players[0]?.totalQuestions ?? 1;

  const scoreDeltas = reveal.scoreUpdates
    ? Object.fromEntries(reveal.scoreUpdates.map((u) => [u.playerId, u.delta]))
    : undefined;

  const revealData: RevealData = {
    questionText: round?.question?.question ?? '',
    correctAnswer: reveal.correctAnswer,
    explanation: reveal.explanation,
    pointsAtStake: round?.points ?? 0,
    correctPlayerIds: reveal.correctPlayerIds,
    incorrectPlayerIds: reveal.incorrectPlayerIds,
    scoreDeltas,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      colour: p.colour,
      score: p.score,
      correctCount: p.correctCount ?? 0,
      totalQuestions,
    })),
  };

  return (
    <GameLayout
      header={
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <button
            onClick={handleLeave}
            className="text-text-muted hover:text-neon-pink transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="font-display text-sm font-bold text-text-primary tracking-wide">
            Round Results
          </span>
          <div className="w-5" />
        </div>
      }
      cta={
        <motion.div
          className="flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-bg-elevated"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm font-medium">Waiting for next round…</p>
        </motion.div>
      }
    >
      <div className="pt-2">
        <RevealContent data={revealData} />
      </div>
    </GameLayout>
  );
}
