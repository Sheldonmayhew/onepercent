import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { useTimer } from '../../hooks/useTimer';
import { useSound } from '../../hooks/useSound';
import { TIMER_DURATIONS } from '../../types';
import QuestionDisplay from './QuestionDisplay';
import AnswerInput from './AnswerInput';
import Timer from './Timer';
import PlayerStatusBar from './PlayerStatusBar';

export default function GameScreen() {
  const {
    session,
    getCurrentQuestion,
    getActivePlayers,
    getTiers,
    getCurrentDifficulty,
    getCurrentPoints,
    submitAnswer,
    revealAnswers,
    setAllAnswersIn,
    setScreen,
  } = useGameStore();

  const isMultiplayer = !!useMultiplayerStore((s) => s.roomCode);
  const { play } = useSound();
  const [currentPassPlayIdx, setCurrentPassPlayIdx] = useState(0);

  const question = getCurrentQuestion();
  const activePlayers = getActivePlayers();
  const tiers = getTiers();
  const difficulty = getCurrentDifficulty();
  const points = getCurrentPoints();

  const timerDuration = session
    ? (question?.time_limit_seconds ?? TIMER_DURATIONS[session.settings.timerSpeed])
    : 30;

  const handleTimerExpire = useCallback(() => {
    play('countdown');
    if (session && !session.allAnswersIn) {
      setAllAnswersIn();
    }
  }, [play, session, setAllAnswersIn]);

  const { timeLeft, progress, isRunning, start: startTimer, reset: resetTimer } = useTimer({
    duration: timerDuration,
    onExpire: handleTimerExpire,
    autoStart: !isMultiplayer,
  });

  // In multiplayer, start timer only after all players are ready
  useEffect(() => {
    if (isMultiplayer && session?.timerStarted) {
      startTimer();
    }
  }, [isMultiplayer, session?.timerStarted, startTimer]);

  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && isRunning) {
      play('tick');
    }
  }, [timeLeft, isRunning, play]);

  if (!session || !question) return null;

  const handleSubmitAnswer = (playerId: string, answer: string | number) => {
    submitAnswer(playerId, answer);
    play('reveal');
    const nextIdx = currentPassPlayIdx + 1;
    if (nextIdx < activePlayers.length) {
      setCurrentPassPlayIdx(nextIdx);
    }
  };

  const handleReveal = () => {
    play('reveal');
    revealAnswers();
    setCurrentPassPlayIdx(0);
    resetTimer();
  };

  const currentPlayer = activePlayers[currentPassPlayIdx];
  const allAnswered = session.allAnswersIn || activePlayers.every((p) => p.hasAnswered);

  return (
    <div className="noise min-h-dvh flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center top, ${getDiffGradient(difficulty)}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex-1" />
          <button
            onClick={() => setScreen('results')}
            className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1"
          >
            End Game
          </button>
        </div>
        <Timer timeLeft={timeLeft} progress={progress} />

        <div className="mt-4 mb-6">
          <PlayerStatusBar players={session.players} showAnswerStatus={true} />
        </div>

        <QuestionDisplay
          question={question}
          roundIndex={session.currentRound}
          difficulty={difficulty}
          points={points}
          totalRounds={tiers.length}
        />

        <div className="mt-6 flex-1">
          <AnimatePresence mode="wait">
            {isMultiplayer ? (
              /* ── Multiplayer: host screen waits for ready / answers ── */
              !session.timerStarted ? (
                <motion.div
                  key="waiting-ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary text-lg mb-2">Waiting for players to get ready...</p>
                  <motion.button
                    onClick={() => {
                      useGameStore.setState({
                        session: { ...session, timerStarted: true },
                      });
                    }}
                    className="mt-4 py-3 px-8 rounded-lg font-display text-lg tracking-wider bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/30 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    START ROUND
                  </motion.button>
                </motion.div>
              ) : !allAnswered ? (
                <motion.div
                  key="waiting-remote"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary text-lg mb-2">Waiting for answers...</p>
                  <p className="text-text-muted text-sm">
                    {activePlayers.filter((p) => p.hasAnswered).length} / {activePlayers.length} locked in
                  </p>
                  <motion.button
                    onClick={() => {
                      setAllAnswersIn();
                    }}
                    className="mt-4 py-2 px-6 rounded-lg font-display text-sm tracking-wider bg-neon-gold/20 text-neon-gold border border-neon-gold/40 hover:bg-neon-gold/30 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    CLOSE ANSWERS
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="all-in-mp"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-text-secondary mb-4 text-lg">All answers are in!</p>
                  <RevealButton onClick={handleReveal} />
                </motion.div>
              )
            ) : (
              /* ── Local pass-and-play mode ── */
              !allAnswered && currentPlayer ? (
                <motion.div
                  key={currentPlayer.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <AnswerInput
                    question={question}
                    onSubmit={(answer) => handleSubmitAnswer(currentPlayer.id, answer)}
                    playerName={currentPlayer.name}
                    playerColour={currentPlayer.colour}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="all-in"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-text-secondary mb-4 text-lg">All answers are in!</p>
                  <RevealButton onClick={handleReveal} />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RevealButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="py-4 px-10 rounded-xl font-display text-2xl tracking-wider bg-gradient-to-r from-neon-gold to-amber-400 text-bg-deep hover:brightness-110 box-glow-gold"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      animate={{
        boxShadow: [
          '0 0 8px rgba(255,215,0,0.3)',
          '0 0 24px rgba(255,215,0,0.5)',
          '0 0 8px rgba(255,215,0,0.3)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      REVEAL ANSWER
    </motion.button>
  );
}

function getDiffGradient(difficulty: number): string {
  if (difficulty >= 70) return '#00FF88';
  if (difficulty >= 40) return '#FFD700';
  if (difficulty >= 10) return '#FF8C00';
  return '#FF2D6B';
}
