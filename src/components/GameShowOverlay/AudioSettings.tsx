import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOverlayStore } from '../../stores/overlayStore';
import { musicManager } from './Audio/MusicManager';

export default function AudioSettings() {
  const [open, setOpen] = useState(false);
  const {
    masterVolume, setMasterVolume,
    musicEnabled, setMusicEnabled,
    crowdEnabled, setCrowdEnabled,
    hostVoiceEnabled, setHostVoiceEnabled,
  } = useOverlayStore();

  const handleMusicToggle = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    if (!next) musicManager.stop();
  };

  const toggles = [
    { label: 'Music', value: musicEnabled, toggle: handleMusicToggle },
    { label: 'Crowd Reactions', value: crowdEnabled, toggle: () => setCrowdEnabled(!crowdEnabled) },
    { label: 'Host Voice', value: hostVoiceEnabled, toggle: () => setHostVoiceEnabled(!hostVoiceEnabled) },
  ];

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)',
        }}
        title="Audio Settings"
      >
        {musicEnabled || crowdEnabled || hostVoiceEnabled ? '🔊' : '🔇'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-12 right-0 rounded-xl p-4 w-72 shadow-2xl"
            style={{
              background: 'rgba(20,20,30,0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <p
              className="text-xs font-bold tracking-widest mb-4"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              AUDIO SETTINGS
            </p>

            {/* Master Volume */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Volume
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="w-24"
                  style={{ accentColor: '#22d3ee' }}
                />
                <span className="text-xs w-8 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {Math.round(masterVolume * 100)}%
                </span>
              </div>
            </div>

            {/* Toggles */}
            {toggles.map(({ label, value, toggle }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={toggle}
              >
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {label}
                </span>
                <div
                  className="w-11 h-6 rounded-full relative transition-colors"
                  style={{
                    background: value ? '#22d3ee' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full absolute top-0.5 transition-transform"
                    style={{
                      background: '#fff',
                      transform: value ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
