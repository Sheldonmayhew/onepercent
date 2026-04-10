import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSpectator } from '../hooks/useSpectator';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import BottomNavBar from '../components/BottomNavBar';
import ProfileScreen from '../components/Profile/ProfileScreen';
import { useNavTabs } from '../hooks/useNavTabs';

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { connect } = useSpectator();
  const isConnected = useMultiplayerStore((s) => s.isConnected);
  const gameState = useMultiplayerStore((s) => s.gameState);
  const error = useMultiplayerStore((s) => s.error);

  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [connecting, setConnecting] = useState(false);

  const { showProfile, handleTabChange, closeProfile } = useNavTabs('tv');

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !isConnected) {
      setConnecting(true);
      connect(urlCode);
    }
  }, []);

  useEffect(() => {
    if (isConnected && gameState) {
      navigate('/tv/display', { replace: true });
    }
  }, [isConnected, gameState, navigate]);

  const handleConnect = () => {
    if (!code.trim()) return;
    setConnecting(true);
    connect(code.trim());
  };

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
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12">
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-text-primary text-center tracking-tight mb-2 md:mb-3">
          TV MODE
        </h1>
        <p className="text-text-muted text-lg md:text-xl lg:text-2xl mb-10 md:mb-14">
          Enter the room code to spectate
        </p>

        {error && (
          <p className="text-neon-pink text-sm md:text-base mb-4">{error}</p>
        )}

        <div className="flex flex-col items-center gap-5 md:gap-6 w-full max-w-sm md:max-w-xl lg:max-w-2xl">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={5}
            className="w-full text-center font-display text-5xl md:text-6xl lg:text-7xl tracking-[0.4em] bg-bg-card shadow-soft rounded-2xl md:rounded-3xl px-6 md:px-8 py-5 md:py-7 text-neon-cyan placeholder:text-text-muted/30 outline-none focus:ring-2 focus:ring-neon-cyan/40"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />

          <motion.button
            onClick={handleConnect}
            disabled={!code.trim() || connecting}
            className={`w-full py-4 md:py-5 rounded-full font-display text-xl md:text-2xl tracking-wide transition-all ${
              code.trim() && !connecting
                ? 'bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary'
                : 'bg-bg-elevated text-text-muted cursor-not-allowed'
            }`}
            whileHover={code.trim() ? { scale: 1.02 } : {}}
            whileTap={code.trim() ? { scale: 0.98 } : {}}
          >
            {connecting ? 'CONNECTING...' : 'CONNECT'}
          </motion.button>
        </div>

        {connecting && !gameState && (
          <motion.div
            className="mt-8 md:mt-12 flex items-center gap-3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-neon-cyan" />
            <p className="text-text-muted text-sm md:text-base">Waiting for host to broadcast...</p>
          </motion.div>
        )}
      </div>

      <BottomNavBar activeTab="tv" onTabChange={handleTabChange} />
    </div>
  );
}
