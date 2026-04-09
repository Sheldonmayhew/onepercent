import { motion } from 'framer-motion';
import AnswerInput from '../../Game/AnswerInput';

export default function PlayerInput({ question, onSubmit, playerId, players, allAnswersIn }: any) {
  const me = players.find((p: any) => p.id === playerId);

  return (
    <div className="w-full">
      {/* Bomb warning */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <motion.span
          className="text-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
        >
          💣
        </motion.span>
        <span className="text-neon-pink font-display text-sm tracking-wider uppercase">
          Wrong answer = point penalty!
        </span>
        <motion.span
          className="text-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut', delay: 0.4 }}
        >
          💣
        </motion.span>
      </div>

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
