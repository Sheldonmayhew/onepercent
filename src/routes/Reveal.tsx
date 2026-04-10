import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { DIFFICULTY_TIERS } from '../types';
import { getCorrectAnswerText } from '../utils/answerFormatting';
import RevealContent from '../components/Game/RevealContent';
import type { RevealData } from '../components/Game/RevealContent';
import GameLayout, { NavCTA } from '../components/Game/GameLayout';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = useGameStore((s) => s.session);
  const getActivePlayers = useGameStore((s) => s.getActivePlayers);
  const proceedToNextRound = useGameStore((s) => s.proceedToNextRound);
  const role = useMultiplayerStore((s) => s.role);

  const prefix = location.pathname.startsWith('/host') ? '/host' : '/quick-play';
  const isHost = role === 'host';

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  if (!session) return null;

  const lastRound = session.roundHistory[session.roundHistory.length - 1];
  if (!lastRound) {
    navigate(`${prefix}/results`, { replace: true });
    return null;
  }

  const players = getActivePlayers();
  const pointsAtStake = lastRound.pointsAwarded;
  const totalQuestions = session.roundHistory.length;

  const revealData: RevealData = {
    questionText: lastRound.question.question,
    correctAnswer: getCorrectAnswerText(lastRound),
    explanation: lastRound.question.explanation,
    pointsAtStake,
    correctPlayerIds: lastRound.correctPlayers,
    incorrectPlayerIds: lastRound.incorrectPlayers,
    scoreDeltas: lastRound.scoreDeltas,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      colour: p.colour,
      score: p.score,
      correctCount: session.roundHistory.filter((r) => r.correctPlayers.includes(p.id)).length,
      totalQuestions,
    })),
  };

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
          <button
            onClick={handleEndGame}
            className="text-text-muted hover:text-neon-pink transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="font-display text-sm font-bold text-text-primary tracking-wide">
            Round Results
          </span>
          <div className="w-5" />
        </div>
      }
      cta={<NavCTA onClick={handleNext}>{ctaLabel}</NavCTA>}
    >
      <div className="pt-2">
        <RevealContent data={revealData} />
      </div>
    </GameLayout>
  );
}
