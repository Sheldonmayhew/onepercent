import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { useSound } from '../hooks/useSound';
import PlayerStatusBar from '../components/Game/PlayerStatusBar';
import { formatRands } from '../utils/helpers';
import { POINTS_PER_ROUND } from '../types';

type RevealPhase = 'answer' | 'results' | 'ready';

function getCorrectAnswerText(roundResult: NonNullable<ReturnType<typeof useGameStore.getState>['session']>['roundHistory'][number]): string {
  const q = roundResult.question;
  if (q.type === 'multiple_choice' || q.type === 'image_based') {
    return q.options?.[Number(q.correct_answer)] ?? String(q.correct_answer);
  }
  if (q.type === 'sequence') {
    const items = q.sequence_items ?? q.options ?? [];
    const correctOrder = String(q.correct_answer).split(',').map(Number);
    return correctOrder.map((i) => items[i]).join(' → ');
  }
  // numeric
  return String(q.correct_answer);
}

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = useGameStore((s) => s.session);
  const getActivePlayers = useGameStore((s) => s.getActivePlayers);
  const proceedToNextRound = useGameStore((s) => s.proceedToNextRound);
  const role = useMultiplayerStore((s) => s.role);
  const { play } = useSound();

  const prefix = location.pathname.startsWith('/host') ? '/host' : '/quick-play';
  const isHost = role === 'host';

  const [phase, setPhase] = useState<RevealPhase>('answer');
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  // Progress through phases
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('results'), 1500);
    const t2 = setTimeout(() => setPhase('ready'), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Play sound when results phase starts — once
  useEffect(() => {
    if (phase === 'results' && !soundPlayedRef.current && session) {
      soundPlayedRef.current = true;
      const lastRound = session.roundHistory[session.roundHistory.length - 1];
      if (lastRound) {
        const anyCorrect = lastRound.correctPlayers.length > 0;
        play(anyCorrect ? 'correct_reveal' : 'wrong_reveal');
      }
    }
  }, [phase, session, play]);

  if (!session) return null;

  const lastRound = session.roundHistory[session.roundHistory.length - 1];
  if (!lastRound) {
    navigate(`${prefix}/results`, { replace: true });
    return null;
  }

  const players = getActivePlayers();
  const correctPlayers = players.filter((p) => lastRound.correctPlayers.includes(p.id));
  const incorrectPlayers = players.filter((p) => lastRound.incorrectPlayers.includes(p.id));
  const correctAnswerText = getCorrectAnswerText(lastRound);

  const isTeamMode = session.settings.teamMode;
  const teams = session.teams;

  const handleNext = () => {
    const result = proceedToNextRound();
    if (result === 'next') {
      if (isHost) broadcastHostState('/player/round-intro');
      navigate(`${prefix}/round-intro`, { replace: true });
    } else {
      if (isHost) broadcastHostState('/player/results');
      navigate(`${prefix}/results`, { replace: true });
    }
  };

  const handleEndGame = () => {
    navigate(`${prefix}/results`, { replace: true });
  };

  // Points that were at stake this round
  const pointsAtStake = POINTS_PER_ROUND[lastRound.difficulty] ?? 0;

  // Sorted teams by score
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const totalTeamScore = teams.reduce((acc, t) => acc + t.score, 0) || 1;

  // Sorted players for round rankings
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      className="min-h-dvh flex flex-col bg-bg-primary px-4 pt-6 pb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 w-full max-w-lg mx-auto">
        <div className="flex-1" />
        <button
          onClick={handleEndGame}
          className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1 rounded"
        >
          END GAME
        </button>
      </div>

      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 flex-1">
        {/* Team Battle Scoreboard */}
        {isTeamMode && teams.length > 0 && (
          <motion.div
            className="bg-bg-card shadow-soft rounded-2xl p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-sm text-text-primary tracking-wide">TEAM BATTLE</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green">
                LIVE
              </span>
            </div>

            {/* Team scores side by side */}
            {teams.length === 2 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center flex-1">
                    <p className="font-score text-3xl font-bold" style={{ color: teams[0].colour }}>
                      {formatRands(teams[0].score)}
                    </p>
                    <p className="text-xs text-text-muted uppercase tracking-wider">{teams[0].name}</p>
                  </div>
                  <span className="font-display text-sm text-text-muted mx-4">VS</span>
                  <div className="text-center flex-1">
                    <p className="font-score text-3xl font-bold" style={{ color: teams[1].colour }}>
                      {formatRands(teams[1].score)}
                    </p>
                    <p className="text-xs text-text-muted uppercase tracking-wider">{teams[1].name}</p>
                  </div>
                </div>

                {/* Score progress bar */}
                <div className="flex h-2.5 rounded-full overflow-hidden bg-bg-elevated">
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
              /* 3+ teams: stacked layout */
              <div className="flex flex-col gap-2">
                {sortedTeams.map((team, idx) => (
                  <div key={team.id} className="flex items-center gap-3">
                    <span className="text-text-muted font-score text-sm w-4">{idx + 1}</span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.colour }} />
                    <span className="flex-1 font-medium text-text-primary text-sm">{team.name}</span>
                    <span className="font-score text-sm" style={{ color: team.colour }}>
                      {formatRands(team.score)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Question recap */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-text-muted text-xs mb-2 tracking-wide uppercase">Question</p>
          <p className="text-text-primary font-medium leading-snug">
            {lastRound.question.question}
          </p>
        </motion.div>

        {/* Correct Answer reveal */}
        <motion.div
          className="bg-bg-card shadow-soft rounded-2xl p-6 flex flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 18 }}
        >
          <p className="text-xs text-text-muted tracking-[0.15em] uppercase">Correct Answer</p>
          <p className="text-2xl font-display font-bold text-neon-green text-center">
            {correctAnswerText}
          </p>
          <p className="text-sm text-text-secondary text-center leading-relaxed">
            {lastRound.question.explanation}
          </p>
          <p className="text-xs text-neon-gold font-score">
            Worth {formatRands(pointsAtStake)}
          </p>
        </motion.div>

        {/* Player results — animate in at 'results' phase */}
        <AnimatePresence>
          {phase !== 'answer' && (
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {correctPlayers.length > 0 && (
                <div>
                  <p className="text-xs text-neon-green tracking-[0.15em] uppercase mb-2">
                    Correct ✓
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {correctPlayers.map((p) => {
                      const pTeam = isTeamMode ? teams.find((t) => t.id === p.teamId) : null;
                      return (
                        <motion.div
                          key={p.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-sm"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                        >
                          <span>{p.avatar}</span>
                          <span className="text-text-primary font-medium">{p.name}</span>
                          {pTeam && (
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                          )}
                          <span className="text-neon-green text-xs font-score">
                            +{formatRands(pointsAtStake)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {incorrectPlayers.length > 0 && (
                <div>
                  <p className="text-xs text-neon-pink tracking-[0.15em] uppercase mb-2">
                    Incorrect ✗
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {incorrectPlayers.map((p) => {
                      const pTeam = isTeamMode ? teams.find((t) => t.id === p.teamId) : null;
                      return (
                        <motion.div
                          key={p.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-sm"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
                        >
                          <span>{p.avatar}</span>
                          <span className="text-text-primary font-medium">{p.name}</span>
                          {pTeam && (
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                          )}
                          <span className="text-text-muted text-xs">—</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Round Rankings */}
              <div className="mt-1">
                <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-2">
                  {isTeamMode ? 'Round Rankings' : 'Scores'}
                </p>
                {isTeamMode ? (
                  <div className="flex flex-col gap-2">
                    {sortedPlayers.map((p, idx) => {
                      const pTeam = teams.find((t) => t.id === p.teamId);
                      const wasCorrect = lastRound.correctPlayers.includes(p.id);
                      return (
                        <motion.div
                          key={p.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-card shadow-soft"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              idx === 0
                                ? 'bg-neon-gold/20 text-neon-gold'
                                : idx === 1
                                  ? 'bg-text-secondary/15 text-text-secondary'
                                  : idx === 2
                                    ? 'bg-neon-pink/15 text-neon-pink'
                                    : 'bg-bg-elevated text-text-muted'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span className="text-xl">{p.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary text-sm truncate">{p.name}</p>
                            <p className={`text-xs font-score ${wasCorrect ? 'text-neon-green' : 'text-text-muted'}`}>
                              {wasCorrect ? `+${formatRands(pointsAtStake)}` : 'No points'}
                            </p>
                          </div>
                          {pTeam && (
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pTeam.colour }} />
                          )}
                          <span className="font-score text-neon-gold text-sm">
                            {formatRands(p.score)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <PlayerStatusBar players={players} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next button — appears at 'ready' phase */}
        <AnimatePresence>
          {phase === 'ready' && (
            <motion.button
              onClick={handleNext}
              className="w-full py-4 rounded-full font-display text-xl tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary mt-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              NEXT QUESTION
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
