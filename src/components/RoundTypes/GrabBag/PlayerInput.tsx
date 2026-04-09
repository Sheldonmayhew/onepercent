import MultiSelectInput from '../Shared/MultiSelectInput';

export default function PlayerInput({ question, onSubmit, playerId, allAnswersIn }: any) {
  const handleSubmit = (selectedIndices: number[]) => {
    onSubmit(playerId, selectedIndices.join(','));
  };

  return (
    <div className="w-full">
      <p className="text-xs text-neon-cyan font-display tracking-wider uppercase text-center mb-3">
        Select ALL correct answers
      </p>
      <MultiSelectInput
        options={question.options ?? []}
        onSubmit={handleSubmit}
        disabled={allAnswersIn}
      />
    </div>
  );
}
