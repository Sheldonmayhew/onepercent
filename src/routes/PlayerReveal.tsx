import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { formatRands } from '../utils/helpers';

const CURRENT_ROUTE = '/player/reveal';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  const me = gameState?.players.find((p) => p.id === playerId);
  const reveal = gameState?.reveal;
  const players = gameState?.players ?? [];

  // Navigate when host broadcasts a new route
  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const isCorrect = playerId != null && (reveal?.correctPlayerIds.includes(playerId) ?? false);
  const correctPlayers = players.filter((p) => reveal?.correctPlayerIds.includes(p.id));
  const incorrectPlayers = players.filter((p) => reveal?.incorrectPlayerIds.includes(p.id));

  const handleLeave = () => {
    disconnect();
    mpReset();
    navigate('/', { replace: true });
  };

  return (
    <motion.div
      className="min-h-dvh flex flex-col bg-bg-primary px-4 pt-6 pb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {me && <span className="text-2xl">{me.avatar}</span>}
          <div>
            <p className="font-medium text-text-primary text-sm">{playerName}</p>
            {me && (
              <p className="text-xs text-neon-gold font-score">
                R{me.score.toLocaleString('en-ZA')}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="text-xs text-text-muted hover:text-neon-pink transition-colors px-3 py-1.5 rounded-lg bg-bg-card"
        >
          LEAVE
        </button>
      </div>

      <div className="w-full max-w-lg mx-auto flex flex-col gap-5 flex-1">
        {/* Personal result */}
        <motion.div
          className={`rounded-2xl p-6 flex flex-col items-center gap-3 ${
            isCorrect
              ? 'bg-neon-green/10 border border-neon-green/30'
              : 'bg-neon-pink/10 border border-neon-pink/30'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 20 }}
        >
          <span className="text-5xl">{isCorrect ? '✅' : '❌'}</span>
          <p
            className={`font-display text-3xl tracking-wide ${
              isCorrect ? 'text-neon-green' : 'text-neon-pink'
            }`}
          >
            {isCorrect ? 'CORRECT!' : 'INCORRECT'}
          </p>
          {me && (
            <p className="font-score text-2xl text-neon-gold font-bold">
              {formatRands(me.score)}
            </p>
          )}
        </motion.div>

        {/* Correct answer card */}
        {reveal && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-5 flex flex-col gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-text-muted tracking-[0.15em] uppercase">Correct Answer</p>
            <p className="text-xl font-display font-bold text-neon-green">{reveal.correctAnswer}</p>
            {reveal.explanation && (
              <p className="text-sm text-text-secondary leading-relaxed">{reveal.explanation}</p>
            )}
          </motion.div>
        )}

        {/* Player results */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-5 flex flex-col gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {correctPlayers.length > 0 && (
            <div>
              <p className="text-xs text-neon-green tracking-[0.15em] uppercase mb-2">Correct ✓</p>
              <div className="flex flex-wrap gap-2">
                {correctPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-sm"
                  >
                    <span>{p.avatar}</span>
                    <span className="font-medium text-text-primary">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {incorrectPlayers.length > 0 && (
            <div>
              <p className="text-xs text-neon-pink tracking-[0.15em] uppercase mb-2">Incorrect ✗</p>
              <div className="flex flex-wrap gap-2">
                {incorrectPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-sm"
                  >
                    <span>{p.avatar}</span>
                    <span className="font-medium text-text-primary">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score board */}
          <div>
            <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-2">Scores</p>
            <div className="flex flex-col gap-1.5">
              {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    p.id === playerId ? 'bg-bg-elevated' : ''
                  }`}
                >
                  <span className="text-text-muted w-4 text-xs">{idx + 1}</span>
                  <span>{p.avatar}</span>
                  <span className="flex-1 text-text-primary font-medium">{p.name}</span>
                  <span className="font-score text-neon-gold text-xs">
                    {formatRands(p.score)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Waiting indicator */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-auto"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm">Waiting for next round…</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
