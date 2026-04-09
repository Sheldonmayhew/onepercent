import { useEffect, useRef, Suspense } from 'react';
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
import { getRoundDefinition } from '../roundTypes/registry';

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

  // Auto-reveal for timed_reveal (Snap) and progressive_reveal (LookBeforeYouLeap)
  const autoRevealInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (autoRevealInterval.current) {
      clearInterval(autoRevealInterval.current);
      autoRevealInterval.current = null;
    }

    if (!session) return;
    const timerActive = isQuickPlay || session.timerStarted;
    if (!timerActive) return;

    const roundTypeId = session.roundTypeSequence?.[session.currentRound];
    if (!roundTypeId) return;
    const def = getRoundDefinition(roundTypeId);
    const q = getCurrentQuestion();
    if (!q) return;

    // Snap: reveal answer options one at a time
    if (def.questionFormat === 'timed_reveal' && q.options) {
      const delayMs = q.reveal_delay_ms ?? 3000;
      const total = q.options.length;

      // Reveal first option immediately if none revealed yet
      const cur = (session.activeRoundState as any)?.revealedOptions ?? [];
      if (cur.length === 0) {
        useGameStore.getState().updateRoundState((prev: any) => ({
          ...prev,
          revealedOptions: [0],
        }));
        if (isHost) broadcastHostState();
      }

      autoRevealInterval.current = setInterval(() => {
        const s = useGameStore.getState().session;
        if (!s) return;
        const revealed: number[] = (s.activeRoundState as any)?.revealedOptions ?? [];
        if (revealed.length >= total) {
          clearInterval(autoRevealInterval.current!);
          autoRevealInterval.current = null;
          return;
        }
        const nextIdx = revealed.length;
        useGameStore.getState().updateRoundState((prev: any) => ({
          ...prev,
          revealedOptions: [...((prev as any)?.revealedOptions ?? []), nextIdx],
        }));
        if (isHost) broadcastHostState();
      }, delayMs);
    }

    // LookBeforeYouLeap: reveal clue chunks one at a time
    if (def.questionFormat === 'progressive_reveal' && q.reveal_chunks) {
      const total = q.reveal_chunks.length;
      // Spread reveals over ~80% of the timer, leaving time to answer at end
      const chunkDelay = Math.floor((q.time_limit_seconds * 1000 * 0.8) / Math.max(total, 1));

      // Reveal first chunk immediately if none revealed yet
      const cur = (session.activeRoundState as any)?.revealedChunks ?? 0;
      if (cur === 0) {
        useGameStore.getState().updateRoundState((prev: any) => ({
          ...prev,
          revealedChunks: 1,
        }));
        if (isHost) broadcastHostState();
      }

      autoRevealInterval.current = setInterval(() => {
        const s = useGameStore.getState().session;
        if (!s) return;
        const current: number = (s.activeRoundState as any)?.revealedChunks ?? 0;
        if (current >= total) {
          clearInterval(autoRevealInterval.current!);
          autoRevealInterval.current = null;
          return;
        }
        useGameStore.getState().updateRoundState((prev: any) => ({
          ...prev,
          revealedChunks: ((prev as any)?.revealedChunks ?? 0) + 1,
        }));
        if (isHost) broadcastHostState();
      }, chunkDelay);
    }

    return () => {
      if (autoRevealInterval.current) {
        clearInterval(autoRevealInterval.current);
        autoRevealInterval.current = null;
      }
    };
  }, [session?.currentRound, session?.timerStarted, isQuickPlay, isHost]);

  // Switchagories: auto-transition from picking → answering when all players have picked
  useEffect(() => {
    if (!session) return;
    const roundTypeId = session.roundTypeSequence?.[session.currentRound];
    if (!roundTypeId) return;
    const def = getRoundDefinition(roundTypeId);
    if (def.questionFormat !== 'categorized') return;

    const state = session.activeRoundState as any;
    if (state?.phase === 'answering') return;

    const picks: Record<string, string> = state?.categoryPicks ?? {};
    const activePlayers = getActivePlayers();
    const allPicked = activePlayers.length > 0 && activePlayers.every((p) => picks[p.id]);

    if (allPicked) {
      useGameStore.getState().updateRoundState((prev: any) => ({
        ...prev,
        phase: 'answering',
      }));
      if (isHost) broadcastHostState();
    }
  });

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
            questionInRound={session.currentQuestionInRound}
            questionsInRound={session.selectedQuestions[roundIndex]?.length ?? 1}
          />
          {players.length > 1 && (
            <PlayerStatusBar players={players} showAnswerStatus />
          )}
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

  const handleCloseAnswers = () => {
    setAllAnswersIn();
    broadcastHostState();
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
          questionInRound={session.currentQuestionInRound}
          questionsInRound={session.selectedQuestions[roundIndex]?.length ?? 1}
        />

        {/* Player answer status */}
        <PlayerStatusBar players={nonHostPlayers} showAnswerStatus />

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
                  onSubmit={(_, answer) => {
                    handleHostAnswer(answer);
                  }}
                  onBuzzIn={(_, timestamp, answer) => {
                    // Host buzz-in: store timestamp + submit
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

        {/* Round-type-specific host controls */}
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
          <motion.div
            className="flex flex-col items-center gap-4 py-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-neon-green font-display tracking-wide text-base text-center">
              ALL ANSWERS IN — REVEALING…
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
