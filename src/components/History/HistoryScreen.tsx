import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHistoryStore } from '../../stores/historyStore';
import { formatRands } from '../../utils/helpers';

interface HistoryScreenProps {
  onClose: () => void;
}

export default function HistoryScreen({ onClose }: HistoryScreenProps) {
  const { records, clearHistory } = useHistoryStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Stats summary
  const totalGames = records.length;
  const avgScore = totalGames > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.players.sort((a, b) => b.finalScore - a.finalScore)[0]?.finalScore ?? 0), 0) / totalGames)
    : 0;
  const bestGame = records.reduce((best, r) => {
    const topScore = Math.max(...r.players.map((p) => p.finalScore));
    return topScore > best ? topScore : best;
  }, 0);

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden px-4 py-8">
      <motion.div
        className="relative z-10 w-full max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-4xl text-text-primary tracking-tight">HISTORY</h1>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            ← Back
          </button>
        </div>

        {/* Stats Summary */}
        {totalGames > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-3 text-center">
              <span className="text-xs text-text-muted block mb-1">Games</span>
              <span className="font-score text-xl text-neon-cyan font-bold">{totalGames}</span>
            </div>
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-3 text-center">
              <span className="text-xs text-text-muted block mb-1">Avg Top Score</span>
              <span className="font-score text-xl text-neon-gold font-bold">{formatRands(avgScore)}</span>
            </div>
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-3 text-center">
              <span className="text-xs text-text-muted block mb-1">Best Score</span>
              <span className="font-score text-xl text-green-600 font-bold">{formatRands(bestGame)}</span>
            </div>
          </div>
        )}

        {/* Game List */}
        {records.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-text-secondary">No games played yet.</p>
            <p className="text-text-muted text-sm mt-1">Your game history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => {
              const winner = record.players.sort((a, b) => b.finalScore - a.finalScore)[0];
              const isExpanded = expandedId === record.id;

              return (
                <motion.div
                  key={record.id}
                  className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden"
                  layout
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg">{winner?.avatar ?? '🏆'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary text-sm truncate">{winner?.name ?? 'Unknown'}</span>
                        <span className="font-score text-xs text-neon-gold">{formatRands(winner?.finalScore ?? 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>{record.mode.toUpperCase()}</span>
                        <span>•</span>
                        <span>{record.playerCount} players</span>
                        <span>•</span>
                        <span>{record.rounds} rounds</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="px-4 py-3">
                          <p className="text-xs text-text-muted mb-2">
                            Packs: {record.packNames.join(', ')}
                          </p>
                          <div className="space-y-1.5">
                            {[...record.players]
                              .sort((a, b) => b.finalScore - a.finalScore)
                              .map((p, i) => (
                                <div key={p.id} className="flex items-center gap-2 text-sm">
                                  <span className={`font-score w-5 text-center font-bold ${i === 0 ? 'text-neon-gold' : 'text-text-muted'}`}>
                                    {i + 1}
                                  </span>
                                  <span>{p.avatar}</span>
                                  <span className="flex-1 text-text-primary">{p.name}</span>
                                  <span className="font-score text-xs text-neon-gold">{formatRands(p.finalScore)}</span>
                                  <span className="text-xs text-text-muted">{p.questionsCorrect}/{p.questionsAnswered}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {records.length > 0 && (
          <button
            onClick={clearHistory}
            className="mt-6 text-xs text-red-400 hover:text-red-500 transition-colors"
          >
            Clear History
          </button>
        )}
      </motion.div>
    </div>
  );
}
