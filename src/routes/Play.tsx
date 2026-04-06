import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { useTimer } from '../hooks/useTimer';
import { useSound } from '../hooks/useSound';
import { DEFAULT_TIMER_SECONDS } from '../types';
import QuestionDisplay from '../components/Game/QuestionDisplay';
import AnswerInput from '../components/Game/AnswerInput';
import PlayerStatusBar from '../components/Game/PlayerStatusBar';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = useGameStore((s) => s.session);
  const getCurrentQuestion = useGameStore((s) => s.getCurrentQuestion);
  const getActivePlayers = useGameStore((s) => s.getActivePlayers);
  const getCurrentDifficulty = useGameStore((s) => s.getCurrentDifficulty);
  const getCurrentPoints = useGameStore((s) => s.getCurrentPoints);
  const getTotalRounds = useGameStore((s) => s.getTotalRounds);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const revealAnswers = useGameStore((s) => s.revealAnswers);
  const advancePassAndPlay = useGameStore((s) => s.advancePassAndPlay);
  const setAllAnswersIn = useGameStore((s) => s.setAllAnswersIn);

  const role = useMultiplayerStore((s) => s.role);
  const { play } = useSound();

  const prefix = location.pathname.startsWith('/host') ? '/host' : '/quick-play';
  const isHost = role === 'host';
  const isQuickPlay = prefix === '/quick-play';

  const revealCalledRef = useRef(false);

  // Timer expire handler
  const handleTimerExpire = () => {
    play('timer_expired');
    if (!revealCalledRef.current) {
      setAllAnswersIn();
    }
  };

  const { timeLeft, progress, isRunning, start } = useTimer({
    duration: DEFAULT_TIMER_SECONDS,
    onExpire: handleTimerExpire,
    autoStart: isQuickPlay,
  });

  // Sound: tick on each second change
  const prevTimeRef = useRef(DEFAULT_TIMER_SECONDS);
  useEffect(() => {
    if (isRunning && timeLeft !== prevTimeRef.current && timeLeft > 0 && timeLeft <= 10) {
      play('timer_tick');
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft, isRunning, play]);

  // Host: watch for timerStarted flag from realtime
  useEffect(() => {
    if (isHost && session?.timerStarted && !isRunning) {
      start();
    }
  }, [isHost, session?.timerStarted, isRunning, start]);

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  // Watch allAnswersIn — trigger reveal
  useEffect(() => {
    if (!session?.allAnswersIn) return;
    if (revealCalledRef.current) return;
    revealCalledRef.current = true;

    const doReveal = () => {
      revealAnswers();
      if (isHost) {
        broadcastHostState('/player/reveal');
      }
      navigate(`${prefix}/reveal`, { replace: true });
    };

    if (isQuickPlay) {
      // Small delay so the player sees the locked-in state before transition
      setTimeout(doReveal, 500);
    } else {
      // Host must tap "REVEAL ANSWER" — don't auto-navigate
      revealCalledRef.current = false;
    }
  }, [session?.allAnswersIn, isQuickPlay, isHost, revealAnswers, navigate, prefix]);

  if (!session) return null;

  const question = getCurrentQuestion();
  const players = getActivePlayers();
  const difficulty = getCurrentDifficulty();
  const points = getCurrentPoints();
  const totalRounds = getTotalRounds();
  const roundIndex = session.currentRound;

  if (!question) {
    navigate(`${prefix}/results`, { replace: true });
    return null;
  }

  const handleEndGame = () => {
    navigate(`${prefix}/results`, { replace: true });
  };

  // ── Quick Play (Pass & Play) ──────────────────────────────────────────────
  if (isQuickPlay) {
    const currentPlayer = players[session.currentPlayerIndex] ?? players[0];

    const handleAnswer = (answer: string | number) => {
      if (!currentPlayer) return;
      play('answer_submitted');
      submitAnswer(currentPlayer.id, answer);
      advancePassAndPlay();
      // allAnswersIn will trigger the reveal effect above
    };

    return (
      <motion.div
        className="min-h-dvh flex flex-col bg-bg-primary px-4 pt-6 pb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 w-full max-w-lg mx-auto">
          <div className="flex-1" />
          <button
            onClick={handleEndGame}
            className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1 rounded"
          >
            END GAME
          </button>
        </div>

        <div className="w-full max-w-lg mx-auto flex flex-col gap-5 flex-1">
          <QuestionDisplay
            question={question}
            roundIndex={roundIndex}
            difficulty={difficulty}
            points={points}
            totalRounds={totalRounds}
            categoryName={question?.category ?? session.pack?.name}
            playerName={currentPlayer?.name}
            playerColour={currentPlayer?.colour}
            timeLeft={timeLeft}
            timerProgress={progress}
            showTimer
          />
          {players.length > 1 && (
            <PlayerStatusBar players={players} showAnswerStatus />
          )}
          {currentPlayer && !session.allAnswersIn && (
            <AnswerInput
              key={`${roundIndex}-${currentPlayer.id}`}
              question={question}
              onSubmit={handleAnswer}
              playerName={currentPlayer.name}
              playerColour={currentPlayer.colour}
            />
          )}
          {session.allAnswersIn && (
            <motion.p
              className="text-center text-neon-green font-display tracking-wide text-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              ALL ANSWERS IN — REVEALING…
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Host (Multiplayer) ────────────────────────────────────────────────────
  const hostPlayer = players.find((p) => p.isHost);
  const hostHasAnswered = hostPlayer?.hasAnswered ?? false;
  const nonHostPlayers = players.filter((p) => !p.isHost);
  const allAnswersIn = session.allAnswersIn;
  const timerStarted = session.timerStarted;

  const handleHostAnswer = (answer: string | number) => {
    if (!hostPlayer) return;
    play('answer_submitted');
    submitAnswer(hostPlayer.id, answer);
    broadcastHostState();
  };

  const handleStartRound = () => {
    useGameStore.setState({
      session: { ...session, timerStarted: true },
    });
    broadcastHostState();
    start();
  };

  const handleCloseAnswers = () => {
    setAllAnswersIn();
    broadcastHostState();
  };

  const handleReveal = () => {
    if (revealCalledRef.current) return;
    revealCalledRef.current = true;
    revealAnswers();
    broadcastHostState('/player/reveal');
    navigate(`${prefix}/reveal`, { replace: true });
  };

  return (
    <motion.div
      className="min-h-dvh flex flex-col bg-bg-primary px-4 pt-6 pb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 w-full max-w-lg mx-auto">
        <div className="flex-1" />
        <button
          onClick={handleEndGame}
          className="text-xs text-text-muted hover:text-neon-pink transition-colors px-2 py-1 rounded"
        >
          END GAME
        </button>
      </div>

      <div className="w-full max-w-lg mx-auto flex flex-col gap-5 flex-1">
        <QuestionDisplay
          question={question}
          roundIndex={roundIndex}
          difficulty={difficulty}
          points={points}
          totalRounds={totalRounds}
          categoryName={question?.category ?? session.pack?.name}
          playerName={hostPlayer?.name}
          playerColour={hostPlayer?.colour}
          timeLeft={timeLeft}
          timerProgress={progress}
          showTimer={timerStarted}
        />

        {/* Player answer status */}
        <PlayerStatusBar players={nonHostPlayers} showAnswerStatus />

        {/* State-based host UI */}
        {!timerStarted && (
          <motion.div
            className="flex flex-col items-center gap-4 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-text-muted text-sm text-center">
              Waiting for players to get ready…
            </p>
            <motion.button
              onClick={handleStartRound}
              className="px-8 py-3 rounded-full font-display tracking-wide text-base bg-gradient-to-r from-neon-cyan to-primary-container text-white shadow-primary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              START ROUND
            </motion.button>
          </motion.div>
        )}

        {timerStarted && hostPlayer && !hostHasAnswered && (
          <AnswerInput
            key={`host-${roundIndex}`}
            question={question}
            onSubmit={handleHostAnswer}
            playerName={hostPlayer.name}
            playerColour={hostPlayer.colour}
          />
        )}

        {timerStarted && hostHasAnswered && !allAnswersIn && (
          <motion.div
            className="flex flex-col items-center gap-4 py-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-text-muted text-sm">Waiting for players to answer…</p>
            <motion.button
              onClick={handleCloseAnswers}
              className="px-6 py-2.5 rounded-full font-display tracking-wide text-sm bg-bg-card shadow-soft text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              CLOSE ANSWERS
            </motion.button>
          </motion.div>
        )}

        {allAnswersIn && (
          <motion.div
            className="flex flex-col items-center gap-4 py-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-neon-green font-display tracking-wide text-base text-center">
              ALL ANSWERS IN
            </p>
            <motion.button
              onClick={handleReveal}
              className="px-10 py-4 rounded-full font-display text-xl tracking-wide bg-gradient-to-r from-neon-gold to-neon-pink text-white shadow-primary"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              REVEAL ANSWER
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
