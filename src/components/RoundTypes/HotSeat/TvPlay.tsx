import { motion } from 'framer-motion';
import { useTimer } from '../../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvPlayProps } from '../../../roundTypes/types';
import type { HotSeatState } from '../../../roundTypes/definitions/hotSeat';

export default function TvPlay({
  question,
  players,
  roundState,
  timerStarted,
  roundIndex,
  difficulty,
  points,
}: TvPlayProps) {
  const diffColour = getDifficultyColour(difficulty);
  const { timeLeft, progress } = useTimer({
    duration: question.time_limit_seconds,
    autoStart: timerStarted,
  });

  const state = roundState as HotSeatState;
  const hotSeatOrder: string[] = state?.hotSeatOrder ?? [];
  const currentIndex: number = state?.currentHotSeatIndex ?? 0;
  const activePlayerId = hotSeatOrder[currentIndex];
  const activePlayer = players.find((p) => p.id === activePlayerId);
  const otherPlayers = players.filter((p) => p.id !== activePlayerId);

  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  // Circular timer calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Spotlight gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(253,212,4,0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold text-text-secondary uppercase tracking-wider">
            Round {roundIndex + 1}
          </span>
          <span className="text-2xl">🔥</span>
          <span className="font-display text-sm font-bold text-neon-gold uppercase tracking-wider">
            Hot Seat
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-bold" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">{formatRands(points)}</span>
        </div>
      </div>

      {/* Question above spotlight */}
      <div className="px-6 relative z-10">
        <motion.div
          className="bg-bg-card/80 backdrop-blur rounded-2xl p-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {question.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
              {question.category}
            </span>
          )}
          <p className="text-xl md:text-2xl font-bold text-text-primary leading-snug text-center">
            {question.question}
          </p>

          {question.options && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {question.options.map((option, idx) => (
                <div
                  key={idx}
                  className="flex items-center py-3 px-4 rounded-xl bg-bg-elevated/80 text-text-primary"
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-container/20 text-neon-cyan text-sm font-bold mr-3 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base font-medium">{option}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Center stage — active player spotlight */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {activePlayer && (
          <motion.div
            className="flex flex-col items-center"
            key={activePlayer.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          >
            {/* Circular timer around avatar */}
            <div className="relative">
              <svg className="w-40 h-40" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke={isCritical ? '#FF4D8D' : isUrgent ? '#FDD204' : '#00E5FF'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 60 60)"
                  transition={{ duration: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  className="text-8xl"
                  animate={{
                    filter: [
                      'drop-shadow(0 0 8px rgba(253,212,4,0.3))',
                      'drop-shadow(0 0 20px rgba(253,212,4,0.6))',
                      'drop-shadow(0 0 8px rgba(253,212,4,0.3))',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {activePlayer.avatar}
                </motion.span>
              </div>
            </div>

            <motion.p
              className="font-display text-2xl text-neon-gold tracking-wider mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {activePlayer.name}
            </motion.p>

            <motion.span
              className={`font-score text-3xl font-bold mt-2 tabular-nums ${
                isCritical ? 'text-neon-pink' : isUrgent ? 'text-neon-gold' : 'text-neon-cyan'
              }`}
              animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {timeLeft}s
            </motion.span>
          </motion.div>
        )}
      </div>

      {/* Bottom row — other players dimmed */}
      <div className="flex items-center justify-center gap-4 px-6 py-6 relative z-10">
        {otherPlayers.map((player) => (
          <motion.div
            key={player.id}
            className="flex flex-col items-center opacity-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
          >
            <span className="text-3xl">{player.avatar}</span>
            <span className="text-xs text-text-muted mt-1 truncate max-w-[60px]">
              {player.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
