import { motion } from 'framer-motion';
import type { HostControlProps } from '../../../roundTypes/types';
import type { HotSeatState } from '../../../roundTypes/definitions/hotSeat';

export default function HostControls({
  players,
  roundState,
  onUpdateState,
}: HostControlProps<HotSeatState>) {
  const hotSeatOrder: string[] = roundState?.hotSeatOrder ?? [];
  const currentIndex: number = roundState?.currentHotSeatIndex ?? 0;
  const activePlayerId = hotSeatOrder[currentIndex];
  const hasNext = currentIndex < hotSeatOrder.length - 1;

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm text-text-muted uppercase tracking-wider">
        Host Controls — Hot Seat
      </h3>

      {/* Current hot seat player */}
      <div className="bg-bg-elevated rounded-xl p-3">
        <p className="text-xs text-text-muted mb-1">In the Hot Seat:</p>
        {activePlayerId && getPlayer(activePlayerId) ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getPlayer(activePlayerId)!.avatar}</span>
            <span className="text-text-primary font-medium">{getPlayer(activePlayerId)!.name}</span>
          </div>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </div>

      {/* Player order list */}
      <div className="bg-bg-elevated rounded-xl p-3">
        <p className="text-xs text-text-muted mb-2">Order:</p>
        <div className="space-y-1">
          {hotSeatOrder.map((id, idx) => {
            const player = getPlayer(id);
            if (!player) return null;
            const isCurrent = idx === currentIndex;
            const isCompleted = idx < currentIndex;
            return (
              <div
                key={id}
                className={`flex items-center gap-2 py-1 px-2 rounded-lg text-sm ${
                  isCurrent
                    ? 'bg-neon-gold/10 text-neon-gold font-bold'
                    : isCompleted
                    ? 'text-text-muted line-through'
                    : 'text-text-secondary'
                }`}
              >
                <span className="w-5 text-center text-xs">{isCurrent ? '>' : idx + 1}</span>
                <span>{player.avatar}</span>
                <span className="truncate">{player.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next player button */}
      {hasNext && (
        <motion.button
          onClick={() => onUpdateState((prev: any) => ({ ...prev, currentHotSeatIndex: currentIndex + 1 }))}
          className="w-full py-3 px-6 rounded-xl font-display text-lg tracking-wide bg-gradient-to-r from-neon-gold to-neon-green text-white shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          NEXT PLAYER
        </motion.button>
      )}

      {!hasNext && currentIndex > 0 && (
        <p className="text-xs text-neon-green text-center font-display uppercase tracking-wider">
          All players completed
        </p>
      )}
    </div>
  );
}
