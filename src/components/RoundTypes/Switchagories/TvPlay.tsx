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
  const picks: Record<string, string> = state?.categoryPicks ?? {};
  const categories = question.categories ?? [];
  const { timeLeft, progress } = useTimer({
    duration: question.time_limit_seconds,
    autoStart: timerStarted,
  });

  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;
  const pickedPlayerIds = new Set(Object.keys(picks));

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
          {/* Picking phase: category grid */}
          {phase === 'picking' && (
            <motion.div
              className="bg-bg-card shadow-soft rounded-3xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-display text-lg text-purple-400 uppercase tracking-wider text-center mb-6">
                Choose Your Category
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat: string, idx: number) => {
                  const gradient = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  // Players who picked this category
                  const pickedBy = players.filter((p) => picks[p.id] === cat);

                  return (
                    <motion.div
                      key={cat}
                      className={`relative py-8 px-6 rounded-2xl bg-gradient-to-br ${gradient} text-white text-center`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 + 0.2 }}
                    >
                      <span className="font-display text-xl font-bold">{cat}</span>
                      {pickedBy.length > 0 && (
                        <div className="flex justify-center gap-1 mt-3">
                          {pickedBy.map((p) => (
                            <span
                              key={p.id}
                              className="w-4 h-4 rounded-full border-2 border-white/40"
                              style={{ backgroundColor: p.colour }}
                              title={p.name}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Answering phase: question with category badges */}
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
                const playerPick = picks[player.id];
                const hasPicked = pickedPlayerIds.has(player.id);

                return (
                  <motion.div
                    key={player.id}
                    className="flex items-center gap-2 py-2 px-3 rounded-xl bg-bg-elevated"
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

                    {/* Category badge in answering phase */}
                    {phase === 'answering' && playerPick && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-300 font-medium truncate max-w-[80px]">
                        {playerPick}
                      </span>
                    )}

                    {/* Status */}
                    {phase === 'picking' ? (
                      hasPicked ? (
                        <span className="text-neon-green text-xs font-bold">✓</span>
                      ) : (
                        <span className="text-text-muted text-xs">...</span>
                      )
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
