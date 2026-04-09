import { motion } from 'framer-motion';
import type { PlayerInputProps } from '../../../roundTypes/types';
import type { FinalRoundState } from '../../../roundTypes/definitions/finalRound';
import AnswerInput from '../../Game/AnswerInput';
import EliminationOverlay from '../Shared/EliminationOverlay';

export default function PlayerInput({
  question,
  onSubmit,
  playerId,
  players,
  allAnswersIn,
}: PlayerInputProps<FinalRoundState>) {
  const me = players.find((p) => p.id === playerId);
  if (!me) return null;

  // Show elimination overlay if eliminated
  if (me.eliminated) {
    return (
      <EliminationOverlay
        show={true}
        playerName={me.name}
        playerAvatar={me.avatar}
      />
    );
  }

  return (
    <div className="w-full">
      {/* SUDDEN DEATH label */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="font-display text-sm text-neon-pink uppercase tracking-[0.3em]">
          SUDDEN DEATH
        </span>
      </motion.div>

      {/* Red border glow wrapper */}
      <motion.div
        className="rounded-2xl p-[2px]"
        animate={{
          boxShadow: [
            '0 0 10px rgba(239,68,68,0.3), inset 0 0 10px rgba(239,68,68,0.1)',
            '0 0 25px rgba(239,68,68,0.5), inset 0 0 15px rgba(239,68,68,0.2)',
            '0 0 10px rgba(239,68,68,0.3), inset 0 0 10px rgba(239,68,68,0.1)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1), rgba(239,68,68,0.3))',
        }}
      >
        <div className="bg-bg-primary rounded-2xl p-1">
          <AnswerInput
            question={question}
            onSubmit={(a: string | number) => onSubmit(playerId, a)}
            disabled={allAnswersIn}
            playerName={me.name}
            playerColour={me.colour}
          />
        </div>
      </motion.div>
    </div>
  );
}
