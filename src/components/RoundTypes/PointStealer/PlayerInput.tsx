import { AnimatePresence, motion } from 'framer-motion';
import type { PlayerInputProps } from '../../../roundTypes/types';
import type { PointStealerState } from '../../../roundTypes/definitions/pointStealer';
import AnswerInput from '../../Game/AnswerInput';
import StealPicker from '../Shared/StealPicker';

export default function PlayerInput({
  question,
  onSubmit,
  onUpdateState,
  playerId,
  players,
  allAnswersIn,
  roundState,
}: PlayerInputProps<PointStealerState>) {
  const me = players.find((p) => p.id === playerId);
  const phase = roundState?.phase ?? 'answering';
  const correctPlayerIds: string[] = roundState?.correctPlayerIds ?? [];
  const canSteal = correctPlayerIds.includes(playerId);

  // Filter out self and teammates from steal targets
  const opponents = players.filter((p) => {
    if (p.id === playerId) return false;
    if (me?.teamId && p.teamId === me.teamId) return false;
    return true;
  });

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {phase === 'answering' && (
          <motion.div
            key="answering"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AnswerInput
              question={question}
              onSubmit={(a: string | number) => onSubmit(playerId, a)}
              disabled={allAnswersIn}
              playerName={me?.name ?? ''}
              playerColour={me?.colour ?? ''}
            />
          </motion.div>
        )}

        {phase === 'stealing' && (
          <motion.div
            key="stealing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {canSteal ? (
              <>
                <p className="text-center text-neon-pink font-display text-lg tracking-wide mb-4">
                  YOU GOT IT RIGHT — STEAL SOMEONE&apos;S POINTS!
                </p>
                <StealPicker
                  opponents={opponents}
                  onSteal={(targetId) => onUpdateState((prev: any) => ({ ...prev, stealChoices: { ...(prev?.stealChoices ?? {}), [playerId]: targetId } }))}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 opacity-60">
                <motion.span
                  className="text-5xl mb-4"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  🛡️
                </motion.span>
                <p className="text-text-muted font-medium text-center">
                  You answered incorrectly — waiting for steal phase to end...
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
