import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { useSound } from '../hooks/useSound';
import { formatRands } from '../utils/helpers';
import { POINTS_PER_ROUND, DIFFICULTY_TIERS } from '../types';
import { getCorrectAnswerText } from '../utils/answerFormatting';
import TeamScoreboard from '../components/Game/TeamScoreboard';
import RevealPlayerResults from '../components/Game/RevealPlayerResults';
import GameLayout, { NavCTA } from '../components/Game/GameLayout';

type RevealPhase = 'answer' | 'results' | 'ready';

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

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('results'), 1500);
    const t2 = setTimeout(() => setPhase('ready'), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

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
    if (result === 'next_question') {
      if (isHost) broadcastHostState('/player/play');
      navigate(`${prefix}/play`, { replace: true });
    } else if (result === 'next_round') {
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

  const pointsAtStake = POINTS_PER_ROUND[lastRound.difficulty] ?? 0;

  // CTA label
  const roundQuestions = session.selectedQuestions[session.currentRound];
  const hasMoreInRound = roundQuestions && session.currentQuestionInRound + 1 < roundQuestions.length;
  const isLastRound = session.currentRound + 1 >= DIFFICULTY_TIERS.length;
  const ctaLabel = hasMoreInRound
    ? `NEXT QUESTION (${session.currentQuestionInRound + 2}/${roundQuestions.length})`
    : isLastRound
      ? 'VIEW RESULTS'
      : 'NEXT ROUND';

  return (
    <GameLayout
      header={
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="font-display text-xs font-bold text-text-secondary uppercase tracking-wider">
            ANSWER REVEAL
          </span>
          <button
            onClick={handleEndGame}
            className="text-[10px] text-text-muted hover:text-neon-pink transition-colors px-2 py-1 rounded"
          >
            END GAME
          </button>
        </div>
      }
      cta={
        phase === 'ready' ? (
          <NavCTA onClick={handleNext}>{ctaLabel}</NavCTA>
        ) : (
          <NavCTA variant="muted" disabled>Revealing results…</NavCTA>
        )
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* Team Battle Scoreboard */}
        {isTeamMode && teams.length > 0 && (
          <TeamScoreboard teams={teams} variant="mobile" />
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

        {/* Correct Answer */}
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

        {/* Player results */}
        <AnimatePresence>
          {phase !== 'answer' && (
            <RevealPlayerResults
              players={players}
              correctPlayers={correctPlayers}
              incorrectPlayers={incorrectPlayers}
              isTeamMode={isTeamMode}
              teams={teams}
              lastRound={lastRound}
              pointsAtStake={pointsAtStake}
            />
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}
