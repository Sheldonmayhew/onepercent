// src/components/GameShowOverlay/HostPanel/hostCommentary.ts
import type { Tier } from './ttsEngine';

export type CommentaryEvent =
  | 'round_intro'
  | 'read_question'
  | 'reveal_answer'
  | 'many_correct'
  | 'few_correct'
  | 'none_correct'
  | 'leader_wrong'
  | 'steal_executed'
  | 'elimination'
  | 'buzz_first'
  | 'final_survivor'
  | 'tier_transition'
  | 'round_complete';

interface CommentaryContext {
  roundName?: string;
  difficulty?: number;
  playerCount?: number;
  player?: string;
  stealer?: string;
  victim?: string;
  amount?: number;
  correctCount?: number;
  mvp?: string;
  mvpScore?: number;
  newTier?: string;
  question?: string;
  answer?: string;
  correctNames?: string;
  incorrectNames?: string;
}

type CommentaryPool = Record<Tier, string[]>;

const POOLS: Record<CommentaryEvent, CommentaryPool> = {
  read_question: {
    warmup: [
      "Here's your question. {question}",
      "Alright, listen up. {question}",
      "Question time! {question}",
    ],
    midgame: [
      "Here we go. {question}",
      "Think carefully. {question}",
      "{question}",
    ],
    pressure: [
      "This one's tricky. {question}",
      "Focus now. {question}",
      "{question}",
    ],
    gauntlet: [
      "{question}",
      "Final question. {question}",
    ],
  },
  reveal_answer: {
    warmup: [
      "The answer is... {answer}! {correctNames} got it right. {incorrectNames} not so lucky.",
      "And the answer... {answer}! Well done {correctNames}!",
      "It's {answer}! {correctNames} nailed it.",
    ],
    midgame: [
      "The answer is {answer}. {correctNames} got through. {incorrectNames} got caught out.",
      "It was {answer}! Congratulations {correctNames}.",
      "{answer} is correct! {correctNames} survive this one.",
    ],
    pressure: [
      "The answer... {answer}. {correctNames} lives to fight another round.",
      "It's {answer}. {incorrectNames} falls short.",
      "{answer}. Only {correctNames} got it.",
    ],
    gauntlet: [
      "The answer is... {answer}.",
      "{answer}. {correctNames} survives.",
    ],
  },
  round_intro: {
    warmup: [
      "Let's kick things off with {roundName}!",
      "Alright, {playerCount} players, nice and easy. This is {roundName}.",
      "Welcome! {roundName} to start. Don't get too comfortable!",
      "{roundName}! {difficulty} percent get this right. Should be a breeze.",
    ],
    midgame: [
      "Time for {roundName}. Things are picking up!",
      "{roundName} next. The easy points are behind us.",
      "Okay, {roundName}. Only {difficulty} percent territory now.",
      "Here comes {roundName}. Let's see who's been paying attention.",
    ],
    pressure: [
      "{roundName}. Only {difficulty} percent get this right.",
      "This is {roundName}. The pressure is on.",
      "{roundName}... and we're deep in it now.",
      "Welcome to {roundName}. Not many survive this one.",
    ],
    gauntlet: [
      "{roundName}. {difficulty} percent.",
      "This... is {roundName}.",
      "{roundName}. No mercy. No second chances.",
      "The final stretch. {roundName}.",
    ],
  },
  many_correct: {
    warmup: [
      "Too easy for this lot!",
      "Look at that, nearly everyone got it!",
      "No surprises there. Well done everyone.",
    ],
    midgame: [
      "Impressive! Most of you nailed that.",
      "Well well, you lot are sharper than I thought.",
      "Strong showing. {correctCount} got it right.",
    ],
    pressure: [
      "I'm shocked. That many got it?",
      "Against the odds, {correctCount} of you pulled through.",
      "That shouldn't have been that easy for you lot.",
    ],
    gauntlet: [
      "Unbelievable. Multiple survivors.",
      "I did NOT expect that many to get through.",
      "{correctCount} still standing. Incredible.",
    ],
  },
  few_correct: {
    warmup: [
      "Oh dear. Only {correctCount} got that right!",
      "Bit of a stumble there. Just {correctCount} correct.",
      "Trickier than it looked! Only {correctCount}.",
    ],
    midgame: [
      "Only {correctCount}! This is where it gets real.",
      "Ouch. {correctCount} correct. That's brutal.",
      "The pack is thinning. Just {correctCount} got through.",
    ],
    pressure: [
      "Only {correctCount}. As expected at this level.",
      "{correctCount}. This round takes no prisoners.",
      "Down to the wire. Just {correctCount}.",
    ],
    gauntlet: [
      "{correctCount}. That's all that's left.",
      "Brutal. Just {correctCount} survived.",
      "Only {correctCount} standing.",
    ],
  },
  none_correct: {
    warmup: [
      "Nobody? Not a single one? Come on!",
      "Zero correct! That's... unexpected.",
    ],
    midgame: [
      "Not one correct answer. Wow.",
      "A clean sweep... of failure.",
    ],
    pressure: [
      "Zero. This round is merciless.",
      "Nobody got through. That's the pressure round for you.",
    ],
    gauntlet: [
      "Everyone falls. Nobody survives.",
      "Wiped out. Every last one.",
    ],
  },
  leader_wrong: {
    warmup: [
      "Oh! The leader stumbles!",
      "Slip up from the front runner!",
    ],
    midgame: [
      "The leader got it wrong! Wide open now.",
      "A mistake at the top! Here come the challengers.",
    ],
    pressure: [
      "The leader falls! Game on.",
      "Down goes the favourite!",
    ],
    gauntlet: [
      "The leader... is wrong. Everything changes.",
      "No one is safe. Not even the leader.",
    ],
  },
  steal_executed: {
    warmup: ["Cheeky! {stealer} steals {amount} from {victim}!"],
    midgame: ["STOLEN! {stealer} takes {amount} from {victim}!"],
    pressure: ["{stealer} goes for the jugular! {amount} points stolen from {victim}!"],
    gauntlet: ["Cold-blooded steal. {stealer} rips {amount} from {victim}."],
  },
  elimination: {
    warmup: ["Oh no! {player} is out!"],
    midgame: ["And just like that, {player} is gone."],
    pressure: ["{player} falls. The herd thins."],
    gauntlet: ["{player}... eliminated.", "Gone. {player} is out."],
  },
  buzz_first: {
    warmup: ["{player} buzzes in first! Confident."],
    midgame: ["{player} on the buzzer! Bold move."],
    pressure: ["{player} goes for it! Brave or foolish?"],
    gauntlet: ["{player} buzzes. All or nothing."],
  },
  final_survivor: {
    warmup: ["Well done, {player}!"],
    midgame: ["{player} takes it!"],
    pressure: ["{player} is the last one standing!"],
    gauntlet: [
      "INCREDIBLE! {player} is THE ONE PERCENT!",
      "{player}! Against all odds! THE ONE PERCENT!",
      "Ladies and gentlemen... {player}. The One Percent.",
    ],
  },
  tier_transition: {
    warmup: [""],
    midgame: ["The warm-up is over. Welcome to the real game."],
    pressure: ["From here, every question could change everything."],
    gauntlet: ["This is it. The final stretch. Only the best survive."],
  },
  round_complete: {
    warmup: [
      "Round done! {mvp} led the way with {mvpScore} points.",
      "Nice round. {mvp} top scored with {mvpScore}.",
    ],
    midgame: [
      "{mvp} dominated that round! {mvpScore} points.",
      "What a round. {mvp} walks away with {mvpScore}.",
    ],
    pressure: [
      "{mvp} survives with {mvpScore} points. Impressive.",
      "Round over. {mvp} clinging to the lead with {mvpScore}.",
    ],
    gauntlet: [
      "{mvp}. {mvpScore} points. Legendary.",
      "That was intense. {mvp} with {mvpScore}.",
    ],
  },
};

// Track last used index per event to avoid immediate repeats
const lastUsed = new Map<string, number>();

function fillTemplate(template: string, ctx: CommentaryContext): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = ctx[key as keyof CommentaryContext];
    return val != null ? String(val) : `{${key}}`;
  });
}

export function getCommentary(
  event: CommentaryEvent,
  tier: Tier,
  ctx: CommentaryContext = {}
): string {
  const pool = POOLS[event]?.[tier];
  if (!pool || pool.length === 0) return '';

  const key = `${event}_${tier}`;
  const last = lastUsed.get(key) ?? -1;

  // Pick a random index that isn't the last used one
  let idx: number;
  if (pool.length === 1) {
    idx = 0;
  } else {
    do {
      idx = Math.floor(Math.random() * pool.length);
    } while (idx === last);
  }

  lastUsed.set(key, idx);
  return fillTemplate(pool[idx], ctx);
}
