import { useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import type { BroadcastRound } from '../stores/multiplayerStore';
import TvLobby from '../components/Tv/TvLobby';
import TvRoundIntro from '../components/Tv/TvRoundIntro';
import TvPlay from '../components/Tv/TvPlay';
import TvReveal from '../components/Tv/TvReveal';
import TvResults from '../components/Tv/TvResults';
import { getRoundDefinition } from '../roundTypes/registry';
import TvOverlayManager from '../components/GameShowOverlay/TvOverlayManager';

function getPhase(route: string): string {
  if (route.includes('/lobby')) return 'lobby';
  if (route.includes('/round-intro')) return 'round-intro';
  if (route.includes('/play')) return 'play';
  if (route.includes('/reveal')) return 'reveal';
  if (route.includes('/results')) return 'results';
  return 'lobby';
}

export function Component() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const role = useMultiplayerStore((s) => s.role);
  const roomCode = useMultiplayerStore((s) => s.roomCode);

  // Remember the last round data from the play phase so we can show it during reveal
  const lastRoundRef = useRef<BroadcastRound | null>(null);
  if (gameState?.round) {
    lastRoundRef.current = gameState.round;
  }

  // Redirect if not connected as spectator
  useEffect(() => {
    if (role !== 'spectator') {
      navigate('/tv', { replace: true });
    }
  }, [role, navigate]);

  // Handle game_ended (role gets reset to null by the hook)
  useEffect(() => {
    if (role === null && !gameState) {
      navigate('/tv', { replace: true });
    }
  }, [role, gameState, navigate]);

  if (!gameState) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg-primary">
        <motion.div
          className="flex flex-col items-center gap-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
          <p className="text-text-secondary font-display text-2xl tracking-wide">
            WAITING FOR HOST...
          </p>
          {roomCode && (
            <p className="text-text-muted font-display text-lg tracking-[0.3em]">{roomCode}</p>
          )}
        </motion.div>
      </div>
    );
  }

  const phase = getPhase(gameState.route);

  return (
    <TvOverlayManager>
      <div className="min-h-dvh bg-bg-primary overflow-hidden">
      {/* Room code watermark — always visible, bottom-right */}
      {roomCode && (
        <div className="fixed bottom-4 right-6 z-50 opacity-30">
          <span className="font-display text-sm text-text-muted tracking-[0.2em]">
            {roomCode}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvLobby gameState={gameState} roomCode={roomCode} />
          </motion.div>
        )}
        {phase === 'round-intro' && (() => {
          const roundType = gameState.round?.roundType;
          if (roundType) {
            const def = getRoundDefinition(roundType);
            const RoundIntro = def.slots.TvIntro;
            const round = gameState.round!;
            return (
              <motion.div key="round-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<TvRoundIntro gameState={gameState} />}>
                  <RoundIntro
                    roundIndex={round.index}
                    totalRounds={round.totalRounds}
                    difficulty={round.difficulty}
                    points={round.points}
                    roundName={def.name}
                    tagline={def.tagline}
                    theme={def.theme}
                  />
                </Suspense>
              </motion.div>
            );
          }
          return (
            <motion.div key="round-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TvRoundIntro gameState={gameState} />
            </motion.div>
          );
        })()}
        {phase === 'play' && (() => {
          const roundType = gameState.round?.roundType;
          if (roundType) {
            const def = getRoundDefinition(roundType);
            const RoundTvPlay = def.slots.TvPlay;
            const round = gameState.round!;
            return (
              <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<TvPlay gameState={gameState} />}>
                  <RoundTvPlay
                    question={{
                      id: `round-${round.index}`,
                      difficulty: round.difficulty,
                      type: round.question.type,
                      time_limit_seconds: round.timerDuration,
                      question: round.question.question,
                      options: round.question.options,
                      correct_answer: 0,
                      explanation: '',
                      image_url: round.question.image_url,
                      sequence_items: round.question.sequence_items,
                      correct_answers: round.question.correct_answers,
                      ranking_criterion: round.question.ranking_criterion,
                      reveal_delay_ms: round.question.reveal_delay_ms,
                      reveal_chunks: round.question.reveal_chunks,
                      categories: round.question.categories,
                    }}
                    players={gameState.players.map((p) => ({
                      ...p,
                      currentAnswer: null,
                      score: p.score,
                    }))}
                    roundState={round.roundState}
                    timerStarted={gameState.timerStarted ?? false}
                    allAnswersIn={false}
                    roundIndex={round.index}
                    difficulty={round.difficulty}
                    points={round.points}
                    theme={def.theme}
                  />
                </Suspense>
              </motion.div>
            );
          }
          return (
            <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TvPlay gameState={gameState} />
            </motion.div>
          );
        })()}
        {phase === 'reveal' && (() => {
          const roundType = gameState.reveal?.roundType ?? lastRoundRef.current?.roundType;
          if (roundType) {
            const def = getRoundDefinition(roundType);
            const RoundTvReveal = def.slots.TvReveal;
            const lastRound = lastRoundRef.current;
            const reveal = gameState.reveal;
            if (reveal && lastRound) {
              return (
                <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Suspense fallback={<TvReveal gameState={gameState} lastRound={lastRoundRef.current} />}>
                    <RoundTvReveal
                      question={{
                        id: `round-${lastRound.index}`,
                        difficulty: lastRound.difficulty,
                        type: lastRound.question.type,
                        time_limit_seconds: lastRound.timerDuration,
                        question: lastRound.question.question,
                        options: lastRound.question.options,
                        correct_answer: 0,
                        explanation: '',
                        image_url: lastRound.question.image_url,
                        sequence_items: lastRound.question.sequence_items,
                      }}
                      players={gameState.players.map((p) => ({
                        ...p,
                        currentAnswer: null,
                        score: p.score,
                      }))}
                      roundState={lastRound.roundState}
                      correctAnswer={reveal.correctAnswer}
                      explanation={reveal.explanation}
                      correctPlayerIds={reveal.correctPlayerIds}
                      incorrectPlayerIds={reveal.incorrectPlayerIds}
                      scoreUpdates={reveal.scoreUpdates ?? []}
                      theme={def.theme}
                      teams={gameState.teams}
                    />
                  </Suspense>
                </motion.div>
              );
            }
          }
          return (
            <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TvReveal gameState={gameState} lastRound={lastRoundRef.current} />
            </motion.div>
          );
        })()}
        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TvResults gameState={gameState} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </TvOverlayManager>
  );
}
