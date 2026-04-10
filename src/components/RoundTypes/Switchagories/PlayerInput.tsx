import { motion } from 'framer-motion';
import CategoryPicker from '../Shared/CategoryPicker';
import AnswerInput from '../../Game/AnswerInput';
import type { SwitchagoriesState } from '../../../roundTypes/definitions/switchagories';

export default function PlayerInput({
  question,
  onSubmit,
  playerId,
  players,
  allAnswersIn,
  roundState,
  onUpdateState,
}: any) {
  const me = players.find((p: any) => p.id === playerId);
  const state = roundState as SwitchagoriesState;
  const isPicker = state?.pickerPlayerId === playerId;
  const phase = state?.phase ?? 'picking';

  const handleCategoryPick = (category: string) => {
    if (onUpdateState) {
      onUpdateState((prev: any) => ({
        ...prev,
        categoryPick: category,
      }));
    }
  };

  // Picking phase
  if (phase === 'picking') {
    if (isPicker && !state?.categoryPick) {
      return (
        <CategoryPicker
          categories={state?.packOptions ?? []}
          onPick={handleCategoryPick}
          disabled={allAnswersIn}
        />
      );
    }

    // Picker already picked, or not the picker — show waiting
    const pickerPlayer = players.find((p: any) => p.id === state?.pickerPlayerId);
    return (
      <motion.div
        className="text-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="text-3xl mb-3 block">🎯</span>
        <p className="text-text-secondary text-sm font-medium">
          {isPicker
            ? `You picked: ${state?.categoryPick}`
            : `${pickerPlayer?.name ?? 'A player'} is choosing a category...`}
        </p>
      </motion.div>
    );
  }

  // Answering phase — everyone answers
  return (
    <AnswerInput
      question={question}
      onSubmit={(a: any) => onSubmit(playerId, a)}
      disabled={allAnswersIn}
      playerName={me?.name ?? ''}
      playerColour={me?.colour ?? ''}
    />
  );
}
