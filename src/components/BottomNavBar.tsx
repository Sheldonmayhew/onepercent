import React from 'react';
import { motion } from 'framer-motion';

export type NavTab = 'play' | 'host' | 'join' | 'tv' | 'profile';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

/* ── Icon components — use className for responsive sizing ── */

const PlayIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const HostIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const JoinIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const TvIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);

const ProfileIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const tabs: { id: NavTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'play',    label: 'PLAY',    Icon: PlayIcon },
  { id: 'host',    label: 'HOST',    Icon: HostIcon },
  { id: 'join',    label: 'JOIN',    Icon: JoinIcon },
  { id: 'tv',      label: 'TV MODE', Icon: TvIcon },
  { id: 'profile', label: 'PROFILE', Icon: ProfileIcon },
];

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-bg-card/95 backdrop-blur-md border-t border-outline-variant/10 safe-area-bottom z-40">
      <div className="flex items-center justify-around h-16 md:h-18 lg:h-20 max-w-5xl mx-auto px-2 md:px-6 lg:px-8">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <motion.button
              key={id}
              onClick={() => onTabChange(id)}
              className="relative flex flex-col items-center justify-center min-w-[48px] md:min-w-[64px] lg:min-w-[72px] py-1"
              whileTap={{ scale: 0.92 }}
            >
              {isActive ? (
                <motion.div
                  layoutId="navPill"
                  className="flex items-center gap-1.5 md:gap-2 bg-primary rounded-full px-4 md:px-5 lg:px-6 py-2 md:py-2.5"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                >
                  <span className="text-white"><Icon className="w-[18px] h-[18px] md:w-5 md:h-5 lg:w-6 lg:h-6" /></span>
                  <span className="text-[10px] md:text-xs lg:text-sm font-bold tracking-wide text-white whitespace-nowrap">{label}</span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-0.5 md:gap-1 text-text-muted hover:text-text-secondary transition-colors">
                  <Icon className="w-[18px] h-[18px] md:w-5 md:h-5 lg:w-6 lg:h-6" />
                  <span className="text-[9px] md:text-[11px] lg:text-xs font-semibold tracking-wider whitespace-nowrap">{label}</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
