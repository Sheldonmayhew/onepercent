import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { useTimer } from '../hooks/useTimer';
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header above card */}
            <div className="flex items-start justify-between mb-1">
              <span className="font-display text-sm font-bold text-text-secondary uppercase tracking-wider">
                Round {round.index + 1} of {round.totalRounds}
              </span>
              <span className="inline-flex items-center gap-2 bg-bg-card shadow-soft rounded-full px-3 py-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: playerColour }} />
                <span className="text-sm font-medium text-text-primary">{playerName}'s turn</span>
              </span>
            </div>
            <p className="font-display text-2xl font-bold italic text-neon-purple mb-3">
              Worth R{round.points.toLocaleString('en-ZA')}
            </p>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-5">
              {Array.from({ length: round.totalRounds }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i < round.index
                      ? 'flex-1 bg-neon-cyan'
                      : i === round.index
                        ? 'flex-[1.5] bg-neon-cyan'
                        : 'flex-1 bg-bg-elevated'
                  }`}
                />
              ))}
            </div>

            {/* Card */}
            <div className="bg-bg-card shadow-soft-md rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                {round.categoryName && (
                  <span className="inline-block px-3 py-1 rounded-full bg-bg-elevated text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    {round.categoryName}
                  </span>
                )}
                {timerStarted && (
                  <span className={`inline-flex items-center gap-1.5 font-score text-xl font-bold tabular-nums ${
                    timeLeft <= 3 ? 'text-neon-pink animate-timer-pulse' : timeLeft <= 5 ? 'text-neon-gold' : 'text-neon-cyan'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                    </svg>
                    {timeLeft}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-text-primary leading-snug text-left">
                {round.question.question}
              </p>
              {round.question.image_url && (
                <img
                  src={round.question.image_url}
                  alt="Question visual"
                  className="mt-3 rounded-xl max-h-48 mx-auto object-contain"
                />
              )}
              {timerStarted && (
                <div className="mt-5">
                  <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-colors duration-300 ${
                        timeLeft <= 3 ? 'bg-neon-pink' : 'bg-neon-gold'
                      }`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.3, ease: 'linear' }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between mt-1.5">
                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Time Remaining</span>
                    <span className="text-xs font-score font-medium text-text-muted tabular-nums">{timeLeft}s</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

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
