import RankingInput from '../Shared/RankingInput';

export default function PlayerInput({ question, onSubmit, playerId, allAnswersIn }: any) {
  const items: string[] = question.sequence_items ?? question.options ?? [];
  const criterion: string = question.ranking_criterion ?? 'Rank these items';

  const handleSubmit = (order: number[]) => {
    onSubmit(playerId, order.join(','));
  };

  return (
    <RankingInput
      items={items}
      criterion={criterion}
      onSubmit={handleSubmit}
      disabled={allAnswersIn}
    />
  );
}
