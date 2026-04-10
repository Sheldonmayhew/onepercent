import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNavBar from '../components/BottomNavBar';
import ProfileScreen from '../components/Profile/ProfileScreen';
import { useNavTabs } from '../hooks/useNavTabs';

export function Component() {
  const navigate = useNavigate();
  const [teamCount, setTeamCount] = useState<2 | 3 | 4>(2);
  const { showProfile, handleTabChange, closeProfile } = useNavTabs('host');

  if (showProfile) {
    return (
      <>
        <ProfileScreen onClose={closeProfile} />
        <BottomNavBar activeTab="profile" onTabChange={handleTabChange} />
      </>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary pb-20">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 lg:pt-14">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-text-primary text-center tracking-tight mb-6 md:mb-10 lg:mb-12">
          GAME MODE
        </h1>

        <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto space-y-4 md:space-y-6">
          {/* Individual Versus */}
          <motion.button
            onClick={() => navigate('/host/categories', { state: { mode: 'individual' } })}
            className="w-full bg-bg-card shadow-soft rounded-2xl md:rounded-3xl p-6 md:p-8 text-left hover:bg-bg-elevated transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4 md:gap-5">
              <span className="text-4xl md:text-5xl">⚔️</span>
              <div>
                <h2 className="font-display text-xl md:text-2xl lg:text-3xl text-text-primary tracking-wide">INDIVIDUAL VERSUS</h2>
                <p className="text-text-muted text-sm md:text-base mt-1">Every player for themselves</p>
              </div>
            </div>
          </motion.button>

          {/* Team Versus */}
          <motion.div className="bg-bg-card shadow-soft rounded-2xl md:rounded-3xl p-6 md:p-8" whileHover={{ scale: 1.01 }}>
            <div className="flex items-center gap-4 md:gap-5 mb-4 md:mb-6">
              <span className="text-4xl md:text-5xl">👥</span>
              <div>
                <h2 className="font-display text-xl md:text-2xl lg:text-3xl text-text-primary tracking-wide">TEAM VERSUS</h2>
                <p className="text-text-muted text-sm md:text-base mt-1">Compete as teams</p>
              </div>
            </div>

            <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
              {([2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  onClick={() => setTeamCount(count)}
                  className={`flex-1 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-medium transition-all ${
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
              onClick={() => navigate('/host/categories', { state: { mode: 'team', teamCount } })}
              className="w-full py-3 md:py-4 rounded-full font-display text-lg md:text-xl tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              SELECT TEAMS
            </motion.button>
          </motion.div>
        </div>
      </div>

      <BottomNavBar activeTab="host" onTabChange={handleTabChange} />
    </div>
  );
}
