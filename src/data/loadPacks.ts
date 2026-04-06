import type { QuestionPack } from '../types';

import mzansiMix from './packs/mzansi-mix-vol1.json';
import mzansiMix2 from './packs/mzansi-mix-vol2.json';
import mzansiMix3 from './packs/mzansi-mix-vol3.json';
import numbersGame from './packs/numbers-game.json';
import patternSpotter from './packs/pattern-spotter.json';
import brainTeasers from './packs/brain-teasers.json';
import wordWizard from './packs/word-wizard.json';
import saCulture from './packs/sa-culture.json';
import scienceNature from './packs/science-nature.json';
import moneyMatters from './packs/money-matters.json';
import sportGames from './packs/sport-games.json';
import trickQuestions from './packs/trick-questions.json';
import worldKnowledge from './packs/world-knowledge.json';
import mixedBag from './packs/mixed-bag.json';
import popCulture from './packs/pop-culture.json';
import mythology from './packs/mythology.json';
import worldHistory from './packs/world-history.json';
import worldSport from './packs/world-sport.json';
import worldMusic from './packs/world-music.json';
import worldEntertainment from './packs/world-entertainment.json';
import worldGeography from './packs/world-geography.json';
import worldTravel from './packs/world-travel.json';

export function loadAllPacks(): QuestionPack[] {
  return [
    mzansiMix,
    mzansiMix2,
    mzansiMix3,
    numbersGame,
    patternSpotter,
    brainTeasers,
    wordWizard,
    saCulture,
    scienceNature,
    moneyMatters,
    sportGames,
    trickQuestions,
    worldKnowledge,
    mixedBag,
    popCulture,
    mythology,
    worldHistory,
    worldSport,
    worldMusic,
    worldEntertainment,
    worldGeography,
    worldTravel,
  ] as QuestionPack[];
}
