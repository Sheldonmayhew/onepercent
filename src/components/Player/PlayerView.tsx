import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerStore } from '../../stores/multiplayerStore';
import { usePlayerMultiplayer } from '../../hooks/useMultiplayer';
import { useTimer } from '../../hooks/useTimer';
import { formatRands, getDifficultyColour } from '../../utils/helpers';
import Timer from '../Game/Timer';

export default function PlayerView() {
  const { playerId, playerName, roomCode, gameState, isConnected, reset } = useMultiplayerStore();
  const { sendReady, sendAnswer, sendBankDecision, disconnect } = usePlayerMultiplayer();

  const handleLeave = () => {
    disconnect();
    reset();
  };

  if (!isConnected || !gameState) {
    return <PlayerWaiting roomCode={roomCode} />;
  }

  const me = gameState.players.find((p) => p.id === playerId);

  return (
    <div className="noise min-h-dvh flex flex-col relative overflow-hidden">
      {/* Header bar */}
      <div className="bg-bg-surface/80 backdrop-blur border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{me?.avatar ?? '����'}</span>
          <span className="font-medium text-text-primary text-sm">{playerName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-score text-sm text-neon-gold font-bold">
            {formatRands(me?.score ?? 0)}
          </span>
          <button
            onClick={handleLeave}
            className="text-xs text-text-muted hover:text-neon-pink transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          {me?.isEliminated && gameState.screen !== 'results' ? (
            <PlayerEliminated key="eliminated" score={me.score} />
          ) : me?.isBanked && gameState.screen !== 'results' ? (
            <PlayerBanked key="banked" score={me.score} />
          ) : gameState.screen === 'lobby' ? (
            <PlayerLobbyView key="lobby" gameState={gameState} />
          ) : gameState.screen === 'playing' ? (
            <PlayerQuestionView
              key={`q-${gameState.round?.index}`}
              gameState={gameState}
              playerId={playerId!}
              me={me!}
              onReady={sendReady}
              onAnswer={sendAnswer}
            />
          ) : gameState.screen === 'reveal' ? (
            <PlayerRevealView key="reveal" gameState={gameState} playerId={playerId!} />
          ) : gameState.screen === 'banking' ? (
            <PlayerBankingView
              key="banking"
              gameState={gameState}
              playerId={playerId!}
              me={me!}
              onDecision={sendBankDecision}
            />
          ) : gameState.screen === 'results' ? (
            <PlayerResultsView key="results" gameState={gameState} playerId={playerId!} />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sub-views ───────────────────────────────

function PlayerWaiting({ roomCode }: { roomCode: string | null }) {
  return (
    <div className="noise min-h-dvh flex flex-col items-center justify-center px-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Connecting to room <span className="font-score text-neon-cyan">{roomCode}</span>...</p>
      </motion.div>
    </div>
  );
}

function PlayerLobbyView({ gameState }: { gameState: any }) {
  return (
    <motion.div
      className="text-center w-full max-w-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-5xl mb-4">🎮</div>
      <h2 className="font-display text-3xl text-neon-cyan glow-cyan mb-2">YOU'RE IN!</h2>
      <p className="text-text-secondary mb-6">Waiting for the host to start the game...</p>

      <div className="bg-bg-surface/60 border border-white/5 rounded-xl p-4">
        <span className="text-xs text-text-muted block mb-2">Players joined</span>
        <div className="flex flex-wrap gap-2 justify-center">
          {gameState.players.map((p: any) => (
            <span
              key={p.id}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-elevated text-sm"
              style={{ color: p.colour }}
            >
              {p.avatar} {p.name}
            </span>
          ))}
        </div>
      </div>

      {gameState.packName && (
        <p className="text-text-muted text-xs mt-4">
          {gameState.modeName?.toUpperCase()} • {gameState.packName}
        </p>
      )}
    </motion.div>
  );
}

function PlayerQuestionView({
  gameState,
  playerId,
  me,
  onReady,
  onAnswer,
}: {
  gameState: any;
  playerId: string;
  me: any;
  onReady: (id: string, roundIndex: number) => void;
  onAnswer: (id: string, answer: string | number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [numericValue, setNumericValue] = useState('');
  const [locked, setLocked] = useState(false);
  const round = gameState.round;

  // Reset state when round changes
  useEffect(() => {
    setSelected(null);
    setNumericValue('');
    setLocked(false);
  }, [round?.index]);

  // Tell the host we're ready for this round
  useEffect(() => {
    onReady(playerId, round?.index ?? 0);
  }, [round?.index, playerId, onReady]);

  const { timeLeft, progress, start: startTimer } = useTimer({
    duration: round?.timerDuration ?? 30,
    autoStart: false,
    onExpire: () => {
      if (!locked) {
        setLocked(true);
      }
    },
  });

  // Start timer only when host confirms all players are ready
  useEffect(() => {
    if (gameState.timerStarted) {
      startTimer();
    }
  }, [gameState.timerStarted, startTimer]);

  if (!round) return null;
  const q = round.question;
  const diffColour = getDifficultyColour(round.difficulty);

  const handleLock = () => {
    if (locked) return;
    setLocked(true);
    if (q.type === 'multiple_choice' || q.type === 'image_based') {
      if (selected !== null) onAnswer(playerId, selected);
    } else if (q.type === 'numeric_input') {
      if (numericValue.trim()) onAnswer(playerId, Number(numericValue));
    }
  };

  if (me.hasAnswered || locked) {
    return (
      <motion.div
        className="text-center w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-5xl mb-3">🔒</div>
        <h2 className="font-display text-2xl text-neon-green glow-green mb-2">LOCKED IN</h2>
        <p className="text-text-secondary text-sm">Waiting for other players...</p>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {gameState.players
            .filter((p: any) => !p.isEliminated && !p.isBanked)
            .map((p: any) => (
              <span
                key={p.id}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  p.hasAnswered ? 'bg-neon-green/10 text-neon-green' : 'bg-bg-elevated text-text-muted'
                }`}
              >
                {p.avatar} {p.hasAnswered ? '✓' : '...'}
              </span>
            ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      {/* Timer + Round info */}
      <div className="mb-4">
        <Timer timeLeft={timeLeft} progress={progress} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-2xl font-bold" style={{ color: diffColour }}>
          {round.difficulty}%
        </span>
        <span className="font-score text-sm text-neon-gold">
          R{round.points.toLocaleString()}
        </span>
      </div>

      {/* Question */}
      <div className="bg-bg-surface/80 border border-white/5 rounded-xl p-4 mb-4">
        <p className="text-lg font-medium text-text-primary leading-relaxed">{q.question}</p>
      </div>

      {/* Multiple Choice */}
      {(q.type === 'multiple_choice' || q.type === 'image_based') && q.options && (
        <div className="grid grid-cols-1 gap-2 mb-4">
          {q.options.map((opt: string, idx: number) => (
            <motion.button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`py-3 px-4 rounded-xl text-left font-medium border transition-all ${
                selected === idx
                  ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan'
                  : 'bg-bg-elevated border-white/5 text-text-secondary'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xs text-text-muted mr-2">{String.fromCharCode(65 + idx)}</span>
              {opt}
            </motion.button>
          ))}
        </div>
      )}

      {/* Numeric Input */}
      {q.type === 'numeric_input' && (
        <input
          type="number"
          value={numericValue}
          onChange={(e) => setNumericValue(e.target.value)}
          placeholder="Your answer..."
          className="w-full py-3 px-4 rounded-xl bg-bg-elevated border border-white/10 text-text-primary text-lg font-score outline-none focus:border-neon-cyan/50 mb-4"
          onKeyDown={(e) => e.key === 'Enter' && handleLock()}
        />
      )}

      {/* Lock In */}
      <motion.button
        onClick={handleLock}
        disabled={
          (q.type === 'multiple_choice' && selected === null) ||
          (q.type === 'numeric_input' && !numericValue.trim())
        }
        className="w-full py-3.5 rounded-xl font-display text-xl tracking-wide bg-neon-gold/15 border border-neon-gold/40 text-neon-gold hover:bg-neon-gold/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        LOCK IN
      </motion.button>
    </motion.div>
  );
}

function PlayerRevealView({ gameState, playerId }: { gameState: any; playerId: string }) {
  const reveal = gameState.reveal;
  if (!reveal) return null;

  const isCorrect = reveal.correctPlayerIds.includes(playerId);
  const isEliminated = reveal.eliminatedPlayerIds.includes(playerId);
  const me = gameState.players.find((p: any) => p.id === playerId);

  return (
    <motion.div
      className="text-center w-full max-w-sm"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {isCorrect ? (
        <>
          <motion.div
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.4 }}
          >
            ✅
          </motion.div>
          <h2 className="font-display text-3xl text-neon-green glow-green mb-2">CORRECT!</h2>
          <p className="font-score text-2xl text-neon-gold">
            Score: {formatRands(me?.score ?? 0)}
          </p>
        </>
      ) : isEliminated ? (
        <>
          <motion.div
            className="text-6xl mb-4"
            animate={{ x: [0, -8, 8, -8, 8, 0] }}
            transition={{ duration: 0.4 }}
          >
            ❌
          </motion.div>
          <h2 className="font-display text-3xl text-neon-pink glow-pink mb-2">ELIMINATED</h2>
          <p className="text-text-secondary mb-3">The answer was:</p>
          <p className="font-display text-2xl text-neon-green">{reveal.correctAnswer}</p>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4">👀</div>
          <h2 className="font-display text-2xl text-text-secondary mb-2">ANSWER REVEALED</h2>
        </>
      )}

      <p className="text-text-muted text-sm mt-4 max-w-xs mx-auto">{reveal.explanation}</p>
    </motion.div>
  );
}

function PlayerBankingView({
  gameState,
  playerId,
  me,
  onDecision,
}: {
  gameState: any;
  playerId: string;
  me: any;
  onDecision: (id: string, banked: boolean) => void;
}) {
  const [decided, setDecided] = useState(false);
  const banking = gameState.banking;

  const handleDecision = (banked: boolean) => {
    if (decided) return;
    setDecided(true);
    onDecision(playerId, banked);
  };

  if (decided) {
    return (
      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="text-5xl mb-3">⏳</div>
        <p className="text-text-secondary">Waiting for other players to decide...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="text-center w-full max-w-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="font-display text-3xl text-neon-gold glow-gold mb-2">BANK OR RISK?</h2>
      <p className="text-text-secondary mb-2">
        Next: <span className="font-bold" style={{ color: getDifficultyColour(banking?.difficulty ?? 50) }}>{banking?.difficulty}%</span>
      </p>

      <div className="bg-bg-elevated rounded-xl p-4 mb-6">
        <span className="text-xs text-text-muted block mb-1">Your Score</span>
        <span className="font-score text-3xl text-neon-gold font-bold">{formatRands(me.score)}</span>
      </div>

      <div className="flex gap-3">
        <motion.button
          onClick={() => handleDecision(true)}
          className="flex-1 py-3.5 rounded-xl font-display text-lg tracking-wide bg-neon-gold/15 border border-neon-gold/40 text-neon-gold"
          whileTap={{ scale: 0.97 }}
        >
          BANK IT
        </motion.button>
        <motion.button
          onClick={() => handleDecision(false)}
          className="flex-1 py-3.5 rounded-xl font-display text-lg tracking-wide bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan"
          whileTap={{ scale: 0.97 }}
        >
          RISK IT
        </motion.button>
      </div>
    </motion.div>
  );
}

function PlayerResultsView({ gameState, playerId }: { gameState: any; playerId: string }) {
  const ranked = [...gameState.players].sort((a: any, b: any) => b.score - a.score);
  const me = gameState.players.find((p: any) => p.id === playerId);
  const myRank = ranked.findIndex((p: any) => p.id === playerId) + 1;

  return (
    <motion.div
      className="text-center w-full max-w-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="font-display text-4xl text-neon-gold glow-gold mb-2">GAME OVER</h2>

      <div className="bg-bg-surface/60 border border-white/5 rounded-xl p-5 mb-6">
        <span className="text-5xl block mb-2">{me?.avatar}</span>
        <span className="font-display text-2xl block" style={{ color: me?.colour }}>{me?.name}</span>
        <span className="font-score text-3xl text-neon-gold font-bold block mt-1">{formatRands(me?.score ?? 0)}</span>
        <span className="text-text-muted text-sm mt-1 block">
          {myRank === 1 ? '🏆 WINNER!' : `#${myRank} of ${ranked.length}`}
        </span>
      </div>

      <div className="space-y-1.5">
        {ranked.map((p: any, i: number) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              p.id === playerId ? 'bg-neon-cyan/10 border border-neon-cyan/20' : 'bg-bg-surface/40'
            }`}
          >
            <span className={`font-score w-5 font-bold ${i === 0 ? 'text-neon-gold' : 'text-text-muted'}`}>
              {i + 1}
            </span>
            <span>{p.avatar}</span>
            <span className="flex-1 text-left" style={{ color: p.colour }}>{p.name}</span>
            <span className="font-score text-xs text-neon-gold">{formatRands(p.score)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function PlayerEliminated({ score }: { score: number }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-5xl mb-4">💀</div>
      <h2 className="font-display text-3xl text-neon-pink glow-pink mb-2">YOU'RE OUT</h2>
      <p className="text-text-secondary">Final score: <span className="font-score text-neon-gold">{formatRands(score)}</span></p>
      <p className="text-text-muted text-sm mt-3">Watch the host screen to see how far others get!</p>
    </motion.div>
  );
}

function PlayerBanked({ score }: { score: number }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-5xl mb-4">🏦</div>
      <h2 className="font-display text-3xl text-neon-gold glow-gold mb-2">BANKED</h2>
      <p className="text-text-secondary">Secured: <span className="font-score text-neon-gold">{formatRands(score)}</span></p>
      <p className="text-text-muted text-sm mt-3">Smart move! Watch the host screen for the rest.</p>
    </motion.div>
  );
}
