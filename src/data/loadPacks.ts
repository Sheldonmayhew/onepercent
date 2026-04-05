import type { QuestionPack } from '../types';

import mzansiMix from './packs/mzansi-mix-vol1.json';
import numbersGame from './packs/numbers-game.json';
import patternSpotter from './packs/pattern-spotter.json';

export function loadAllPacks(): QuestionPack[] {
  return [mzansiMix, numbersGame, patternSpotter] as QuestionPack[];
}
