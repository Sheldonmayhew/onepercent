import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameBroadcast, BroadcastRound } from '../../stores/multiplayerStore';
import { useSound } from '../../hooks/useSound';
import { formatRands, getDifficultyColour } from '../../utils/helpers';
import { POINTS_PER_ROUND } from '../../types';

interface TvRevealProps {
  gameState: GameBroadcast;
  lastRound: BroadcastRound | null;
}

type Phase = 'question' | 'answer' | 'results';

export default function TvReveal({ gameState, lastRound }: TvRevealProps) {
  const { players, reveal, teamMode, teams } = gameState;
  const [phase, setPhase] = useState<Phase>('question');
  const { play } = useSound();
  const soundPlayed = useRef(false);

  const difficulty = lastRound?.difficulty ?? 90;
  const points = lastRound?.points ?? (POINTS_PER_ROUND[difficulty] ?? 0);
  const diffColour = getDifficultyColour(difficulty);

  const sortedTeams = teams ? [...teams].sort((a, b) => b.score - a.score) : [];
  const totalTeamScore = (teams ?? []).reduce((acc, t) => acc + t.score, 0) || 1;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const getPlayerTeam = (pId: string) => teams?.find((t) => t.playerIds.includes(pId));

  useEffect(() => {
    setPhase('question');
    soundPlayed.current = false;

    const t1 = setTimeout(() => setPhase('answer'), 2000);
    const t2 = setTimeout(() => setPhase('results'), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reveal?.correctAnswer]);

  // Play correct/wrong sound when results phase starts
  useEffect(() => {
    if (phase === 'results' && !soundPlayed.current && reveal) {
      soundPlayed.current = true;
      const anyCorrect = reveal.correctPlayerIds.length > 0;
      play(anyCorrect ? 'correct_reveal' : 'wrong_reveal');
    }
  }, [phase, reveal, play]);

  if (!reveal) return null;

  const correctPlayers = players.filter((p) => reveal.correctPlayerIds.includes(p.id));
  const incorrectPlayers = players.filter((p) => reveal.incorrectPlayerIds.includes(p.id));

  return (
    <div className="min-h-dvh flex flex-col p-6 lg:p-10">
      {/* Top bar: round info */}
      {lastRound && (
        <div className="flex items-center gap-4 mb-6">
          <span className="font-display text-lg text-text-secondary uppercase tracking-wider">
            Round {lastRound.index + 1} of {lastRound.totalRounds}
          </span>
          <span className="font-display text-lg font-bold" style={{ color: diffColour }}>
            {difficulty}%
          </span>
          <span className="font-score text-lg text-neon-gold">
            {formatRands(points)}
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl flex flex-col gap-8">
          {/* Team Battle Scoreboard */}
          {teamMode && teams && teams.length > 0 && (phase === 'answer' || phase === 'results') && (
            <motion.div
              className="bg-bg-card shadow-soft rounded-2xl p-6 lg:p-8"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-text-primary tracking-wide">TEAM BATTLE</h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-neon-green/15 text-neon-green">
                  LIVE
                </span>
              </div>

              {teams.length === 2 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="font-score text-5xl lg:text-6xl font-bold" style={{ color: teams[0].colour }}>
                        {formatRands(teams[0].score)}
                      </p>
                      <p className="text-sm text-text-muted uppercase tracking-wider mt-1">{teams[0].name}</p>
                    </div>
                    <span className="font-display text-xl text-text-muted mx-6">VS</span>
                    <div className="text-center flex-1">
                      <p className="font-score text-5xl lg:text-6xl font-bold" style={{ color: teams[1].colour }}>
                        {formatRands(teams[1].score)}
                      </p>
                      <p className="text-sm text-text-muted uppercase tracking-wider mt-1">{teams[1].name}</p>
                    </div>
                  </div>

                  <div className="flex h-4 rounded-full overflow-hidden bg-bg-elevated">
                    <div
                      className="transition-all duration-700 rounded-l-full"
                      style={{
                        width: `${Math.max(5, (teams[0].score / totalTeamScore) * 100)}%`,
                        backgroundColor: teams[0].colour,
                      }}
                    />
                    <div
                      className="transition-all duration-700 rounded-r-full"
                      style={{
                        width: `${Math.max(5, (teams[1].score / totalTeamScore) * 100)}%`,
                        backgroundColor: teams[1].colour,
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedTeams.map((team, idx) => (
                    <div key={team.id} className="flex items-center gap-4 px-4 py-2 rounded-xl bg-bg-elevated">
                      <span className="font-score text-lg w-6 text-center text-text-muted">{idx + 1}</span>
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: team.colour }} />
                      <span className="flex-1 text-xl font-medium text-text-primary">{team.name}</span>
                      <span className="font-score text-xl" style={{ color: team.colour }}>
                        {formatRands(team.score)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Phase 1: Question recap */}
          <AnimatePresence mode="wait">
            {phase === 'question' && lastRound && (
              <motion.div
                key="question-recap"
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
              >
                {lastRound.categoryName && (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-bg-elevated text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {lastRound.categoryName}
                  </span>
                )}
                <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-snug text-center max-w-3xl">
                  {lastRound.question.question}
                </h2>
                {lastRound.question.image_url && (
                  <img
                    src={lastRound.question.image_url}
                    alt="Question visual"
                    className="rounded-2xl max-h-56 object-contain"
                  />
                )}

                {/* Options reminder */}
                {lastRound.question.options && (
                  <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                    {lastRound.question.options.map((option, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-bg-card shadow-soft rounded-xl px-5 py-3"
                      >
                        <span className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center font-display text-sm text-text-secondary font-bold">
                          {['A', 'B', 'C', 'D', 'E', 'F'][i]}
                        </span>
                        <span className="text-text-primary font-medium">{option}</span>
                      </div>
                    ))}
                  </div>
                )}

                <motion.p
                  className="text-text-muted text-lg mt-4"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  Revealing answer...
                </motion.p>
              </motion.div>
            )}

            {/* Phase 1 fallback: no lastRound, skip to answer */}
            {phase === 'question' && !lastRound && (
              <motion.div
                key="question-loading"
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="text-text-muted text-xl"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  Revealing answer...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: Answer reveal */}
          <AnimatePresence>
            {(phase === 'answer' || phase === 'results') && (
              <motion.div
                key="answer-card"
                className="bg-bg-card shadow-soft rounded-3xl p-8 lg:p-10 flex flex-col items-center gap-4"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              >
                {/* Question text (compact) */}
                {lastRound && (
                  <p className="text-text-muted text-center text-sm max-w-2xl leading-relaxed mb-2">
                    {lastRound.question.question}
                  </p>
                )}

                <span className="text-sm text-text-muted tracking-[0.2em] uppercase">
                  Correct Answer
                </span>
                <motion.h2
                  className="text-5xl lg:text-6xl font-display font-bold text-neon-green text-center"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 15 }}
                >
                  {reveal.correctAnswer}
                </motion.h2>
                {reveal.explanation && (
                  <motion.p
                    className="text-lg text-text-secondary text-center leading-relaxed max-w-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {reveal.explanation}
                  </motion.p>
                )}
                <span className="font-score text-xl text-neon-gold">
                  Worth {formatRands(points)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Player results */}
          <AnimatePresence>
            {phase === 'results' && (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Correct */}
                {correctPlayers.length > 0 && (
                  <div className="bg-neon-green/5 border border-neon-green/20 rounded-2xl p-6">
                    <h3 className="text-sm text-neon-green tracking-[0.15em] uppercase mb-4">
                      Correct
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {correctPlayers.map((p, i) => {
                        const pTeam = teamMode ? getPlayerTeam(p.id) : null;
                        return (
                          <motion.div
                            key={p.id}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neon-green/10 border border-neon-green/20"
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 }}
                          >
                            <span className="text-2xl">{p.avatar}</span>
                            <span className="text-lg text-text-primary font-medium">{p.name}</span>
                            {pTeam && (
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                            )}
                            <span className="text-neon-green font-score">
                              +{formatRands(points)}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Incorrect */}
                {incorrectPlayers.length > 0 && (
                  <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-2xl p-6">
                    <h3 className="text-sm text-neon-pink tracking-[0.15em] uppercase mb-4">
                      Incorrect
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {incorrectPlayers.map((p, i) => {
                        const pTeam = teamMode ? getPlayerTeam(p.id) : null;
                        return (
                          <motion.div
                            key={p.id}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-neon-pink/10 border border-neon-pink/20"
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 20 }}
                          >
                            <span className="text-2xl">{p.avatar}</span>
                            <span className="text-lg text-text-primary font-medium">{p.name}</span>
                            {pTeam && (
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                            )}
                            <span className="text-text-muted">--</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Round Rankings — shows with results */}
          <AnimatePresence>
            {phase === 'results' && (
              <motion.div
                className="bg-bg-card shadow-soft rounded-2xl p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm text-text-muted tracking-[0.15em] uppercase mb-4">
                  {teamMode ? 'Round Rankings' : 'Leaderboard'}
                </h3>
                {teamMode ? (
                  <div className="flex flex-col gap-3">
                    {sortedPlayers.map((p, idx) => {
                      const pTeam = getPlayerTeam(p.id);
                      const wasCorrect = reveal.correctPlayerIds.includes(p.id);
                      return (
                        <motion.div
                          key={p.id}
                          className="flex items-center gap-4 px-4 py-3 rounded-xl bg-bg-elevated"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + idx * 0.07 }}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                              idx === 0
                                ? 'bg-neon-gold/20 text-neon-gold'
                                : idx === 1
                                  ? 'bg-text-secondary/15 text-text-secondary'
                                  : idx === 2
                                    ? 'bg-neon-pink/15 text-neon-pink'
                                    : 'bg-bg-card text-text-muted'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span className="text-3xl">{p.avatar}</span>
                          {pTeam && (
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xl font-medium text-text-primary">{p.name}</p>
                            <p className={`text-sm font-score ${wasCorrect ? 'text-neon-green' : 'text-text-muted'}`}>
                              {wasCorrect ? `+${formatRands(points)}` : 'No points'}
                            </p>
                          </div>
                          <span className="font-score text-xl text-neon-gold">
                            {formatRands(p.score)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {sortedPlayers.map((p, idx) => (
                      <motion.div
                        key={p.id}
                        layout
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated"
                      >
                        <span className={`font-score text-sm w-5 text-center ${
                          idx === 0 ? 'text-neon-gold' : 'text-text-muted'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                        </span>
                        <span className="text-xl">{p.avatar}</span>
                        <span className="text-text-primary font-medium">{p.name}</span>
                        <span className="font-score text-neon-gold text-sm">
                          {formatRands(p.score)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
