import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../../hooks/useSound';
import { formatRands } from '../../utils/helpers';

/* ── Normalised data the component needs ── */

export interface RevealPlayer {
  id: string;
  name: string;
  avatar: string;
  colour: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
}

export interface RevealData {
  questionText: string;
  correctAnswer: string;
  explanation?: string;
  pointsAtStake: number;
  correctPlayerIds: string[];
  incorrectPlayerIds: string[];
  players: RevealPlayer[];
  /** Per-player score deltas from the round type scoring (accounts for multipliers, streaks, etc.) */
  scoreDeltas?: Record<string, number>;
}

type Phase = 'question' | 'answer' | 'results';

interface RevealContentProps {
  data: RevealData;
  /** Scale variant — tv uses larger text */
  variant?: 'mobile' | 'tv';
}

export default function RevealContent({ data, variant = 'mobile' }: RevealContentProps) {
  const {
    questionText,
    correctAnswer,
    explanation,
    pointsAtStake,
    correctPlayerIds,
    incorrectPlayerIds: _incorrectPlayerIds,
    players,
    scoreDeltas,
  } = data;

  const [phase, setPhase] = useState<Phase>('question');
  const soundPlayed = useRef(false);
  const { play } = useSound();
  const isTv = variant === 'tv';

  // Phase timers
  useEffect(() => {
    setPhase('question');
    soundPlayed.current = false;
    const t1 = setTimeout(() => setPhase('answer'), 1500);
    const t2 = setTimeout(() => setPhase('results'), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [correctAnswer]);

  // Sound on results
  useEffect(() => {
    if (phase === 'results' && !soundPlayed.current) {
      soundPlayed.current = true;
      play(correctPlayerIds.length > 0 ? 'correct_reveal' : 'wrong_reveal');
    }
  }, [phase, correctPlayerIds, play]);

  const correctPlayers = players.filter((p) => correctPlayerIds.includes(p.id));
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  /* ── Sizing tokens ── */
  const sz = isTv
    ? { heading: 'text-lg', questionText: 'text-xl lg:text-2xl', answerText: 'text-4xl lg:text-5xl', explanationText: 'text-base', pillText: 'text-base', rankAvatar: 'text-2xl', rankName: 'text-lg', rankScore: 'text-lg', gap: 'gap-8', pad: 'p-8 lg:p-10', maxW: 'max-w-4xl' }
    : { heading: 'text-xs', questionText: 'text-base', answerText: 'text-2xl', explanationText: 'text-sm', pillText: 'text-sm', rankAvatar: 'text-xl', rankName: 'text-sm', rankScore: 'text-sm', gap: 'gap-5', pad: 'p-5', maxW: 'max-w-lg' };

  return (
    <div className={`flex flex-col ${sz.gap} w-full ${isTv ? sz.maxW + ' mx-auto' : ''}`}>
      {/* ─── Question + Answer Card ─── */}
      <motion.div
        className={`relative rounded-3xl overflow-hidden shadow-soft ${sz.pad}`}
        style={{
          background: 'linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-card) 100%)',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Question reveal label */}
        <p className={`${sz.heading} text-text-muted tracking-[0.15em] uppercase mb-3`}>
          Question Reveal
        </p>

        {/* Question text */}
        <p className={`${sz.questionText} font-medium text-text-primary leading-snug mb-5`}>
          {questionText}
        </p>

        {/* Answer card */}
        <AnimatePresence>
          {(phase === 'answer' || phase === 'results') && (
            <motion.div
              className="rounded-2xl p-5 flex flex-col items-center gap-2"
              style={{ backgroundColor: 'var(--color-neon-gold)', color: '#38274c' }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            >
              <div className="flex items-center gap-3">
                <motion.p
                  className={`${sz.answerText} font-display font-bold text-center`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 250, damping: 15 }}
                >
                  {correctAnswer}
                </motion.p>
                <motion.span
                  className="text-neon-green"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                >
                  <svg className={isTv ? 'w-8 h-8' : 'w-6 h-6'} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#22C55E" />
                    <path d="M7 12.5l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </div>
              {explanation && (
                <motion.p
                  className={`${sz.explanationText} text-center leading-relaxed opacity-80 max-w-md`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.4 }}
                >
                  {explanation}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Correct Players ─── */}
      <AnimatePresence>
        {phase === 'results' && correctPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Section heading with line */}
            <div className="flex items-center gap-3 mb-3">
              <p className={`${sz.heading} font-bold text-text-primary tracking-[0.12em] uppercase whitespace-nowrap`}>
                Correct
              </p>
              <div className="flex-1 h-px bg-outline-variant/40" />
            </div>

            <div className="flex flex-wrap gap-2">
              {correctPlayers.map((p, i) => (
                <motion.div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card shadow-soft ${sz.pillText}`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 280, damping: 20 }}
                >
                  <span className={isTv ? 'text-xl' : 'text-lg'}>{p.avatar}</span>
                  <span className="font-medium text-text-primary">{p.name}</span>
                  <span className="text-neon-green font-score font-bold text-xs">
                    +{formatRands(scoreDeltas?.[p.id] ?? pointsAtStake)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Total Scores / Live Standings ─── */}
      <AnimatePresence>
        {phase === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className={`${sz.heading} font-bold text-text-primary tracking-[0.12em] uppercase`}>
                Total Scores
              </p>
              <span className={`${sz.heading} text-text-muted tracking-wider uppercase`}>
                Live Standings
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {sortedPlayers.map((p, idx) => {
                return (
                  <motion.div
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${idx === 0 ? 'bg-bg-card shadow-soft' : ''}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.06 }}
                  >
                    {/* Rank */}
                    <span
                      className={`font-display font-bold ${isTv ? 'text-2xl' : 'text-lg'} ${
                        idx === 0
                          ? 'text-neon-cyan'
                          : 'text-text-muted'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    {/* Avatar */}
                    <span className={sz.rankAvatar}>{p.avatar}</span>

                    {/* Name + correct count */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-text-primary ${sz.rankName} truncate`}>
                        {p.name}
                      </p>
                      <p className="text-xs text-text-muted uppercase tracking-wide">
                        {p.correctCount}/{p.totalQuestions} Correct
                      </p>
                    </div>

                    {/* Score */}
                    <span className={`font-score font-bold ${sz.rankScore} ${idx === 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {formatRands(p.score)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
