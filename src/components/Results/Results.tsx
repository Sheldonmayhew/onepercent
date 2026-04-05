import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { endHostGame } from '../../hooks/useMultiplayer';
import { formatRands } from '../../utils/helpers';

export default function Results() {
  const { session, resetGame, setScreen, createGame } = useGameStore();
  const roomCode = useMultiplayerStore((s) => s.roomCode);
  const mpReset = useMultiplayerStore((s) => s.reset);

  if (!session) return null;

  const rankedPlayers = useMemo(() => {
    return [...session.players].sort((a, b) => b.score - a.score);
  }, [session.players]);

  const winner = rankedPlayers[0];
  const totalRounds = session.roundHistory.length;

  // Stats
  const stats = useMemo(() => {
    const longestStreak = session.players.reduce(
      (best, p) => {
        const streak = p.lastCorrectRound + 1;
        return streak > best.streak ? { name: p.name, streak } : best;
      },
      { name: '', streak: 0 }
    );

    const highestBanker = session.players
      .filter((p) => p.isBanked)
      .sort((a, b) => b.score - a.score)[0];

    return { longestStreak, highestBanker };
  }, [session.players]);

  const handleNewGame = () => {
    endHostGame();
    mpReset();
    // Navigate to landing screen first so AnimatePresence can transition,
    // then fully reset the session on the next tick
    setScreen('landing');
    setTimeout(() => resetGame(), 0);
  };

  const handlePlayAgain = () => {
    if (roomCode) {
      // Multiplayer — players need to rejoin a fresh room
      endHostGame();
      mpReset();
      setScreen('landing');
      setTimeout(() => resetGame(), 0);
    } else {
      // Local — restart directly into lobby
      createGame(session.settings);
    }
  };

  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Victory glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-neon-gold/8 blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-display text-5xl md:text-6xl text-neon-gold glow-gold tracking-tight mb-2">
            GAME OVER
          </h1>
          <p className="text-text-secondary">
            {totalRounds} round{totalRounds !== 1 ? 's' : ''} played
          </p>
        </motion.div>

        {/* Winner spotlight */}
        {winner && winner.score > 0 && (
          <motion.div
            className="text-center mb-8 bg-bg-surface/60 backdrop-blur border border-neon-gold/20 rounded-2xl p-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.4 }}
          >
            <span className="text-5xl mb-3 block">{winner.avatar}</span>
            <h2
              className="font-display text-4xl tracking-wide mb-1"
              style={{ color: winner.colour }}
            >
              {winner.name}
            </h2>
            <p className="text-text-secondary mb-3">takes home</p>
            <span className="font-score text-5xl text-neon-gold font-bold glow-gold">
              {formatRands(winner.score)}
            </span>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-neon-gold text-xl">🏆</span>
              <span className="text-neon-gold font-display text-xl tracking-wider">WINNER</span>
              <span className="text-neon-gold text-xl">🏆</span>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div
          className="bg-bg-surface/80 backdrop-blur border border-white/5 rounded-2xl overflow-hidden mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="px-5 py-3 border-b border-white/5">
            <h3 className="font-display text-lg text-text-primary tracking-wide">FINAL STANDINGS</h3>
          </div>
          <div className="divide-y divide-white/5">
            {rankedPlayers.map((player, idx) => (
              <motion.div
                key={player.id}
                className="flex items-center gap-3 px-5 py-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.08 }}
              >
                <span
                  className={`font-score text-lg w-8 text-center font-bold ${
                    idx === 0 ? 'text-neon-gold' : idx === 1 ? 'text-text-secondary' : idx === 2 ? 'text-amber-700' : 'text-text-muted'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="text-xl">{player.avatar}</span>
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.colour }}
                />
                <span className="flex-1 font-medium text-text-primary">{player.name}</span>
                <div className="text-right">
                  <span className="font-score text-sm text-neon-gold font-bold block">
                    {formatRands(player.score)}
                  </span>
                  <span className="text-xs text-text-muted">
                    {player.isBanked
                      ? 'Banked'
                      : player.isEliminated
                        ? 'Eliminated'
                        : player.lastCorrectRound >= 0
                          ? `Round ${player.lastCorrectRound + 1}`
                          : 'No rounds'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {stats.longestStreak.name && (
            <div className="bg-bg-surface/60 border border-white/5 rounded-xl p-4 text-center">
              <span className="text-xs text-text-muted block mb-1">Longest Streak</span>
              <span className="font-display text-xl text-neon-cyan">{stats.longestStreak.name}</span>
              <span className="text-xs text-text-muted block mt-0.5">{stats.longestStreak.streak} rounds</span>
            </div>
          )}
          {stats.highestBanker && (
            <div className="bg-bg-surface/60 border border-white/5 rounded-xl p-4 text-center">
              <span className="text-xs text-text-muted block mb-1">Smartest Banker</span>
              <span className="font-display text-xl text-neon-gold">{stats.highestBanker.name}</span>
              <span className="text-xs text-text-muted block mt-0.5">{formatRands(stats.highestBanker.score)}</span>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex gap-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <motion.button
            onClick={handleNewGame}
            className="flex-1 py-3.5 rounded-xl font-display text-lg tracking-wide bg-bg-elevated border border-white/5 text-text-secondary hover:text-text-primary hover:border-white/10 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            NEW GAME
          </motion.button>
          <motion.button
            onClick={handlePlayAgain}
            className="flex-[2] py-3.5 rounded-xl font-display text-lg tracking-wide bg-gradient-to-r from-neon-cyan to-cyan-400 text-bg-deep hover:brightness-110 box-glow-cyan"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            PLAY AGAIN
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
