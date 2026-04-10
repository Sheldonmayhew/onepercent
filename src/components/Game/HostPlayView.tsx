import { Suspense } from 'react';
import { motion } from 'framer-motion';
import type { GameSession, Question, Player } from '../../types';
import type { SoundEvent } from '../../hooks/useSound';
import { useGameStore } from '../../stores/gameStore';
import { broadcastHostState } from '../../hooks/useMultiplayer';
import AnswerInput from './AnswerInput';
import PlayerStatusBar from './PlayerStatusBar';
import { BottomNavProvider, useBottomNav } from './BottomNavContext';
import { getRoundDefinition } from '../../roundTypes/registry';
import { formatRands } from '../../utils/helpers';

interface HostPlayViewProps {
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
  setAllAnswersIn: () => void;
  handleEndGame: () => void;
  play: (sound: SoundEvent) => void;
}

const TIMER_COLORS = {
  normal: 'bg-neon-cyan',
  urgent: 'bg-neon-gold',
  critical: 'bg-neon-pink',
} as const;

export default function HostPlayView(props: HostPlayViewProps) {
  return (
    <BottomNavProvider>
      <HostPlayViewInner {...props} />
    </BottomNavProvider>
  );
}

function HostPlayViewInner({
  session,
  question,
  players,
  roundIndex,
  points,
  totalRounds,
  timeLeft,
  progress,
  submitAnswer,
  setAllAnswersIn,
  handleEndGame,
  play,
}: HostPlayViewProps) {
  const hostPlayer = players.find((p) => p.isHost);
  const hostHasAnswered = hostPlayer?.hasAnswered ?? false;
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const allAnswersIn = session.allAnswersIn;
  const timerStarted = session.timerStarted;

  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;
  const timerColor = isCritical ? TIMER_COLORS.critical : isUrgent ? TIMER_COLORS.urgent : TIMER_COLORS.normal;

  const bottomNav = useBottomNav();
  const ctaState = bottomNav?.ctaState ?? null;

  const handleHostAnswer = (answer: string | number) => {
    if (!hostPlayer) return;
    play('answer_submitted');
    submitAnswer(hostPlayer.id, answer);
    broadcastHostState();
  };

  const handleCloseAnswers = () => {
    setAllAnswersIn();
    broadcastHostState();
  };

  const showLockIn = timerStarted && hostPlayer && !hostHasAnswered && ctaState && !ctaState.isLocked;

  return (
    <div className="h-dvh flex flex-col bg-bg-primary safe-area-top overflow-hidden">
      {/* ── Timer bar ── */}
      {timerStarted && (
        <div className="w-full h-2 bg-bg-elevated shrink-0">
          <motion.div
            className={`h-full ${timerColor} transition-colors duration-300 ${isCritical ? 'animate-timer-pulse' : ''}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      )}

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
        {timerStarted && (
          <span className={`font-score text-sm font-bold tabular-nums ${
            isCritical ? 'text-neon-pink animate-timer-pulse' : isUrgent ? 'text-neon-gold' : 'text-text-secondary'
          }`}>
            {timeLeft}s
          </span>
        )}
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
            <img src={question.image_url} alt="Question visual" className="mt-3 rounded-xl max-h-32 mx-auto object-contain" />
          )}
        </motion.div>
      </div>

      {/* ── Answer area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 pb-2">
        {/* Player answer status */}
        <div className="mb-3">
          <PlayerStatusBar players={nonHostPlayers} showAnswerStatus />
        </div>

        {timerStarted && hostPlayer && !hostHasAnswered && (() => {
          const roundTypeId = session.roundTypeSequence?.[roundIndex];
          if (roundTypeId) {
            const def = getRoundDefinition(roundTypeId);
            const RoundInput = def.slots.PlayerInput;
            return (
              <Suspense fallback={
                <AnswerInput
                  key={`host-${roundIndex}`}
                  question={question}
                  onSubmit={handleHostAnswer}
                  playerName={hostPlayer.name}
                  playerColour={hostPlayer.colour}
                />
              }>
                <RoundInput
                  key={`host-${roundIndex}-rt`}
                  question={question}
                  players={players}
                  roundState={session.activeRoundState}
                  onSubmit={(_, answer) => handleHostAnswer(answer)}
                  onBuzzIn={(_, timestamp, answer) => {
                    useGameStore.setState({
                      session: {
                        ...session,
                        players: session.players.map((p) =>
                          p.id === hostPlayer.id ? { ...p, answerTimestamp: timestamp } : p
                        ),
                      },
                    });
                    handleHostAnswer(answer);
                  }}
                  onUpdateState={useGameStore.getState().updateRoundState}
                  playerId={hostPlayer.id}
                  timerStarted={timerStarted}
                  allAnswersIn={allAnswersIn}
                  isHost={true}
                />
              </Suspense>
            );
          }
          return (
            <AnswerInput
              key={`host-${roundIndex}`}
              question={question}
              onSubmit={handleHostAnswer}
              playerName={hostPlayer.name}
              playerColour={hostPlayer.colour}
            />
          );
        })()}

        {/* Round-type host controls */}
        {(() => {
          const roundTypeId = session.roundTypeSequence?.[roundIndex];
          if (roundTypeId) {
            const def = getRoundDefinition(roundTypeId);
            if (def.slots.HostControls) {
              const HostCtrl = def.slots.HostControls;
              return (
                <Suspense fallback={null}>
                  <HostCtrl
                    question={question}
                    players={players}
                    roundState={session.activeRoundState}
                    onUpdateState={useGameStore.getState().updateRoundState}
                    timerStarted={timerStarted}
                    allAnswersIn={allAnswersIn}
                  />
                </Suspense>
              );
            }
          }
          return null;
        })()}

        {allAnswersIn && (
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
        ) : timerStarted && hostHasAnswered && !allAnswersIn ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-text-muted text-sm">Waiting for players…</p>
            <motion.button
              onClick={handleCloseAnswers}
              className="w-full py-3.5 rounded-2xl font-display text-lg tracking-wide bg-bg-elevated text-text-secondary hover:text-text-primary transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              CLOSE ANSWERS
            </motion.button>
          </div>
        ) : allAnswersIn ? (
          <div className="w-full py-3.5 rounded-2xl text-center font-display text-lg font-bold tracking-wide bg-neon-green/10 text-neon-green">
            REVEALING…
          </div>
        ) : (
          <div className="w-full py-3.5 rounded-2xl text-center font-display text-sm tracking-wide text-text-muted">
            Select an answer above
          </div>
        )}
      </div>
    </div>
  );
}
