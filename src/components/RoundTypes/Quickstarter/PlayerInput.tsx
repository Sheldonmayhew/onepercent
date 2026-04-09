import { motion } from 'framer-motion';
import AnswerInput from '../../Game/AnswerInput';

export default function PlayerInput({ question, onSubmit, playerId, players, allAnswersIn, roundState }: any) {
  const me = players.find((p: any) => p.id === playerId);
  const multiplier = roundState?.multipliers?.[playerId] ?? 1;

  const multiplierLabel =
    multiplier === 1 ? '1x' : multiplier === 1.5 ? '1.5x' : multiplier === 2 ? '2x' : `${multiplier}x`;

  return (
    <div className="w-full">
      {/* Multiplier badge */}
      <motion.div
        className="flex justify-center mb-4"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neon-gold/15 border border-neon-gold/30">
          <span className="text-neon-gold font-display text-lg font-bold tracking-wide">
            {multiplierLabel}
          </span>
          <span className="text-text-muted text-xs uppercase tracking-wider">multiplier</span>
        </span>
      </motion.div>

      <AnswerInput
        question={question}
        onSubmit={(a: any) => onSubmit(playerId, a)}
        disabled={allAnswersIn}
        playerName={me?.name ?? ''}
        playerColour={me?.colour ?? ''}
      />
    </div>
  );
}
