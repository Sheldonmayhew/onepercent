import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { useTimer } from '../hooks/useTimer';
import Timer from '../components/Game/Timer';
import AnswerInput from '../components/Game/AnswerInput';

const CURRENT_ROUTE = '/player/play';

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect, sendAnswer } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  const me = gameState?.players.find((p) => p.id === playerId);
  const others = gameState?.players.filter((p) => p.id !== playerId) ?? [];
  const round = gameState?.round;
  const timerStarted = gameState?.timerStarted ?? false;

  const lockedIn = useRef(false);
  const timerDuration = round?.timerDuration ?? 30;

  const { timeLeft, progress, start } = useTimer({
    duration: timerDuration,
    autoStart: false,
  });

  // Start timer when host signals timerStarted
  useEffect(() => {
    if (timerStarted) {
      start();
    }
  }, [timerStarted, start]);

  // Navigate when host broadcasts a new route
  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const handleAnswer = (answer: string | number) => {
    if (lockedIn.current || !playerId) return;
    lockedIn.current = true;
    sendAnswer(playerId, answer);
  };

  const handleLeave = () => {
    disconnect();
    mpReset();
    navigate('/', { replace: true });
  };

  const isLockedIn = me?.hasAnswered ?? lockedIn.current;

  // Determine player colour (fallback to first player colour if missing)
  const playerColour = me?.colour ?? '#4F46E5';

  return (
    <motion.div
      className="min-h-dvh flex flex-col bg-bg-primary px-4 pt-6 pb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {me && <span className="text-2xl">{me.avatar}</span>}
          <div>
            <p className="font-medium text-text-primary text-sm">{playerName}</p>
            {me && (
              <p className="text-xs text-neon-gold font-score">
                R{me.score.toLocaleString('en-ZA')}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="text-xs text-text-muted hover:text-neon-pink transition-colors px-3 py-1.5 rounded-lg bg-bg-card"
        >
          LEAVE
        </button>
      </div>

      <div className="w-full max-w-lg mx-auto flex flex-col gap-5 flex-1">
        {/* Question card */}
        {round && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-display text-2xl font-bold"
                style={{ color: '#22C55E' }}
              >
                {round.difficulty}%
              </span>
              <span className="text-text-muted text-sm">
                Round {round.index + 1}/{round.totalRounds}
              </span>
              <span className="font-score text-sm text-neon-gold">
                R{round.points.toLocaleString('en-ZA')}
              </span>
            </div>
            <p className="text-lg font-medium text-text-primary leading-relaxed">
              {round.question.question}
            </p>
            {round.question.image_url && (
              <img
                src={round.question.image_url}
                alt="Question visual"
                className="mt-3 rounded-xl max-h-48 mx-auto object-contain"
              />
            )}
          </motion.div>
        )}

        {/* Timer */}
        {timerStarted && <Timer timeLeft={timeLeft} progress={progress} />}

        {/* Other players' status */}
        {others.length > 0 && (
          <div>
            <p className="text-xs text-text-muted tracking-[0.12em] uppercase mb-2">Players</p>
            <div className="flex flex-wrap gap-2">
              {others.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm border ${
                    p.hasAnswered
                      ? 'bg-neon-green/10 border-neon-green/20'
                      : 'bg-bg-card border-transparent shadow-soft'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span className="text-text-primary font-medium">{p.name}</span>
                  {p.hasAnswered && (
                    <span className="text-neon-green text-xs">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer input or locked-in state */}
        {!timerStarted && !isLockedIn && (
          <motion.div
            className="flex items-center justify-center gap-3 py-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <div className="w-2 h-2 rounded-full bg-neon-cyan" />
            <p className="text-text-muted text-sm">Waiting for host to start…</p>
          </motion.div>
        )}

        {timerStarted && !isLockedIn && round && (
          <AnswerInput
            key={`player-${round.index}`}
            question={{
              id: `round-${round.index}`,
              difficulty: round.difficulty,
              type: round.question.type,
              time_limit_seconds: round.timerDuration,
              question: round.question.question,
              options: round.question.options,
              correct_answer: 0,
              explanation: '',
              image_url: round.question.image_url,
              sequence_items: round.question.sequence_items,
            }}
            onSubmit={handleAnswer}
            playerName={playerName ?? 'You'}
            playerColour={playerColour}
          />
        )}

        {isLockedIn && (
          <motion.div
            className="flex flex-col items-center gap-3 py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-14 h-14 rounded-full bg-neon-green/20 border-2 border-neon-green/40 flex items-center justify-center">
              <span className="text-2xl text-neon-green">✓</span>
            </div>
            <p className="font-display text-xl tracking-wide text-neon-green">LOCKED IN</p>
            <p className="text-text-muted text-sm text-center">
              Waiting for other players…
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
