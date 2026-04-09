// src/components/GameShowOverlay/AudioSettings.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOverlayStore } from '../../stores/overlayStore';

export default function AudioSettings() {
  const [open, setOpen] = useState(false);
  const {
    masterVolume, setMasterVolume,
    musicEnabled, setMusicEnabled,
    crowdEnabled, setCrowdEnabled,
    hostVoiceEnabled, setHostVoiceEnabled,
  } = useOverlayStore();

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        title="Audio Settings"
      >
        {musicEnabled || crowdEnabled || hostVoiceEnabled ? '🔊' : '🔇'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-12 right-0 bg-bg-secondary/95 backdrop-blur-md border border-white/10 rounded-xl p-4 w-64 shadow-2xl"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-xs font-display tracking-[0.2em] text-white/50 mb-3">
              AUDIO SETTINGS
            </p>

            {/* Master Volume */}
            <label className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/80">Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-24 accent-neon-cyan"
              />
            </label>

            {/* Toggles */}
            {[
              { label: 'Music', value: musicEnabled, set: setMusicEnabled },
              { label: 'Crowd Reactions', value: crowdEnabled, set: setCrowdEnabled },
              { label: 'Host Voice', value: hostVoiceEnabled, set: setHostVoiceEnabled },
            ].map(({ label, value, set }) => (
              <label
                key={label}
                className="flex items-center justify-between py-1.5 cursor-pointer"
              >
                <span className="text-sm text-white/80">{label}</span>
                <button
                  onClick={() => set(!value)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    value ? 'bg-neon-cyan' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                      value ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
