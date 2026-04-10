import { motion } from 'framer-motion';
import { useTimer } from '../../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../../utils/helpers';
import type { TvPlayProps } from '../../../roundTypes/types';
import type { SwitchagoriesState } from '../../../roundTypes/definitions/switchagories';

const CATEGORY_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
];

export default function TvPlay({
  question,
  players,
  roundState,
  timerStarted,
  allAnswersIn,
  roundIndex,
  difficulty,
  points,
}: TvPlayProps) {
  const state = roundState as SwitchagoriesState;
  const diffColour = getDifficultyColour(difficulty);
  const phase: 'picking' | 'answering' = state?.phase ?? 'picking';
  const categories = state?.packOptions ?? [];
  const pickerPlayer = players.find((p) => p.id === state?.pickerPlayerId);
  const { timeLeft, progress } = useTimer({
    duration: question.time_limit_seconds,
    autoStart: timerStarted,
  });

  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold text-text-secondary uppercase tracking-wider">
            Round {roundIndex + 1}
          </span>
          <span className="text-2xl">🎯</span>
          <span className="font-display text-sm font-bold text-purple-400 uppercase tracking-wider">
            Switchagories
          </span>
          {phase === 'picking' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 font-medium">
              Picking
            </span>
          )}
          {phase === 'answering' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan font-medium">
              Answering
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-bold" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">{formatRands(points)}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="px-6">
        <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors duration-300 ${
              isCritical ? 'bg-neon-pink' : isUrgent ? 'bg-neon-gold' : 'bg-purple-400'
            }`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">Time</span>
          <span
            className={`font-score text-sm font-bold tabular-nums ${
              isCritical ? 'text-neon-pink' : isUrgent ? 'text-neon-gold' : 'text-purple-400'
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 px-6 py-6 gap-6">
        <div className="flex-1">
          {/* Picking phase: show picker and category grid */}
          {phase === 'picking' && (
            <motion.div
              className="bg-bg-card shadow-soft rounded-3xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Picker spotlight */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {pickerPlayer && (
                  <span
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: pickerPlayer.colour }}
                  />
                )}
                <h3 className="font-display text-lg text-purple-400 uppercase tracking-wider text-center">
                  {pickerPlayer?.name ?? 'Player'}&apos;s Turn to Pick
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat: string, idx: number) => {
                  const gradient = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  const isChosen = state?.categoryPick === cat;

                  return (
                    <motion.div
                      key={cat}
                      className={`relative py-8 px-6 rounded-2xl bg-gradient-to-br ${gradient} text-white text-center ${
                        isChosen ? 'ring-4 ring-white/60 shadow-lg scale-105' : ''
                      } ${state?.categoryPick && !isChosen ? 'opacity-40' : ''}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: state?.categoryPick && !isChosen ? 0.4 : 1, scale: isChosen ? 1.05 : 1 }}
                      transition={{ delay: idx * 0.1 + 0.2 }}
                    >
                      <span className="font-display text-xl font-bold">{cat}</span>
                      {isChosen && (
                        <motion.span
                          className="block text-sm mt-2 text-white/80"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          Selected!
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Answering phase: question with category badge */}
          {phase === 'answering' && (
            <motion.div
              className="bg-bg-card shadow-soft rounded-3xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {question.category && (
                <span className="inline-block px-3 py-1 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
                  {question.category}
                </span>
              )}
              <p className="text-2xl md:text-3xl font-bold text-text-primary leading-snug mb-6">
                {question.question}
              </p>

              {question.image_url && (
                <img
                  src={question.image_url}
                  alt="Question visual"
                  className="rounded-xl max-h-64 mx-auto object-contain mb-6"
                />
              )}

              {question.options && (
                <div className="grid grid-cols-2 gap-4">
                  {question.options.map((option, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center py-4 px-5 rounded-2xl bg-bg-elevated text-text-primary"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 + 0.3 }}
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-400/20 text-purple-400 text-sm font-bold mr-3 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-lg font-medium">{option}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Player sidebar */}
        <div className="w-72 shrink-0">
          <div className="bg-bg-card shadow-soft rounded-2xl p-4">
            <h3 className="font-display text-sm text-text-muted uppercase tracking-wider mb-3">
              Players
            </h3>
            <div className="space-y-2">
              {players.map((player) => {
                const isCurrentPicker = player.id === state?.pickerPlayerId;

                return (
                  <motion.div
                    key={player.id}
                    className={`flex items-center gap-2 py-2 px-3 rounded-xl ${
                      isCurrentPicker && phase === 'picking'
                        ? 'bg-purple-400/15 ring-1 ring-purple-400/30'
                        : 'bg-bg-elevated'
                    }`}
                    animate={player.hasAnswered ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: player.colour }}
                    />
                    <span className="text-sm text-text-primary font-medium flex-1 truncate">
                      {player.name}
                    </span>

                    {/* Picker badge */}
                    {isCurrentPicker && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-300 font-medium">
                        Picker
                      </span>
                    )}

                    {/* Status */}
                    {phase === 'picking' ? (
                      isCurrentPicker && state?.categoryPick ? (
                        <span className="text-neon-green text-xs font-bold">✓</span>
                      ) : isCurrentPicker ? (
                        <span className="text-text-muted text-xs">...</span>
                      ) : null
                    ) : player.hasAnswered ? (
                      <span className="text-neon-green text-xs font-bold">✓</span>
                    ) : (
                      <span className="text-text-muted text-xs">...</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {allAnswersIn && (
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-xs text-neon-green font-display uppercase tracking-wider">
                  All Locked In!
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
