import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useHostMultiplayer } from '../hooks/useMultiplayer';
import { useProfileStore } from '../stores/profileStore';
import type { MultiplayerMode } from '../types';
import { TEAM_NAMES, TEAM_COLOURS } from '../types';
import { generateId } from '../utils/helpers';

function CategoryIcon({ name, className = 'w-6 h-6' }: { name: string; className?: string }) {
  const props = { className, fill: 'none', viewBox: '0 0 24 24', strokeWidth: 2, stroke: 'currentColor' } as const;
  switch (name) {
    case 'science':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M5 14.5l-.94 2.06a2.25 2.25 0 001.53 3.19l.19.035a26.867 26.867 0 0012.44 0l.19-.035a2.25 2.25 0 001.53-3.19L19 14.5" /></svg>;
    case 'history':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'sport':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-3.77 1.522m3.77-1.522a48.11 48.11 0 01-3.77 1.522m0 0a48.11 48.11 0 01-3.77-1.522" /></svg>;
    case 'geo':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.73-3.563" /></svg>;
    case 'entertainment':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125M18 12H6.375m12 0c.621 0 1.125-.504 1.125-1.125M18 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125M19.125 12c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125" /></svg>;
    case 'food':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" /></svg>;
    case 'nature':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
    case 'tech':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>;
    case 'math':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>;
    case 'language':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138A47.63 47.63 0 0115 5.621m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>;
    case 'art':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>;
    case 'brain':
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
    default:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
  }
}

const CATEGORY_THEMES: Record<string, { gradient: string; iconKey: string; description: string }> = {
  science:       { gradient: 'from-emerald-400 to-teal-600',     iconKey: 'science',       description: 'Explore the wonders of discovery.' },
  history:       { gradient: 'from-amber-400 to-orange-600',     iconKey: 'history',       description: 'Ancient civilizations to modern wonders.' },
  sport:         { gradient: 'from-red-400 to-rose-600',         iconKey: 'sport',         description: 'Goals, records, and legendary moments.' },
  geo:           { gradient: 'from-sky-400 to-blue-600',         iconKey: 'geo',           description: 'Countries, capitals, and landmarks.' },
  entertainment: { gradient: 'from-fuchsia-400 to-pink-600',     iconKey: 'entertainment', description: 'Movies, music, and pop culture.' },
  food:          { gradient: 'from-orange-400 to-red-500',       iconKey: 'food',          description: 'Cuisines, flavours, and kitchen lore.' },
  nature:        { gradient: 'from-lime-400 to-green-600',       iconKey: 'nature',        description: 'Wildlife, ecosystems, and the great outdoors.' },
  tech:          { gradient: 'from-cyan-400 to-blue-600',        iconKey: 'tech',          description: 'Gadgets, code, and innovation.' },
  math:          { gradient: 'from-violet-400 to-purple-600',    iconKey: 'math',          description: 'Numbers, patterns, and puzzles.' },
  language:      { gradient: 'from-indigo-400 to-blue-600',      iconKey: 'language',      description: 'Words, grammar, and expressions.' },
  art:           { gradient: 'from-pink-400 to-rose-600',        iconKey: 'art',           description: 'Masterpieces, styles, and creators.' },
  brain:         { gradient: 'from-purple-400 to-indigo-600',    iconKey: 'brain',         description: 'Logic, riddles, and lateral thinking.' },
  default:       { gradient: 'from-slate-400 to-slate-600',      iconKey: 'default',       description: 'Test your knowledge.' },
};

