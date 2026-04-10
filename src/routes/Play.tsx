import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { broadcastHostState } from '../hooks/useMultiplayer';
import { useTimer } from '../hooks/useTimer';
import { useSound } from '../hooks/useSound';
import { useAutoReveal } from '../hooks/useAutoReveal';
import { DEFAULT_TIMER_SECONDS } from '../types';
import QuickPlayView from '../components/Game/QuickPlayView';
import HostPlayView from '../components/Game/HostPlayView';

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

  const { timeLeft, progress, isRunning } = useTimer({
    duration: DEFAULT_TIMER_SECONDS,
    onExpire: handleTimerExpire,
    autoStart: true,
  });

  // Sound: tick on each second change
  const prevTimeRef = useRef(DEFAULT_TIMER_SECONDS);
  useEffect(() => {
    if (isRunning && timeLeft !== prevTimeRef.current && timeLeft > 0 && timeLeft <= 10) {
      play('timer_tick');
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft, isRunning, play]);

  // Host: auto-start timer and broadcast to players on mount
  useEffect(() => {
    if (isHost && session && !session.timerStarted) {
      useGameStore.setState({
        session: { ...session, timerStarted: true },
      });
      broadcastHostState();
    }
  }, [isHost, session?.timerStarted]);

  // Auto-reveal for timed_reveal, progressive_reveal, and Switchagories
  useAutoReveal({ session, isQuickPlay, isHost, getCurrentQuestion, getActivePlayers });

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

    // Small delay so the player sees the locked-in state before transition
    setTimeout(doReveal, 500);
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

  if (isQuickPlay) {
    return (
      <QuickPlayView
        session={session}
        question={question}
        players={players}
        roundIndex={roundIndex}
        difficulty={difficulty}
        points={points}
        totalRounds={totalRounds}
        timeLeft={timeLeft}
        progress={progress}
        submitAnswer={submitAnswer}
        advancePassAndPlay={advancePassAndPlay}
        handleEndGame={handleEndGame}
        play={play}
      />
    );
  }

  return (
    <HostPlayView
      session={session}
      question={question}
      players={players}
      roundIndex={roundIndex}
      difficulty={difficulty}
      points={points}
      totalRounds={totalRounds}
      timeLeft={timeLeft}
      progress={progress}
      submitAnswer={submitAnswer}
      setAllAnswersIn={setAllAnswersIn}
      handleEndGame={handleEndGame}
      play={play}
    />
  );
}
