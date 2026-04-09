import type { RoundTypeId } from '../types';

export const ROUND_TYPE_SEQUENCE: RoundTypeId[] = [
  'point_builder',         // 90% — Warm-up
  'quickstarter',          // 80% — Warm-up
  'snap',                  // 70% — Warm-up
  'switchagories',         // 60% — Mid-game
  'pass_the_bomb',         // 50% — Mid-game
  'grab_bag',              // 40% — Mid-game
  'close_call',            // 30% — Pressure
  'point_stealer',         // 20% — Pressure
  'look_before_you_leap',  // 10% — Pressure
  'hot_seat',              // 5%  — Gauntlet
  'final_round',           // 1%  — Gauntlet
];
