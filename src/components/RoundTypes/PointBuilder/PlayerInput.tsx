import AnswerInput from '../../Game/AnswerInput';

export default function PlayerInput({ question, onSubmit, playerId, players, allAnswersIn }: any) {
  const me = players.find((p: any) => p.id === playerId);
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
