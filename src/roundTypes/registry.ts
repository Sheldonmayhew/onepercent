import type { RoundTypeId } from '../types';
import type { RoundTypeDefinition } from './types';
import { pointBuilderRound } from './definitions/pointBuilder';
import { quickstarterRound } from './definitions/quickstarter';
import { snapRound } from './definitions/snap';
import { switchagoriesRound } from './definitions/switchagories';
import { passTheBombRound } from './definitions/passTheBomb';
import { grabBagRound } from './definitions/grabBag';
import { closeCallRound } from './definitions/closeCall';
import { pointStealerRound } from './definitions/pointStealer';
import { lookBeforeYouLeapRound } from './definitions/lookBeforeYouLeap';
import { hotSeatRound } from './definitions/hotSeat';
import { finalRoundDef } from './definitions/finalRound';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ROUND_TYPE_REGISTRY = new Map<RoundTypeId, RoundTypeDefinition<any>>([
  ['point_builder', pointBuilderRound],
  ['quickstarter', quickstarterRound],
  ['snap', snapRound],
  ['switchagories', switchagoriesRound],
  ['pass_the_bomb', passTheBombRound],
  ['grab_bag', grabBagRound],
  ['close_call', closeCallRound],
  ['point_stealer', pointStealerRound],
  ['look_before_you_leap', lookBeforeYouLeapRound],
  ['hot_seat', hotSeatRound],
  ['final_round', finalRoundDef],
]);

export function getRoundDefinition(id: RoundTypeId): RoundTypeDefinition<any> {
  const def = ROUND_TYPE_REGISTRY.get(id);
  if (!def) {
    // Fallback to point_builder for unregistered round types during development
    return pointBuilderRound;
  }
  return def;
}

export function registerRoundType(def: RoundTypeDefinition<any>) {
  ROUND_TYPE_REGISTRY.set(def.id, def);
}

export { ROUND_TYPE_REGISTRY };
