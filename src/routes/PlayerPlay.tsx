import { useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../hooks/useMultiplayer';
import { useTimer } from '../hooks/useTimer';
import AnswerInput from '../components/Game/AnswerInput';
import { BottomNavProvider, useBottomNav } from '../components/Game/BottomNavContext';
import { getRoundDefinition } from '../roundTypes/registry';
import { formatRands } from '../utils/helpers';

const CURRENT_ROUTE = '/player/play';

export function Component() {
  return (
    <BottomNavProvider>
      <PlayerPlayInner />
    </BottomNavProvider>
  );
}

function PlayerPlayInner() {
  const navigate = useNavigate();
  const gameState = useMultiplayerStore((s) => s.gameState);
  const playerId = useMultiplayerStore((s) => s.playerId);
  const playerName = useMultiplayerStore((s) => s.playerName);
  const { disconnect, sendAnswer, sendBuzzIn } = usePlayerMultiplayer();
  const mpReset = useMultiplayerStore((s) => s.reset);

  const me = gameState?.players.find((p) => p.id === playerId);
  const others = gameState?.players.filter((p) => p.id !== playerId) ?? [];
  const round = gameState?.round;
  const timerStarted = gameState?.timerStarted ?? false;

  const lockedIn = useRef(false);
  const timerDuration = round?.timerDuration ?? 30;

  const { timeLeft, progress, start } = useTimer({
    duration: timerDuration,
    autoStart: false,
  });

  useEffect(() => {
    if (timerStarted) start();
  }, [timerStarted, start]);

  useEffect(() => {
    if (gameState?.route && gameState.route !== CURRENT_ROUTE) {
      navigate(gameState.route, { replace: true });
    }
  }, [gameState?.route, navigate]);

  const handleAnswer = (answer: string | number) => {
    if (lockedIn.current || !playerId) return;
    lockedIn.current = true;
    sendAnswer(playerId, answer);
  };

  const handleLeave = () => {
    disconnect();
    mpReset();
    navigate('/', { replace: true });
  };

  const isLockedIn = me?.hasAnswered ?? lockedIn.current;
  const playerColour = me?.colour ?? '#4F46E5';

  const isUrgent = timeLeft <= 5;
  const isCritical = timeLeft <= 3;
  const timerColor = isCritical ? 'bg-neon-pink' : isUrgent ? 'bg-neon-gold' : 'bg-neon-cyan';

  const bottomNav = useBottomNav();
  const ctaState = bottomNav?.ctaState ?? null;
  const showLockIn = timerStarted && !isLockedIn && ctaState && !ctaState.isLocked;

  return (
    <div className="h-dvh flex flex-col bg-bg-primary safe-area-top overflow-hidden">
      {/* Timer bar */}
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

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-2 shrink-0">
        <div className="flex items-center gap-2">
          {me && <span className="text-xl">{me.avatar}</span>}
          <div>
            <p className="font-medium text-text-primary text-xs">{playerName}</p>
            {me && <p className="text-[10px] text-neon-gold font-score">R{me.score.toLocaleString('en-ZA')}</p>}
          </div>
        </div>
        {timerStarted && (
          <span className={`font-score text-sm font-bold tabular-nums ${isCritical ? 'text-neon-pink animate-timer-pulse' : isUrgent ? 'text-neon-gold' : 'text-text-secondary'}`}>
            {timeLeft}s
          </span>
        )}
        <button onClick={handleLeave} className="text-[10px] text-text-muted hover:text-neon-pink transition-colors px-2 py-1 rounded">
          LEAVE
        </button>
      </div>

      {/* Question card */}
      {round && (
        <div className="shrink-0 px-4 sm:px-8 lg:px-12 pb-3">
          <motion.div
            className="bg-bg-card shadow-soft-md rounded-2xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              {round.categoryName && (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-bg-elevated text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  {round.categoryName}
                </span>
              )}
              <span className="font-display text-sm font-bold italic text-neon-purple">
                {formatRands(round.points)}
              </span>
            </div>
            <p className="font-responsive-question font-bold text-text-primary leading-snug">
              {round.question.question}
            </p>
            {round.question.image_url && (
              <img src={round.question.image_url} alt="Question visual" className="mt-3 rounded-xl max-h-32 mx-auto object-contain" />
            )}
          </motion.div>
        </div>
      )}

      {/* Answer area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 pb-2">
        {/* Other players */}
        {others.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {others.map((p) => (
                <div key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm border ${p.hasAnswered ? 'bg-neon-green/10 border-neon-green/20' : 'bg-bg-card border-transparent shadow-soft'}`}>
                  <span>{p.avatar}</span>
                  <span className="text-text-primary font-medium">{p.name}</span>
                  {p.hasAnswered && <span className="text-neon-green text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {!timerStarted && !isLockedIn && (
          <motion.div
            className="flex items-center justify-center gap-3 py-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <div className="w-2 h-2 rounded-full bg-neon-cyan" />
            <p className="text-text-muted text-sm">Waiting for host to start…</p>
          </motion.div>
        )}

        {timerStarted && !isLockedIn && round && (() => {
          const roundType = round.roundType;
          const questionObj = {
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
          };

          if (roundType) {
            const def = getRoundDefinition(roundType);
            const RoundInput = def.slots.PlayerInput;
            const playersAsPlayers = gameState!.players.map((p) => ({
              ...p,
              currentAnswer: null as string | number | null,
              colour: p.colour,
            }));

            return (
              <Suspense fallback={
                <AnswerInput key={`player-${round.index}`} question={questionObj} onSubmit={handleAnswer} playerName={playerName ?? 'You'} playerColour={playerColour} />
              }>
                <RoundInput
                  key={`player-${round.index}-rt`}
                  question={questionObj}
                  players={playersAsPlayers}
                  roundState={round.roundState}
                  onSubmit={(_, answer) => handleAnswer(answer)}
                  onBuzzIn={playerId ? (_, timestamp, answer) => { sendBuzzIn(playerId, timestamp, answer); } : undefined}
                  onUpdateState={() => {}}
                  playerId={playerId ?? ''}
                  timerStarted={timerStarted}
                  allAnswersIn={false}
                  isHost={false}
                />
              </Suspense>
            );
          }

          return (
            <AnswerInput key={`player-${round.index}`} question={questionObj} onSubmit={handleAnswer} playerName={playerName ?? 'You'} playerColour={playerColour} />
          );
        })()}

        {isLockedIn && (
          <motion.div
            className="flex flex-col items-center gap-3 py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-14 h-14 rounded-full bg-neon-green/20 border-2 border-neon-green/40 flex items-center justify-center">
              <span className="text-2xl text-neon-green">✓</span>
            </div>
            <p className="font-display text-xl tracking-wide text-neon-green">LOCKED IN</p>
          </motion.div>
        )}
      </div>

      {/* Bottom nav */}
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
        ) : isLockedIn ? (
          <div className="w-full py-3.5 rounded-2xl text-center font-display text-lg font-bold tracking-wide bg-neon-green/10 text-neon-green">
            LOCKED IN
          </div>
        ) : !timerStarted ? (
          <div className="w-full py-3.5 rounded-2xl text-center font-display text-sm tracking-wide text-text-muted">
            Waiting for host…
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
