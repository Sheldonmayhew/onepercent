import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSpectator } from '../hooks/useSpectator';
import { useMultiplayerStore } from '../stores/multiplayerStore';

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { connect } = useSpectator();
  const isConnected = useMultiplayerStore((s) => s.isConnected);
  const gameState = useMultiplayerStore((s) => s.gameState);
  const error = useMultiplayerStore((s) => s.error);

  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [connecting, setConnecting] = useState(false);

  // Auto-connect if code is in URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !isConnected) {
      setConnecting(true);
      connect(urlCode);
    }
  }, []);

  // Navigate to display once we receive first game state
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

  return (
    <motion.div
      className="min-h-dvh flex flex-col items-center justify-center bg-bg-primary px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="font-display text-6xl text-text-primary text-center tracking-tight mb-2">
        TV MODE
      </h1>
      <p className="text-text-muted text-lg mb-10">
        Enter the room code to spectate
      </p>

      {error && (
        <p className="text-neon-pink text-sm mb-4">{error}</p>
      )}

      <div className="flex flex-col items-center gap-5 w-full max-w-sm">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ROOM CODE"
          maxLength={5}
          className="w-full text-center font-display text-5xl tracking-[0.4em] bg-bg-card shadow-soft rounded-2xl px-6 py-5 text-neon-cyan placeholder:text-text-muted/30 outline-none focus:ring-2 focus:ring-neon-cyan/40"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
        />

        <motion.button
          onClick={handleConnect}
          disabled={!code.trim() || connecting}
          className={`w-full py-4 rounded-full font-display text-xl tracking-wide transition-all ${
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
          className="mt-8 flex items-center gap-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-neon-cyan" />
          <p className="text-text-muted text-sm">Waiting for host to broadcast...</p>
        </motion.div>
      )}
    </motion.div>
  );
}
