import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useHostMultiplayer } from '../../hooks/useMultiplayer';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import type { GameSettings, GameMode, TimerSpeed, EliminationRule } from '../../types';

export default function Landing() {
  const { availablePacks, createGame } = useGameStore();
  const { createRoom } = useHostMultiplayer();
  const { setRole } = useMultiplayerStore();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'classic',
    eliminationRule: 'zero_score',
    bankingEnabled: true,
    soundEnabled: true,
    timerSpeed: 'standard',
    packId: availablePacks[0]?.pack_id ?? '',
  });

  const handleStart = async () => {
    if (!settings.packId && availablePacks.length > 0) {
      settings.packId = availablePacks[0].pack_id;
    }
    createGame(settings);
    // Create multiplayer room so players can join
    await createRoom(settings);
  };

  const handleJoinMode = () => {
    setRole('player');
  };

  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-neon-cyan/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neon-gold/5 blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 text-center max-w-2xl w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="font-display text-[5rem] md:text-[7rem] leading-none tracking-tight text-neon-cyan glow-cyan mb-0">
            THE 1% CLUB
          </h1>
          <p className="font-display text-2xl md:text-3xl text-neon-gold tracking-[0.3em] uppercase mt-1">
            Game Night Edition
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-text-secondary text-lg mt-6 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          How far can your brain take you? Reason your way from 90% to 1%.
        </motion.p>

        {/* Settings Panel */}
        <motion.div
          className="bg-bg-surface/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8 text-left mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="font-display text-2xl text-text-primary tracking-wide mb-5">GAME SETUP</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Game Mode */}
            <div>
              <label className="text-sm text-text-secondary font-medium block mb-2">Game Mode</label>
              <div className="flex gap-2">
                {(['classic', 'quick', 'practice'] as GameMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSettings((s) => ({ ...s, mode }))}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium capitalize transition-all duration-200 border ${
                      settings.mode === mode
                        ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan box-glow-cyan'
                        : 'bg-bg-elevated border-white/5 text-text-secondary hover:border-white/10'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Speed */}
            <div>
              <label className="text-sm text-text-secondary font-medium block mb-2">Timer Speed</label>
              <div className="flex gap-2">
                {([
                  { value: 'relaxed' as TimerSpeed, label: '45s' },
                  { value: 'standard' as TimerSpeed, label: '30s' },
                  { value: 'pressure' as TimerSpeed, label: '15s' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSettings((s) => ({ ...s, timerSpeed: value }))}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      settings.timerSpeed === value
                        ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan box-glow-cyan'
                        : 'bg-bg-elevated border-white/5 text-text-secondary hover:border-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Pack */}
            <div>
              <label className="text-sm text-text-secondary font-medium block mb-2">Question Pack</label>
              <select
                value={settings.packId}
                onChange={(e) => setSettings((s) => ({ ...s, packId: e.target.value }))}
                className="w-full py-2.5 px-3 rounded-lg text-sm bg-bg-elevated border border-white/5 text-text-primary outline-none focus:border-neon-cyan/50 transition-colors"
              >
                {availablePacks.map((pack) => (
                  <option key={pack.pack_id} value={pack.pack_id}>
                    {pack.name} ({pack.question_count} Qs)
                  </option>
                ))}
              </select>
            </div>

            {/* Elimination Rule */}
            <div>
              <label className="text-sm text-text-secondary font-medium block mb-2">On Elimination</label>
              <div className="flex gap-2">
                {([
                  { value: 'zero_score' as EliminationRule, label: 'Lose All' },
                  { value: 'keep_last_cleared' as EliminationRule, label: 'Keep Score' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSettings((s) => ({ ...s, eliminationRule: value }))}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      settings.eliminationRule === value
                        ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan box-glow-cyan'
                        : 'bg-bg-elevated border-white/5 text-text-secondary hover:border-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles row */}
          <div className="flex gap-6 mt-5 pt-4 border-t border-white/5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.bankingEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, bankingEnabled: e.target.checked }))}
                className="accent-neon-cyan w-4 h-4"
              />
              <span className="text-sm text-text-secondary">Banking</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, soundEnabled: e.target.checked }))}
                className="accent-neon-cyan w-4 h-4"
              />
              <span className="text-sm text-text-secondary">Sound Effects</span>
            </label>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={handleStart}
            className="flex-[2] py-4 rounded-xl font-display text-2xl tracking-wider bg-gradient-to-r from-neon-cyan to-cyan-400 text-bg-deep hover:brightness-110 transition-all duration-200 box-glow-cyan"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            HOST A GAME
          </motion.button>
          <motion.button
            onClick={handleJoinMode}
            className="flex-1 py-4 rounded-xl font-display text-2xl tracking-wider bg-neon-gold/15 border border-neon-gold/40 text-neon-gold hover:bg-neon-gold/25 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            JOIN
          </motion.button>
        </motion.div>

        {/* How to Play */}
        <motion.button
          onClick={() => setShowHowToPlay(!showHowToPlay)}
          className="mt-4 text-text-secondary hover:text-neon-cyan transition-colors text-sm underline underline-offset-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {showHowToPlay ? 'Hide rules' : 'How to play'}
        </motion.button>

        <AnimatePresence>
          {showHowToPlay && (
            <motion.div
              className="mt-4 bg-bg-surface/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-left text-sm text-text-secondary leading-relaxed"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-display text-xl text-text-primary tracking-wide mb-3">THE RULES</h3>
              <ul className="space-y-2 list-disc list-inside">
                <li>Questions go from <span className="text-neon-green">90%</span> (easiest) down to <span className="text-neon-pink">1%</span> (hardest).</li>
                <li>The percentage = how many people in SA could solve it.</li>
                <li>All players answer each question. Get it wrong? <span className="text-neon-pink">You're out.</span></li>
                <li>Points increase as questions get harder. Last one standing wins the most.</li>
                <li>At certain rounds you can <span className="text-neon-gold">bank your points</span> and leave safely.</li>
                <li>No trivia! Every question is solvable through <span className="text-neon-cyan">logic and reasoning</span> alone.</li>
                <li>In <strong>Classic</strong> mode there are 11 rounds. <strong>Quick Play</strong> has 5.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
