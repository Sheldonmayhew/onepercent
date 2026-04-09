import { motion } from 'framer-motion';
import type { HostControlProps } from '../../../roundTypes/types';
import type { PointStealerState } from '../../../roundTypes/definitions/pointStealer';

export default function HostControls({
  players,
  roundState,
  onUpdateState,
  allAnswersIn,
}: HostControlProps<PointStealerState>) {
  const phase = roundState?.phase ?? 'answering';
  const correctPlayerIds: string[] = roundState?.correctPlayerIds ?? [];
  const allStealsIn = correctPlayerIds.length > 0 && correctPlayerIds.every(
    (id) => players.find((p) => p.id === id)?.stealTarget,
  );

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm text-text-muted uppercase tracking-wider">
        Host Controls
      </h3>

      {/* Start steal phase — shown after answers are in */}
      {phase === 'answering' && allAnswersIn && (
        <motion.button
          onClick={() => onUpdateState((prev: any) => ({ ...prev, phase: 'stealing' }))}
          className="w-full py-3 px-6 rounded-xl font-display text-lg tracking-wide bg-gradient-to-r from-neon-pink to-neon-cyan text-white shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          START STEAL PHASE
        </motion.button>
      )}

      {/* Reveal steals — shown after all steal choices are in */}
      {phase === 'stealing' && allStealsIn && (
        <motion.button
          onClick={() => onUpdateState((prev: any) => ({ ...prev, phase: 'reveal' }))}
          className="w-full py-3 px-6 rounded-xl font-display text-lg tracking-wide bg-gradient-to-r from-neon-gold to-neon-pink text-white shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          REVEAL STEALS
        </motion.button>
      )}

      {/* Status info */}
      <div className="text-xs text-text-muted space-y-1">
        <p>Phase: <span className="text-text-secondary">{phase}</span></p>
        <p>Correct players: <span className="text-neon-green">{correctPlayerIds.length}</span></p>
        {phase === 'stealing' && (
          <p>
            Steals chosen:{' '}
            <span className="text-neon-pink">
              {correctPlayerIds.filter((id) => players.find((p) => p.id === id)?.stealTarget).length}
              /{correctPlayerIds.length}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
