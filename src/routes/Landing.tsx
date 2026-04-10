import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../stores/profileStore';
import ProfileScreen from '../components/Profile/ProfileScreen';
import BottomNavBar from '../components/BottomNavBar';
import { useNavTabs } from '../hooks/useNavTabs';

export function Component() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const { showProfile, handleTabChange, closeProfile } = useNavTabs('play');

  if (showProfile) {
    return (
      <>
        <ProfileScreen key="profile" onClose={closeProfile} />
        <BottomNavBar activeTab="profile" onTabChange={handleTabChange} />
      </>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary pb-20">
      <motion.div
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 lg:pt-14 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Top Bar */}
        <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-10 lg:mb-12">
          {profile && <span className="text-2xl md:text-3xl lg:text-4xl">{profile.avatar}</span>}
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-text-primary leading-none tracking-tight">
            The 1% Club
          </h1>
          <div className="ml-auto">
            <HowToPlay />
          </div>
        </div>

        {/* CTAs — stacked on mobile, 2-column grid on tablet+  */}
        <motion.div
          className="w-full flex-1 flex flex-col justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/*
            Mobile:  single column, all cards stacked
            md+:     2-column grid — Quick Play spans left column full height,
                     Host/Join/TV stack on the right
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-5">

            {/* Quick Play — hero card, spans full height on md+ */}
            <motion.button
              onClick={() => navigate('/quick-play/categories')}
              className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#4a6cf7] via-[#3b5de7] to-[#2a4bd9] px-6 lg:px-8 pt-5 lg:pt-8 pb-6 lg:pb-8 text-left shadow-primary md:row-span-2 md:flex md:flex-col md:justify-between"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div>
                <span className="absolute top-5 right-5 lg:top-8 lg:right-8 text-[11px] lg:text-xs font-semibold tracking-widest text-white/60 uppercase">
                  Single Player
                </span>
                <div className="mb-10 md:mb-0 flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-2xl bg-white/20">
                  <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="md:mt-auto">
                <h2 className="font-display text-[28px] lg:text-4xl font-extrabold tracking-wide text-white leading-none">QUICK PLAY</h2>
                <p className="text-sm lg:text-base italic text-white/60 mt-1.5">Jump into the action instantly</p>
              </div>
            </motion.button>

            {/* Host + Join — side-by-side always */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <motion.button
                onClick={() => navigate('/host/mode')}
                className="relative rounded-3xl bg-bg-elevated px-4 sm:px-5 lg:px-6 pt-5 lg:pt-6 pb-4 lg:pb-5 text-left"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="mb-8 lg:mb-10 flex h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-2xl bg-outline-variant/25">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-outline" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="font-display text-lg sm:text-xl lg:text-2xl font-bold tracking-wide text-text-primary leading-none">Host</h3>
                <p className="text-[10px] lg:text-xs text-text-muted mt-1 uppercase tracking-widest font-medium">
                  Lead the room
                </p>
              </motion.button>

              <motion.button
                onClick={() => navigate('/join')}
                className="relative rounded-3xl bg-neon-gold px-4 sm:px-5 lg:px-6 pt-5 lg:pt-6 pb-4 lg:pb-5 text-left"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="mb-8 lg:mb-10 flex h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-2xl bg-secondary/15">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <h3 className="font-display text-lg sm:text-xl lg:text-2xl font-bold tracking-wide text-text-primary leading-none">Join</h3>
                <p className="text-[10px] lg:text-xs text-text-muted mt-1 uppercase tracking-widest font-medium">
                  Enter code
                </p>
              </motion.button>
            </div>

            {/* TV Mode */}
            <motion.button
              onClick={() => navigate('/tv')}
              className="w-full flex items-center gap-4 rounded-3xl bg-bg-card px-5 lg:px-6 py-4 lg:py-5 shadow-soft"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-11 w-11 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-2xl bg-tertiary-container/20">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v14z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-display text-base lg:text-lg font-bold tracking-wide text-text-primary leading-none">TV MODE</h3>
                <p className="text-xs lg:text-sm text-text-muted mt-1">Cast to your big screen</p>
              </div>
              <svg className="w-5 h-5 text-text-muted/50" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </motion.div>

      </motion.div>
      <BottomNavBar activeTab="play" onTabChange={handleTabChange} />
    </div>
  );
}

function HowToPlay() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        className="text-text-muted hover:text-neon-cyan transition-colors text-sm md:text-base lg:text-lg font-medium"
        whileTap={{ scale: 0.95 }}
      >
        {open ? 'Close' : 'How to play'}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="bg-bg-card shadow-soft-lg rounded-2xl p-6 text-left text-sm text-text-secondary leading-relaxed max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