function getCategoryTheme(name: string) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(CATEGORY_THEMES)) {
    if (key !== 'default' && lower.includes(key)) return CATEGORY_THEMES[key];
  }
  if (lower.includes('music') || lower.includes('pop')) return CATEGORY_THEMES.entertainment;
  if (lower.includes('cook')) return CATEGORY_THEMES.food;
  if (lower.includes('animal')) return CATEGORY_THEMES.nature;
  if (lower.includes('computer')) return CATEGORY_THEMES.tech;
  if (lower.includes('number')) return CATEGORY_THEMES.math;
  if (lower.includes('word')) return CATEGORY_THEMES.language;
  if (lower.includes('logic')) return CATEGORY_THEMES.brain;
  return CATEGORY_THEMES.default;
}

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const { availablePacks, initQuickPlay, initHostGame, addPlayer, startGame } = useGameStore();
  const { createRoom } = useHostMultiplayer();
  const profile = useProfileStore((s) => s.profile);

  const isQuickPlay = location.pathname.startsWith('/quick-play');
  const locationState = location.state as { mode?: MultiplayerMode; teamCount?: 2 | 3 | 4 } | null;
  const mode = locationState?.mode ?? 'individual';
  const teamCount = locationState?.teamCount ?? 2;

  const [selectedPacks, setSelectedPacks] = useState<string[]>(
    availablePacks.length > 0 ? [availablePacks[0].pack_id] : []
  );

  const allSelected = availablePacks.length > 0 && selectedPacks.length === availablePacks.length;

  const togglePack = (packId: string) => {
    setSelectedPacks((prev) => {
      const isSelected = prev.includes(packId);
      // Always keep at least one pack selected
      if (isSelected && prev.length <= 1) return prev;
      return isSelected ? prev.filter((id) => id !== packId) : [...prev, packId];
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPacks(availablePacks.length > 0 ? [availablePacks[0].pack_id] : []);
    } else {
      setSelectedPacks(availablePacks.map((p) => p.pack_id));
    }
  };

  const totalQuestions = availablePacks
    .filter((p) => selectedPacks.includes(p.pack_id))
    .reduce((sum, p) => sum + p.question_count, 0);

  const handleQuickPlay = () => {
    const packs = selectedPacks.length > 0 ? selectedPacks : availablePacks.slice(0, 1).map((p) => p.pack_id);
    initQuickPlay(packs);
    addPlayer(profile?.name ?? 'Player', profile?.avatar);
    startGame();
    navigate('/quick-play/round-intro');
  };

  const handleHost = async () => {
    const packs = selectedPacks.length > 0 ? selectedPacks : availablePacks.slice(0, 1).map((p) => p.pack_id);
    initHostGame(mode, packs);

    // If team mode with more than 2 teams, regenerate teams with the correct count
    if (mode === 'team' && teamCount > 2) {
      const store = useGameStore.getState();
      if (store.session) {
        const teams = Array.from({ length: teamCount }, (_, i) => ({
          id: generateId(),
          name: TEAM_NAMES[i],
          colour: TEAM_COLOURS[i],
          playerIds: [] as string[],
          score: 0,
        }));
        useGameStore.setState({
          session: {
            ...store.session,
            teams,
            settings: { ...store.session.settings, teamCount },
          },
        });
      }
    }

    await createRoom();
    navigate('/host/lobby');
  };

  const handleBack = () => {
    if (isQuickPlay) {
      navigate('/');
    } else {
      navigate('/host/mode');
    }
  };

  const title = isQuickPlay ? 'QUICK PLAY' : 'SELECT PACKS';

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary pb-24">
      <motion.div
        className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display text-3xl text-text-primary text-center mb-6 tracking-tight">
          {title}
        </h1>

        {/* Pack grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-text-primary tracking-wide">Categories</h2>
            <button
              onClick={toggleAll}
              className="text-xs text-neon-cyan font-medium hover:text-neon-purple transition-colors"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {availablePacks.map((pack) => {
              const isSelected = selectedPacks.includes(pack.pack_id);
              const theme = getCategoryTheme(pack.name);
              return (
                <motion.button
                  key={pack.pack_id}
                  onClick={() => togglePack(pack.pack_id)}
                  className={`relative overflow-hidden rounded-3xl text-left transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-white shadow-soft-lg scale-[1.02]' : 'opacity-70'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Gradient background */}
                  <div className={`bg-gradient-to-br ${theme.gradient} p-4 pb-5 min-h-[160px] flex flex-col justify-between`}>
                    {/* Icon */}
                    <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                      <CategoryIcon name={theme.iconKey} />
                    </span>

                    {/* Text */}
                    <div className="mt-auto">
                      <h3 className="font-display text-lg font-bold text-white leading-tight">
                        {pack.name}
                      </h3>
                      <p className="text-white/70 text-[11px] mt-0.5 leading-snug line-clamp-2">
                        {theme.description}
                      </p>
                    </div>

                    {/* Selected badge */}
                    {isSelected && (
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Selected
                      </span>
                    )}

                    {/* Watermark icon */}
                    <span className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none select-none text-white">
                      <CategoryIcon name={theme.iconKey} className="w-20 h-20" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <p className="text-xs text-text-muted mt-2">
            {totalQuestions} questions from {selectedPacks.length} pack
            {selectedPacks.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          {isQuickPlay ? (
            <motion.button
              onClick={handleQuickPlay}
              className="w-full py-4 rounded-full font-display text-2xl tracking-wider bg-neon-gold text-text-primary shadow-gold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              START
            </motion.button>
          ) : (
            <motion.button
              onClick={handleHost}
              className="w-full py-4 rounded-full font-display text-2xl tracking-wider bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              NEXT
            </motion.button>
          )}
        </div>

        <motion.button
          onClick={handleBack}
          className="w-full mt-4 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </motion.button>
      </motion.div>
    </div>
  );
}
