import type { PlayerInputProps } from '../../../roundTypes/types';
import type { HotSeatState } from '../../../roundTypes/definitions/hotSeat';
import SpotlightFrame from '../Shared/SpotlightFrame';
import AnswerInput from '../../Game/AnswerInput';

export default function PlayerInput({
  question,
  onSubmit,
  playerId,
  players,
  allAnswersIn,
  roundState,
}: PlayerInputProps<HotSeatState>) {
  const me = players.find((p) => p.id === playerId);
  if (!me) return null;

  const hotSeatOrder: string[] = roundState?.hotSeatOrder ?? [];
  const currentIndex: number = roundState?.currentHotSeatIndex ?? 0;
  const activePlayerId = hotSeatOrder[currentIndex];
  const isActive = activePlayerId === playerId;

  return (
    <div className="w-full">
      <SpotlightFrame player={me} isActive={isActive}>
        {isActive ? (
          <AnswerInput
            question={question}
            onSubmit={(a: string | number) => onSubmit(playerId, a)}
            disabled={allAnswersIn}
            playerName={me.name}
            playerColour={me.colour}
          />
        ) : (
          <div />
        )}
      </SpotlightFrame>
    </div>
  );
}
