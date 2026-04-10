import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { GameBroadcast, BroadcastRound } from '../../stores/multiplayerStore';
import { useSound } from '../../hooks/useSound';
import { getDifficultyColour, formatRands } from '../../utils/helpers';
import { POINTS_PER_ROUND } from '../../types';
import TeamScoreboard from '../Game/TeamScoreboard';
import TvRevealQuestion from './TvRevealQuestion';
import TvRevealAnswer from './TvRevealAnswer';
import TvRevealResults from './TvRevealResults';

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

  if (!reveal) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-text-muted text-2xl font-display tracking-wide animate-pulse">
          Revealing answer...
        </p>
      </div>
    );
  }

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
            <TeamScoreboard teams={teams} variant="tv" />
          )}

          {/* Phase 1: Question recap */}
          <AnimatePresence mode="wait">
            {phase === 'question' && <TvRevealQuestion lastRound={lastRound} />}
          </AnimatePresence>

          {/* Phase 2: Answer reveal */}
          <AnimatePresence>
            {(phase === 'answer' || phase === 'results') && (
              <TvRevealAnswer lastRound={lastRound} reveal={reveal} points={points} />
            )}
          </AnimatePresence>

          {/* Phase 3: Player results + rankings */}
          <AnimatePresence>
            {phase === 'results' && (
              <TvRevealResults
                players={players}
                reveal={reveal}
                teamMode={!!teamMode}
                teams={teams}
                points={points}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
