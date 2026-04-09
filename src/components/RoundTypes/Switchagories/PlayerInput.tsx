import CategoryPicker from '../Shared/CategoryPicker';
import AnswerInput from '../../Game/AnswerInput';

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
  const myPick = roundState?.categoryPicks?.[playerId];

  const handleCategoryPick = (category: string) => {
    if (onUpdateState) {
      onUpdateState((prev: any) => ({
        ...prev,
        categoryPicks: { ...(prev?.categoryPicks ?? {}), [playerId]: category },
      }));
    }
  };

  if (!myPick) {
    return (
      <CategoryPicker
        categories={question.categories ?? []}
        onPick={handleCategoryPick}
        disabled={allAnswersIn}
      />
    );
  }

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
