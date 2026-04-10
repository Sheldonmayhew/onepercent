import type { GameBroadcast, BroadcastRound } from '../../stores/multiplayerStore';
import { POINTS_PER_ROUND } from '../../types';
import RevealContent from '../Game/RevealContent';
import type { RevealData } from '../Game/RevealContent';

interface TvRevealProps {
  gameState: GameBroadcast;
  lastRound: BroadcastRound | null;
}

export default function TvReveal({ gameState, lastRound }: TvRevealProps) {
  const { players, reveal } = gameState;

  const difficulty = lastRound?.difficulty ?? 90;
  const points = lastRound?.points ?? (POINTS_PER_ROUND[difficulty] ?? 0);
  const totalQuestions = players[0]?.totalQuestions ?? 1;

  if (!reveal) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-text-muted text-2xl font-display tracking-wide animate-pulse">
          Revealing answer...
        </p>
      </div>
    );
  }

  const scoreDeltas = reveal.scoreUpdates
    ? Object.fromEntries(reveal.scoreUpdates.map((u) => [u.playerId, u.delta]))
    : undefined;

  const revealData: RevealData = {
    questionText: lastRound?.question?.question ?? '',
    correctAnswer: reveal.correctAnswer,
    explanation: reveal.explanation,
    pointsAtStake: points,
    correctPlayerIds: reveal.correctPlayerIds,
    incorrectPlayerIds: reveal.incorrectPlayerIds,
    scoreDeltas,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      colour: p.colour,
      score: p.score,
      correctCount: p.correctCount ?? 0,
      totalQuestions,
    })),
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 lg:p-10">
      <RevealContent data={revealData} variant="tv" />
    </div>
  );
}
