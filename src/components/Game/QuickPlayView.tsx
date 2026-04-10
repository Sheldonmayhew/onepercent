import { Suspense } from 'react';
import { motion } from 'framer-motion';
import type { GameSession, Question, Player } from '../../types';
import type { SoundEvent } from '../../hooks/useSound';
import { useGameStore } from '../../stores/gameStore';
import AnswerInput from './AnswerInput';
import PlayerStatusBar from './PlayerStatusBar';
import { BottomNavProvider, useBottomNav } from './BottomNavContext';
import { getRoundDefinition } from '../../roundTypes/registry';
import { formatRands } from '../../utils/helpers';

interface QuickPlayViewProps {
  session: GameSession;
  question: Question;
  players: Player[];
  roundIndex: number;
  difficulty: number;
  points: number;
  totalRounds: number;
  timeLeft: number;
  progress: number;
  submitAnswer: (playerId: string, answer: string | number) => void;
  advancePassAndPlay: () => void;
  handleEndGame: () => void;
  play: (sound: SoundEvent) => void;
}

const TIMER_COLORS = {
  normal: 'bg-neon-cyan',
  urgent: 'bg-neon-gold',
  critical: 'bg-neon-pink',
} as const;

export default function QuickPlayView(props: QuickPlayViewProps) {
  return (
    <BottomNavProvider>
      <QuickPlayViewInner {...props} />
    </BottomNavProvider>
  );
}

function QuickPlayViewInner({
  session,
  question,
  players,
  roundIndex,
  points,
  totalRounds,
  timeLeft,
  progress,
  submitAnswer,
  advancePassAndPlay,
  handleEndGame,
  play,
}: QuickPlayViewProps) {
  const currentPlayer = players[session.currentPlayerIndex] ?? players[0];
  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;
  const timerColor = isCritical
    ? TIMER_COLORS.critical
    : isUrgent
      ? TIMER_COLORS.urgent
      : TIMER_COLORS.normal;

  const bottomNav = useBottomNav();
  const ctaState = bottomNav?.ctaState ?? null;

  const handleAnswer = (answer: string | number) => {
    if (!currentPlayer) return;
    play('answer_submitted');
    submitAnswer(currentPlayer.id, answer);
    advancePassAndPlay();
  };

  const showLockIn = currentPlayer && !session.allAnswersIn && ctaState && !ctaState.isLocked;

  return (
    <div className="h-dvh flex flex-col bg-bg-primary safe-area-top overflow-hidden">
      {/* ── Timer bar ── */}
      <div className="w-full h-2 bg-bg-elevated shrink-0">
        <motion.div
          className={`h-full ${timerColor} transition-colors duration-300 ${isCritical ? 'animate-timer-pulse' : ''}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </div>

      {/* ── Top info strip ── */}
      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs font-bold text-text-secondary uppercase tracking-wider">
            R{roundIndex + 1}/{totalRounds}
          </span>
          {session.selectedQuestions[roundIndex]?.length > 1 && (
            <span className="text-xs text-text-muted">
              Q{session.currentQuestionInRound + 1}/{session.selectedQuestions[roundIndex].length}
            </span>
          )}
        </div>
        <span className={`font-score text-sm font-bold tabular-nums ${
          isCritical ? 'text-neon-pink animate-timer-pulse' : isUrgent ? 'text-neon-gold' : 'text-text-secondary'
        }`}>
          {timeLeft}s
        </span>
        <button
          onClick={handleEndGame}
          className="text-[10px] text-text-muted hover:text-neon-pink transition-colors px-2 py-1 rounded"
        >
          END
        </button>
      </div>

      {/* ── Question area ── */}
      <div className="shrink-0 px-4 sm:px-8 lg:px-12 pb-3">
        <motion.div
          className="bg-bg-card shadow-soft-md rounded-2xl p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            {question.category && (
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-bg-elevated text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                {question.category}
              </span>
            )}
            <span className="font-display text-sm font-bold italic text-neon-purple">
              {formatRands(points)}
            </span>
          </div>
          <p className="font-responsive-question font-bold text-text-primary leading-snug">
            {question.question}
          </p>
          {question.image_url && (
            <img
              src={question.image_url}
              alt="Question visual"
              className="mt-3 rounded-xl max-h-32 mx-auto object-contain"
            />
          )}
        </motion.div>
      </div>

      {/* ── Answer area (takes remaining space above bottom nav) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 pb-2">
        {currentPlayer && !session.allAnswersIn && (() => {
          const roundTypeId = session.roundTypeSequence?.[roundIndex];
          if (roundTypeId) {
            const def = getRoundDefinition(roundTypeId);
            const RoundInput = def.slots.PlayerInput;
            return (
              <Suspense fallback={
                <AnswerInput
                  key={`${roundIndex}-${currentPlayer.id}`}
                  question={question}
                  onSubmit={handleAnswer}
                  playerName={currentPlayer.name}
                  playerColour={currentPlayer.colour}
                />
              }>
                <RoundInput
                  key={`${roundIndex}-${currentPlayer.id}-rt`}
                  question={question}
                  players={players}
                  roundState={session.activeRoundState}
                  onSubmit={(_, answer) => handleAnswer(answer)}
                  onBuzzIn={(_, timestamp, answer) => {
                    useGameStore.setState({
                      session: {
                        ...session,
                        players: session.players.map((p) =>
                          p.id === currentPlayer.id ? { ...p, answerTimestamp: timestamp } : p
                        ),
                      },
                    });
                    handleAnswer(answer);
                  }}
                  onUpdateState={useGameStore.getState().updateRoundState}
                  playerId={currentPlayer.id}
                  timerStarted={true}
                  allAnswersIn={session.allAnswersIn}
                  isHost={false}
                />
              </Suspense>
            );
          }
          return (
            <AnswerInput
              key={`${roundIndex}-${currentPlayer.id}`}
              question={question}
              onSubmit={handleAnswer}
              playerName={currentPlayer.name}
              playerColour={currentPlayer.colour}
            />
          );
        })()}
        {session.allAnswersIn && (
          <motion.p
            className="text-center text-neon-green font-display tracking-wide text-lg mt-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            ALL ANSWERS IN — REVEALING…
          </motion.p>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div className="shrink-0 bg-bg-card/95 backdrop-blur-md border-t border-outline-variant/10 safe-area-bottom px-4 sm:px-8 lg:px-12 pt-3 pb-5">
        {/* Mini scoreboard (multi-player) */}
        {players.length > 1 && (
          <div className="mb-2">
            <PlayerStatusBar players={players} showAnswerStatus />
          </div>
        )}

        {/* CTA — always anchored here */}
        <div>
          {showLockIn ? (
            <motion.button
              onClick={ctaState.lockIn}
              disabled={!ctaState.canLockIn}
              className="w-full py-3.5 rounded-2xl font-display text-lg font-bold tracking-wide bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
            >
              LOCK IN
            </motion.button>
          ) : ctaState?.isLocked ? (
            <div className="w-full py-3.5 rounded-2xl text-center font-display text-lg font-bold tracking-wide bg-neon-green/10 text-neon-green">
              LOCKED IN
            </div>
          ) : session.allAnswersIn ? (
            <motion.div
              className="w-full py-3.5 rounded-2xl text-center font-display text-lg font-bold tracking-wide bg-neon-green/10 text-neon-green"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              REVEALING…
            </motion.div>
          ) : (
            <div className="w-full py-3.5 rounded-2xl text-center font-display text-sm tracking-wide text-text-muted">
              Select an answer above
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
