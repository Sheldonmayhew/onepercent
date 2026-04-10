import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { useMultiplayerStore } from '../stores/multiplayerStore';
import { useProfileStore } from '../stores/profileStore';
import { useHistoryStore } from '../stores/historyStore';
import { endHostGame, broadcastHostState } from '../hooks/useMultiplayer';
import { formatRands } from '../utils/helpers';
import GameLayout, { NavCTA, NavBack } from '../components/Game/GameLayout';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = useGameStore((s) => s.session);
  const resetGame = useGameStore((s) => s.resetGame);
  const initQuickPlay = useGameStore((s) => s.initQuickPlay);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const startGame = useGameStore((s) => s.startGame);

  const role = useMultiplayerStore((s) => s.role);
  const mpReset = useMultiplayerStore((s) => s.reset);

  const updateStats = useProfileStore((s) => s.updateStats);
  const profile = useProfileStore((s) => s.profile);
  const { addRecord } = useHistoryStore();

  const statsUpdated = useRef(false);
  const isHost = role === 'host';
  const isQuickPlay = location.pathname.startsWith('/quick-play');

  useEffect(() => {
    if (!session || statsUpdated.current) return;
    statsUpdated.current = true;

    const players = session.players;
    const totalRounds = session.roundHistory.length;
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    const correctCount = session.roundHistory.reduce((acc, r) => {
      return acc + (winner && r.correctPlayers.includes(winner.id) ? 1 : 0);
    }, 0);

    updateStats(winner?.score ?? 0, true, correctCount, totalRounds);

    const recordPlayers = players.map((p) => {
      const correct = session.roundHistory.filter((r) => r.correctPlayers.includes(p.id)).length;
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        finalScore: p.score,
        questionsCorrect: correct,
        questionsAnswered: totalRounds,
      };
    });

    addRecord({
      mode: 'classic',
      packIds: session.settings.packIds,
      packNames: [session.pack.name],
      playerCount: players.length,
      rounds: totalRounds,
      players: recordPlayers,
      winnerId: winner?.id ?? '',
    });
  }, [session, updateStats, addRecord]);

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  if (!session) return null;

  const players = session.players;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const totalRounds = session.roundHistory.length;

  const totalCorrect = players.reduce((acc, p) => {
    return acc + session.roundHistory.filter((r) => r.correctPlayers.includes(p.id)).length;
  }, 0);
  const totalAnswers = players.length * totalRounds;
  const accuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
  const totalEarned = players.reduce((acc, p) => acc + p.score, 0);

  const isTeamMode = session.settings.teamMode;
  const teams = session.teams;

  const handlePlayAgain = () => {
    if (isQuickPlay) {
      initQuickPlay(session.settings.packIds);
      addPlayer(profile?.name ?? 'Player', profile?.avatar);
      startGame();
      navigate('/quick-play/round-intro', { replace: true });
    } else {
      broadcastHostState('/player/play-again');
      navigate('/host/categories', {
        replace: true,
        state: { replay: true, mode: session.settings.teamMode ? 'team' : 'individual' },
      });
    }
  };

  const handleNewGame = () => {
    if (isHost) {
      endHostGame();
      mpReset();
    }
    resetGame();
    navigate('/', { replace: true });
  };

  return (
    <GameLayout
      header={
        <div className="px-4 pt-4 pb-2">
          <motion.h1
            className="font-display text-4xl text-text-primary text-center tracking-tight"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            GAME OVER
          </motion.h1>
        </div>
      }
      secondaryAction={<NavBack onClick={handleNewGame} label="New" icon={
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      } />}
      cta={<NavCTA onClick={handlePlayAgain}>PLAY AGAIN</NavCTA>}
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* Trophy + Winner Card */}
        {winner && (
          <motion.div
            className="bg-gradient-to-br from-neon-gold/20 to-neon-pink/10 rounded-2xl shadow-soft p-6 flex flex-col items-center gap-3 border border-neon-gold/20"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 20 }}
          >
            <span className="text-5xl">🏆</span>
            <span className="text-4xl">{winner.avatar}</span>
            <p className="font-display text-2xl text-text-primary tracking-wide">{winner.name}</p>
            <p className="font-score text-4xl text-neon-gold font-bold">{formatRands(winner.score)}</p>
          </motion.div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-card shadow-soft rounded-2xl p-4 flex flex-col items-center gap-1">
            <span className="text-xs text-text-muted tracking-[0.12em] uppercase">Accuracy</span>
            <span className="font-score text-3xl text-neon-cyan font-bold">{accuracy}%</span>
            <span className="text-xs text-text-muted">{totalCorrect}/{totalAnswers} correct</span>
          </div>
          <div className="bg-bg-card shadow-soft rounded-2xl p-4 flex flex-col items-center gap-1">
            <span className="text-xs text-text-muted tracking-[0.12em] uppercase">Total Earned</span>
            <span className="font-score text-3xl text-neon-green font-bold">{formatRands(totalEarned)}</span>
            <span className="text-xs text-text-muted">{totalRounds} rounds</span>
          </div>
        </div>

        {/* Team standings */}
        {isTeamMode && teams.length > 0 && (
          <div className="bg-bg-card shadow-soft rounded-2xl p-5">
            <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">Team Standings</p>
            <div className="flex flex-col gap-2">
              {[...teams].sort((a, b) => b.score - a.score).map((team, idx) => {
                const teamPlayers = players.filter((p) => p.teamId === team.id);
                return (
                  <div key={team.id} className="px-3 py-2.5 rounded-xl bg-bg-elevated">
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted font-score text-sm w-5 text-center">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : `${idx + 1}`}
                      </span>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.colour }} />
                      <span className="flex-1 font-medium text-text-primary">{team.name}</span>
                      <span className="font-score text-neon-gold">{formatRands(team.score)}</span>
                    </div>
                    {teamPlayers.length > 0 && (
                      <div className="ml-8 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {teamPlayers.map((p) => (
                          <span key={p.id} className="text-xs text-text-muted">{p.avatar} {p.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual rankings */}
        <div className="bg-bg-card shadow-soft rounded-2xl p-5">
          <p className="text-xs text-text-muted tracking-[0.15em] uppercase mb-3">Rankings</p>
          <div className="flex flex-col gap-2">
            {sorted.map((player, idx) => {
              const playerTeam = isTeamMode ? teams.find((t) => t.id === player.teamId) : null;
              return (
                <motion.div
                  key={player.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-elevated"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                >
                  <span className={`font-score text-lg w-6 text-center ${idx === 0 ? 'text-neon-gold' : idx === 1 ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span className="text-2xl">{player.avatar}</span>
                  {playerTeam && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: playerTeam.colour }} title={playerTeam.name} />}
                  <span className="flex-1 font-medium text-text-primary">
                    {player.name}
                    {player.isHost && <span className="ml-1 text-xs">👑</span>}
                  </span>
                  <span className="font-score text-neon-gold text-sm">{formatRands(player.score)}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
