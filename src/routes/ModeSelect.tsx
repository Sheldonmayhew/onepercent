import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Component() {
  const navigate = useNavigate();
  const [teamCount, setTeamCount] = useState<2 | 3 | 4>(2);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <h1 className="font-display text-4xl text-text-primary text-center mb-8 tracking-tight">
          GAME MODE
        </h1>

        <div className="space-y-4">
          {/* Individual Versus */}
          <motion.button
            onClick={() => navigate('/host/categories', { state: { mode: 'individual' } })}
            className="w-full bg-bg-card shadow-soft rounded-2xl p-6 text-left hover:bg-bg-elevated transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">⚔️</span>
              <div>
                <h2 className="font-display text-xl text-text-primary tracking-wide">
                  INDIVIDUAL VERSUS
                </h2>
                <p className="text-text-muted text-sm mt-1">Every player for themselves</p>
              </div>
            </div>
          </motion.button>

          {/* Team Versus */}
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-6"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">👥</span>
              <div>
                <h2 className="font-display text-xl text-text-primary tracking-wide">
                  TEAM VERSUS
                </h2>
                <p className="text-text-muted text-sm mt-1">Compete as teams</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {([2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  onClick={() => setTeamCount(count)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    teamCount === count
                      ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-primary'
                      : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface'
                  }`}
                >
                  {count} Teams
                </button>
              ))}
            </div>

            <motion.button
              onClick={() =>
                navigate('/host/categories', { state: { mode: 'team', teamCount } })
              }
              className="w-full py-3 rounded-full font-display text-lg tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SELECT TEAMS
            </motion.button>
          </motion.div>
        </div>

        <motion.button
          onClick={() => navigate('/')}
          className="w-full mt-6 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </motion.button>
      </motion.div>
    </div>
  );
}
