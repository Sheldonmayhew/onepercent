import { motion } from 'framer-motion';
import type { Team } from '../../types';
import { formatRands } from '../../utils/helpers';

interface TeamScoreboardProps {
  teams: Team[];
  variant: 'tv' | 'mobile';
}

const styles = {
  tv: {
    container: 'bg-bg-card shadow-soft rounded-2xl p-6 lg:p-8',
    headerText: 'font-display text-lg text-text-primary tracking-wide',
    badge: 'text-xs font-bold px-3 py-1 rounded-full bg-neon-green/15 text-neon-green',
    scoreText: 'font-score text-5xl lg:text-6xl font-bold',
    teamName: 'text-sm text-text-muted uppercase tracking-wider mt-1',
    vs: 'font-display text-xl text-text-muted mx-6',
    bar: 'flex h-4 rounded-full overflow-hidden bg-bg-elevated',
    mb: 'mb-4',
    stackedGap: 'flex flex-col gap-3',
    stackedItem: 'flex items-center gap-4 px-4 py-2 rounded-xl bg-bg-elevated',
    stackedRank: 'font-score text-lg w-6 text-center text-text-muted',
    stackedDot: 'w-4 h-4 rounded-full flex-shrink-0',
    stackedName: 'flex-1 text-xl font-medium text-text-primary',
    stackedScore: 'font-score text-xl',
  },
  mobile: {
    container: 'bg-bg-card shadow-soft rounded-2xl p-5',
    headerText: 'font-display text-sm text-text-primary tracking-wide',
    badge: 'text-xs font-bold px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green',
    scoreText: 'font-score text-3xl font-bold',
    teamName: 'text-xs text-text-muted uppercase tracking-wider',
    vs: 'font-display text-sm text-text-muted mx-4',
    bar: 'flex h-2.5 rounded-full overflow-hidden bg-bg-elevated',
    mb: 'mb-3',
    stackedGap: 'flex flex-col gap-2',
    stackedItem: 'flex items-center gap-3',
    stackedRank: 'text-text-muted font-score text-sm w-4',
    stackedDot: 'w-3 h-3 rounded-full flex-shrink-0',
    stackedName: 'flex-1 font-medium text-text-primary text-sm',
    stackedScore: 'font-score text-sm',
  },
} as const;

export default function TeamScoreboard({ teams, variant }: TeamScoreboardProps) {
  const s = styles[variant];
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const totalTeamScore = teams.reduce((acc, t) => acc + t.score, 0) || 1;
  const initial = variant === 'tv' ? { opacity: 0, y: -12 } : { opacity: 0, y: 8 };

  return (
    <motion.div className={s.container} initial={initial} animate={{ opacity: 1, y: 0 }}>
      <div className={`flex items-center justify-between ${s.mb}`}>
        {variant === 'tv' ? (
          <h3 className={s.headerText}>TEAM BATTLE</h3>
        ) : (
          <p className={s.headerText}>TEAM BATTLE</p>
        )}
        <span className={s.badge}>LIVE</span>
      </div>

      {teams.length === 2 ? (
        <>
          <div className={`flex items-center justify-between ${s.mb}`}>
            <div className="text-center flex-1">
              <p className={s.scoreText} style={{ color: teams[0].colour }}>
                {formatRands(teams[0].score)}
              </p>
              <p className={s.teamName}>{teams[0].name}</p>
            </div>
            <span className={s.vs}>VS</span>
            <div className="text-center flex-1">
              <p className={s.scoreText} style={{ color: teams[1].colour }}>
                {formatRands(teams[1].score)}
              </p>
              <p className={s.teamName}>{teams[1].name}</p>
            </div>
          </div>

          <div className={s.bar}>
            <div
              className="transition-all duration-700 rounded-l-full"
              style={{
                width: `${Math.max(5, (teams[0].score / totalTeamScore) * 100)}%`,
                backgroundColor: teams[0].colour,
              }}
            />
            <div
              className="transition-all duration-700 rounded-r-full"
              style={{
                width: `${Math.max(5, (teams[1].score / totalTeamScore) * 100)}%`,
                backgroundColor: teams[1].colour,
              }}
            />
          </div>
        </>
      ) : (
        <div className={s.stackedGap}>
          {sortedTeams.map((team, idx) => (
            <div key={team.id} className={s.stackedItem}>
              <span className={s.stackedRank}>{idx + 1}</span>
              <div className={s.stackedDot} style={{ backgroundColor: team.colour }} />
              <span className={s.stackedName}>{team.name}</span>
              <span className={s.stackedScore} style={{ color: team.colour }}>
                {formatRands(team.score)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
