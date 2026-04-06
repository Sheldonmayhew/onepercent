import React from 'react';
import { motion } from 'framer-motion';

export type NavTab = 'home' | 'leaderboard' | 'profile';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const tabs: { id: NavTab; label: string; icon: React.ReactElement }[] = [
    {
      id: 'home',
      label: 'HOME',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'leaderboard',
      label: 'LEADERBOARD',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'PROFILE',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-bg-card shadow-soft-md flex justify-around items-center py-2 safe-area-bottom z-40">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
              isActive
                ? 'text-neon-cyan'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="navIndicator"
                className="absolute -top-0.5 w-12 h-1 bg-neon-cyan rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative">
              {tab.icon}
            </span>
            <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-neon-cyan' : 'text-text-muted'}`}>
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
