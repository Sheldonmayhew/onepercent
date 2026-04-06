import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../stores/profileStore';
import ProfileScreen from '../components/Profile/ProfileScreen';
import HistoryScreen from '../components/History/HistoryScreen';
import BottomNavBar from '../components/BottomNavBar';

export function Component() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const [tab, setTab] = useState<'home' | 'leaderboard' | 'profile'>('home');

  if (tab === 'leaderboard') {
    return (
      <>
        <HistoryScreen key="history" onClose={() => setTab('home')} />
        <BottomNavBar activeTab={tab} onTabChange={setTab} />
      </>
    );
  }
  if (tab === 'profile') {
    return (
      <>
        <ProfileScreen key="profile" onClose={() => setTab('home')} />
        <BottomNavBar activeTab={tab} onTabChange={setTab} />
      </>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary pb-24">
      <motion.div
        className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Top Bar */}
        <div className="flex items-center gap-2 mb-8">
          {profile && <span className="text-2xl">{profile.avatar}</span>}
          <h1 className="font-display text-2xl text-text-primary leading-none tracking-tight">
            The 1% Club
          </h1>
        </div>

        {/* Spacer to center CTAs */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            className="w-full max-w-sm space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Quick Play */}
            <motion.button
              onClick={() => navigate('/quick-play/categories')}
              className="w-full py-5 rounded-2xl font-display text-2xl tracking-wider bg-neon-gold text-text-primary shadow-gold flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              QUICK PLAY
            </motion.button>

            {/* Host */}
            <motion.button
              onClick={() => navigate('/host/mode')}
              className="w-full py-5 rounded-2xl font-display text-2xl tracking-wider bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              HOST
            </motion.button>

            {/* Join */}
            <motion.button
              onClick={() => navigate('/join')}
              className="w-full py-5 rounded-2xl font-display text-2xl tracking-wider bg-bg-card text-neon-cyan shadow-soft hover:bg-bg-elevated transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              JOIN
            </motion.button>

            {/* TV Mode */}
            <motion.button
              onClick={() => navigate('/tv')}
              className="w-full py-3 rounded-xl font-display text-sm tracking-wider text-text-muted hover:text-neon-cyan transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v14z" />
              </svg>
              TV MODE
            </motion.button>
          </motion.div>
        </div>

        {/* How to Play */}
        <HowToPlay />
      </motion.div>
      <BottomNavBar activeTab={tab} onTabChange={setTab} />
    </div>
  );
}

function HowToPlay() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-auto pb-4">
      <motion.button
        onClick={() => setOpen(!open)}
        className="text-text-secondary hover:text-neon-cyan transition-colors text-sm underline underline-offset-4"
      >
        {open ? 'Hide rules' : 'How to play'}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mt-4 bg-bg-card shadow-soft rounded-2xl p-6 text-left text-sm text-text-secondary leading-relaxed"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <h3 className="font-display text-xl text-text-primary tracking-wide mb-3">THE RULES</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>Questions go from <span className="text-neon-green font-medium">90%</span> (easiest) down to <span className="text-neon-pink font-medium">1%</span> (hardest).</li>
              <li>The percentage = how many people in SA could solve it.</li>
              <li>All players answer each question. Get it right? <span className="text-neon-green font-medium">Earn points!</span></li>
              <li>Points increase as questions get harder. The highest score wins.</li>
              <li>No trivia! Every question is solvable through <span className="text-neon-cyan font-medium">logic and reasoning</span> alone.</li>
              <li>There are 11 rounds per game.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
