# Round Type System — Game Show Mechanics Design

## Context

The 1% Club game currently runs 11 rounds of increasing difficulty (90% → 1%), but every round uses the same mechanic: standard question → answer → reveal. This makes the game feel repetitive by mid-game. The goal is to transform each round into a **distinct game show round type** inspired by Buzz! and Trivial Pursuit, creating a dynamic, escalating experience that feels like a real game show across all three modes (individual, team, TV spectator).

## Architecture: Hybrid Registry with Typed Slots

Each round type is a self-contained definition file that declares its name, theme, scoring logic, timer config, question format requirements, and lazy-loaded React component slots. A central registry maps `RoundTypeId → RoundTypeDefinition`. Existing route components (`Play.tsx`, `TvDisplay.tsx`) become thin dispatchers that render the current round type's slot components.

### Why This Approach

- **Co-location**: Scoring, interaction model, and components live together per round type — no jumping between files.
- **Pluggability**: Adding a 12th round type means one definition file + one component folder.
- **Lazy loading**: Each round's components only load when that round starts (critical for mobile players).
- **TV production**: Each round type has full control over its TV rendering via dedicated slot components.

---

## Round Types Overview

### Difficulty-to-Round Mapping

| Round | Difficulty | Type | Tier | Mechanic Summary |
|-------|-----------|------|------|-------------------|
| 1 | 90% | Point Builder | Warm-up | Everyone answers, correct = score |
| 2 | 80% | Quickstarter | Warm-up | Standard MC, escalating points per consecutive correct |
| 3 | 70% | Snap | Warm-up | Options appear one at a time, first correct buzz scores more |
| 4 | 60% | Switchagories | Mid-game | Pick a category, bonus for getting your own right |
| 5 | 50% | Pass The Bomb | Mid-game | Wrong answer = point penalty applied to you |
| 6 | 40% | Grab Bag | Mid-game | Pick all correct answers from a larger pool |
| 7 | 30% | Close Call | Pressure | Rank items in correct order, partial credit |
| 8 | 20% | Point Stealer | Pressure | Correct = steal points from an opponent |
| 9 | 10% | Look Before You Leap | Pressure | Question reveals progressively, buzz early for bonus but risk wrong |
| 10 | 5% | Hot Seat | Gauntlet | Solo spotlight, one player answers at a time |
| 11 | 1% | Final Round | Gauntlet | Sudden death, one wrong = eliminated |

---

## Question Data Model

### Existing `Question` Type (unchanged fields)

```typescript
interface Question {
  id: string;
  difficulty: number;
  type: QuestionType; // 'multiple_choice' | 'numeric_input' | 'image_based' | 'sequence'
  time_limit_seconds: number;
  question: string;
  options?: string[];
  correct_answer: number | string;
  error_range?: number;
  explanation: string;
  image_url?: string | null;
  sequence_items?: string[];
  category?: string;
}
```

### New Fields

```typescript
interface Question {
  // ... existing fields ...

  // New: Declares which question format this question uses
  question_format?: QuestionFormat;
  // Defaults to 'standard_mc' if absent (backward compatible)

  // For 'multi_select' format (Grab Bag)
  correct_answers?: number[];           // indices of all correct options

  // For 'ranking' format (Close Call)
  ranking_criterion?: string;           // e.g., "oldest to newest"
  ranking_order?: number[];             // correct order of option indices

  // For 'timed_reveal' format (Snap)
  reveal_delay_ms?: number;             // interval between option reveals (default 3000)

  // For 'progressive_reveal' format (Look Before You Leap)
  reveal_chunks?: string[];             // question text split into progressive chunks

  // For 'categorized' format (Switchagories)
  categories?: string[];                // available category labels for this question
}

type QuestionFormat =
  | 'standard_mc'           // Point Builder, Quickstarter, Pass The Bomb, Point Stealer, Hot Seat, Final Round
  | 'timed_reveal'          // Snap — options appear one at a time
  | 'categorized'           // Switchagories — question tagged with selectable categories
  | 'multi_select'          // Grab Bag — multiple correct from a pool
  | 'ranking'               // Close Call — order items by criterion
  | 'progressive_reveal';   // Look Before You Leap — question text reveals progressively
```

---

## Round Type Definition Interface

```typescript
type RoundTypeId =
  | 'point_builder' | 'quickstarter' | 'snap'
  | 'switchagories' | 'pass_the_bomb' | 'grab_bag'
  | 'close_call' | 'point_stealer' | 'look_before_you_leap'
  | 'hot_seat' | 'final_round';

interface RoundTypeDefinition<TState = void> {
  id: RoundTypeId;
  name: string;
  tagline: string;
  tier: 'warmup' | 'midgame' | 'pressure' | 'gauntlet';
  difficulty: number;

  theme: RoundTheme;
  timer: { duration: number; autoStart: boolean; countUp?: boolean };
  questionFormat: QuestionFormat;

  // State factory for round-specific ephemeral state
  createInitialState: (players: Player[], question: Question) => TState;

  // Pure scoring function
  score: (
    players: Player[],
    question: Question,
    state: TState,
    basePoints: number
  ) => PlayerScoreUpdate[];

  // Broadcast events this round type uses beyond standard 'answer'
  broadcastEvents: readonly string[];

  // Lazy-loaded component slots
  slots: {
    PlayerInput: React.LazyExoticComponent<React.FC<PlayerInputProps<TState>>>;
    TvPlay: React.LazyExoticComponent<React.FC<TvPlayProps<TState>>>;
    TvIntro: React.LazyExoticComponent<React.FC<TvIntroProps>>;
    TvReveal: React.LazyExoticComponent<React.FC<TvRevealProps<TState>>>;
    HostControls?: React.LazyExoticComponent<React.FC<HostControlProps<TState>>>;
  };
}

interface RoundTheme {
  primary: string;      // Main round color
  accent: string;       // Secondary color
  icon: string;         // Emoji icon
  introAnimation: 'slam' | 'slide' | 'pulse' | 'countdown' | 'spotlight' | 'heartbeat' | 'fire';
  soundCues: {
    intro: string;
    correct: string;
    wrong: string;
    special?: string;   // steal, bomb explode, elimination, etc.
  };
}

interface PlayerScoreUpdate {
  playerId: string;
  delta: number;          // Points gained (or lost if negative)
  stealFromId?: string;   // For Point Stealer — who points were stolen from
}
```

---

## Detailed Round Type Specifications

### 1. Point Builder (90% — Warm-up)

**Mechanic**: Standard multiple choice. Everyone answers, correct = base points. Pure warm-up.

**Scoring**: Binary — correct gets `POINTS_PER_ROUND[90]` (100 pts), wrong gets 0.

**Individual mode**: Identical to current gameplay. Eases players into the game.

**Team mode**: Points awarded individually, added to team total.

**TV display**: Standard question display with a "building" score ticker animation as answers come in. Shows answer count progress bar.

**Question format**: `standard_mc` (existing questions work as-is).

**Round state**: None (`void`).

---

### 2. Quickstarter (80% — Warm-up)

**Mechanic**: Standard MC, but with an escalating multiplier. Each consecutive correct answer by a player increases their personal multiplier (1x → 1.5x → 2x). Resets on wrong answer.

**Scoring**: `basePoints * playerMultiplier`. Multiplier tracked in round state per player.

**Individual mode**: Players build personal streaks. Rewards consistency.

**Team mode**: Each player has their own multiplier. Correct teammates see their individual multiplier climb, boosting team points.

**TV display**: Multiplier counter visible next to each player's name. Dramatic ramp-up animation when multiplier increases. Deflation animation on wrong answer.

**Question format**: `standard_mc`.

**Round state**: `{ multipliers: Record<string, number> }` — per-player multiplier.

---

### 3. Snap (70% — Warm-up)

**Mechanic**: Answer options appear on screen one at a time (every ~3 seconds). Players can buzz in at any time to pick an option. First correct buzz gets maximum points, later buzzes get less (decreasing by 15% per rank). Wrong buzz = 0 points.

**Timing**: Timestamp-based. Players send `buzz_in` event with `Date.now()`. Host resolves order by timestamp.

**Scoring**: Correct buzzes sorted by timestamp. Rank 1 = full points, Rank 2 = 85%, Rank 3 = 70%, etc. Floor at 25% of base points.

**Individual mode**: Pure speed competition. Tension between buzzing early (fewer options visible, riskier) vs waiting (more info, less points).

**Team mode**: Individual buzz timestamps. Multiple team members can buzz at different times, each earning their rank-based points for the team.

**TV display**: Options fly in dramatically one at a time with sound effects. Player buzz indicators light up in real-time as players lock in. Shows a "buzz order" leaderboard that updates live.

**Question format**: `timed_reveal` — uses `reveal_delay_ms` (default 3000ms between options).

**Round state**: `{ revealedOptions: number[]; buzzTimestamps: Record<string, number> }`.

**Broadcast events**: `buzz_in` — `{ playerId, timestamp, answer }`.

---

### 4. Switchagories (60% — Mid-game)

**Mechanic**: Before seeing the question, players are shown 3-4 category labels and must pick one. Then a question is shown. If the question matches the category you picked, you get a 2x bonus on correct answer.

**Scoring**: Correct = base points. Correct + picked matching category = 2x base points. Wrong = 0.

**Individual mode**: Players pick categories on their own device. Strategic choice — pick what you're confident in.

**Team mode**: Each player picks individually. One teammate might pick "History" while another picks "Science". Individual bonuses contribute to team total.

**TV display**: Category cards displayed like a game board during selection phase. "Lock in your category" countdown. After question reveal, categories light up showing who picked what. Bonus multiplier celebration for players who picked right.

**Question format**: `categorized` — question has `categories` array.

**Round state**: `{ categoryPicks: Record<string, string>; phase: 'picking' | 'answering' }`.

**Broadcast events**: `category_pick` — `{ playerId, category }`.

**Host controls**: Extra "REVEAL QUESTION" button after category picks are in.

---

### 5. Pass The Bomb (50% — Mid-game)

**Mechanic**: Standard MC question, but with a twist — wrong answers incur a point penalty. The "bomb" is a visual metaphor: if you answer wrong, the bomb "explodes" on you, deducting points. The penalty increases with each wrong answer in the round.

**Scoring**: Correct = base points. Wrong = `-penalty` (starts at 10% of base, increases by 5% per wrong answer in the round, capped at 30%).

**Individual mode**: Pressure not to be wrong. The later you answer wrong, the bigger the penalty (because others were wrong before you).

**Team mode**: Wrong answer = penalty to YOU, hurting your team total. If multiple teammates get it wrong, the stacking penalty compounds the damage.

**TV display**: Bomb graphic bouncing/sizzling. Explosion animation on each wrong answer with point deduction shown dramatically. "Penalty stack" counter visible.

**Question format**: `standard_mc`.

**Round state**: `{ wrongCount: number; penalties: Record<string, number> }`.

---

### 6. Grab Bag (40% — Mid-game)

**Mechanic**: A pool of 6-8 answer options is shown. Multiple are correct (3-4 typically). Players must select ALL the correct ones. Points awarded per correct pick, penalty per wrong pick.

**Scoring**: `+basePoints/correctCount` per correct selection. `-basePoints/correctCount` per wrong selection. Net score cannot go below 0 for the round.

**Individual mode**: Tap to select/deselect from the pool. Lock in when ready.

**Team mode**: Each player selects individually. Their net score contributes to team.

**TV display**: Pool of answer bubbles displayed in a grid. On reveal, correct ones glow green and float up, wrong ones shake red and fade. Player-by-player breakdown of what each person picked.

**Question format**: `multi_select` — uses `correct_answers: number[]`.

**Round state**: `{ selections: Record<string, number[]> }`.

**Broadcast events**: `grab_bag_submit` — `{ playerId, selectedIndices: number[] }`.

---

### 7. Close Call (30% — Pressure)

**Mechanic**: Players are given 4-5 items and must rank them in the correct order based on a criterion (e.g., "oldest to newest", "most to least expensive"). Points based on how close the ranking is to correct (partial credit).

**Scoring**: Uses Kendall tau distance (number of pairwise swaps needed). Perfect order = full points. Each swap off = `-20%` of base points. Minimum 0.

**Individual mode**: Drag-to-rank interface. At this difficulty (30%), the items will be genuinely hard to order.

**Team mode**: Each player submits their own ranking. Individual scores contribute to team.

**TV display**: Items displayed as cards. On reveal, correct order slides into place with satisfying cascading animation. Shows each player's ranking vs correct with a "closeness meter".

**Question format**: `ranking` — uses `ranking_order: number[]` and `ranking_criterion`.

**Round state**: `{ rankings: Record<string, number[]> }`.

**Broadcast events**: `ranking_submit` — `{ playerId, order: number[] }`.

---

### 8. Point Stealer (20% — Pressure)

**Mechanic**: Standard MC question. If you answer correctly, you get to pick ONE opponent to steal points from. You receive the base points AND steal a fixed amount (25% of base points or their available balance, whichever is lower) from the target.

**Scoring**: Correct = base points + steal amount. Target loses steal amount. Wrong = 0, no steal.

**Two-phase flow**:
1. Answer phase: Normal MC question
2. Steal phase: Correct players choose a steal target (15-second timer)

**Individual mode**: Direct player-to-player stealing. Creates rivalries and alliances.

**Team mode**: Individual targeting — you steal from an OPPONENT player (not your teammate). The stolen points come from that player's personal score and their team total. Your gain goes to your personal score and your team total. One brave/strategic player can swing the team battle.

**TV display**: After answer reveal, "Who do you steal from?" screen with opponent portraits. Dramatic steal animation showing points flowing from one player to another. Running score ticker updating in real-time.

**Question format**: `standard_mc`.

**Round state**: `{ phase: 'answering' | 'stealing'; stealChoices: Record<string, string>; correctPlayerIds: string[] }`.

**Broadcast events**: `steal_target` — `{ playerId, targetId }`.

**Host controls**: "START STEAL PHASE" button after answer reveal. "REVEAL STEALS" button after steal choices.

---

### 9. Look Before You Leap (10% — Pressure)

**Mechanic**: The question text reveals progressively — word by word or chunk by chunk. Players can buzz in at any time to answer. Earlier buzz = higher bonus multiplier, but if wrong, you LOSE points equal to base points x 50%.

**Timing**: Timestamp-based like Snap. Earlier buzz relative to reveal progress = higher multiplier.

**Scoring**: Correct at <25% revealed = 3x base. Correct at 25-50% = 2x. Correct at 50-75% = 1.5x. Correct at >75% = 1x. Wrong at any point = -50% of base points.

**Individual mode**: High risk/reward. At 10% difficulty, these questions are extremely hard — buzzing early on a partial question is genuinely dangerous.

**Team mode**: Individual buzz. One risky teammate can massively boost OR tank the team score. Creates incredible spectator moments.

**TV display**: Question text appearing letter by letter with typewriter effect, tension-building music. "LOCKED IN" flash when someone buzzes early. Multiplier indicator showing current bonus level decreasing as more text appears. Dramatic reveal of whether early buzzer was right.

**Question format**: `progressive_reveal` — uses `reveal_chunks: string[]`.

**Round state**: `{ revealedChunks: number; buzzTimestamps: Record<string, number>; totalChunks: number }`.

**Broadcast events**: `buzz_in` — `{ playerId, timestamp, answer, revealProgress: number }`.

---

### 10. Hot Seat (5% — Gauntlet)

**Mechanic**: Each player answers solo while everyone else watches. No hiding in the crowd. The question is shown one player at a time — all eyes on them.

**Scoring**: Standard — correct = base points (50,000!), wrong = 0. But the pressure is psychological, not mechanical.

**Player order**: Lowest score goes first (mercy rule — gives them a chance with less pressure). Highest score goes last (maximum pressure).

**Individual mode**: Players rotate through the hot seat. While waiting, you watch the current player's timer tick down on TV. Can they handle the pressure?

**Team mode**: One player per team takes the hot seat. Teams nominate (or host assigns). The chosen player's answer determines the team's fate for this round. Rest of team watches helplessly.

**TV display**: Full spotlight effect — current player's avatar and name displayed LARGE center stage. All other players dimmed in a "audience" row. Dramatic countdown timer with heartbeat sound. When they lock in, pregnant pause before reveal.

**Question format**: `standard_mc`.

**Round state**: `{ hotSeatOrder: string[]; currentHotSeatIndex: number; phase: 'intro' | 'answering' | 'reveal' }`.

**Host controls**: "NEXT PLAYER" to advance through hot seat order.

---

### 11. Final Round (1% — Gauntlet)

**Mechanic**: Sudden death. Every player answers simultaneously, but one wrong answer and you're ELIMINATED. Last player standing (or all survivors if multiple get it right) gets the full 100,000 points.

**Scoring**: Correct = 100,000 points. Wrong = eliminated (0 additional points, but keep accumulated score). If all remaining players get it right, they ALL get the points.

**Elimination**: Since this is the final round (one question), elimination means you don't get the 100k. Your existing score stands.

**Individual mode**: All-or-nothing. One shot at the biggest prize in the game.

**Team mode**: If any team member is eliminated, they're out personally but the team continues if other members survive. Points go to surviving team members' team total.

**TV display**: Maximum drama. Dark background with spotlight. "SUDDEN DEATH" title card. Players' avatars displayed in a line. After answer, wrong players' avatars dramatically "fall away" or shatter. Survivors get golden crown animation. Winner celebration with confetti.

**Question format**: `standard_mc`.

**Round state**: `{ eliminatedPlayerIds: string[] }`.

---

## State Management Changes

### GameSession Additions

```typescript
interface GameSession {
  // ... existing fields ...
  roundTypeSequence: RoundTypeId[];     // Length 11, parallel to selectedQuestions
  activeRoundState: unknown;            // Typed at usage site via round definition
}
```

### Player Additions

```typescript
interface Player {
  // ... existing fields ...
  answerTimestamp?: number;     // When player submitted (for speed-based rounds)
  eliminated?: boolean;        // For Final Round
  selectedCategory?: string;   // For Switchagories
  stealTarget?: string;        // For Point Stealer — who they chose to steal from
}
```

### GameBroadcast Additions

```typescript
interface BroadcastRound {
  // ... existing fields ...
  roundType: RoundTypeId;
  roundState?: unknown;        // Serialized round-specific state
}
```

### New Broadcast Events

| Event | Sender | Payload | Used By |
|-------|--------|---------|---------|
| `buzz_in` | Player | `{ playerId, timestamp, answer, revealProgress? }` | Snap, Look Before You Leap |
| `category_pick` | Player | `{ playerId, category }` | Switchagories |
| `steal_target` | Player | `{ playerId, targetId }` | Point Stealer |
| `grab_bag_submit` | Player | `{ playerId, selectedIndices: number[] }` | Grab Bag |
| `ranking_submit` | Player | `{ playerId, order: number[] }` | Close Call |

---

## Scoring Refactor

The current `revealAnswers()` in `gameStore.ts` (binary correct/wrong with fixed points) is replaced with delegation to the round type's `score()` function:

```typescript
revealAnswers: () => {
  const session = get().session;
  const roundType = getRoundDefinition(session.roundTypeSequence[session.currentRound]);
  const basePoints = POINTS_PER_ROUND[roundType.difficulty];
  
  const updates = roundType.score(
    session.players,
    session.selectedQuestions[session.currentRound],
    session.activeRoundState,
    basePoints
  );
  
  // Apply score deltas to players and teams
  // ...
}
```

---

## Question Selection Changes

`selectQuestionsForGame()` in `helpers.ts` is updated to:

1. Determine the round type sequence (fixed: `ROUND_TYPE_SEQUENCE`)
2. For each round, find a question matching both the difficulty tier AND the required `question_format`
3. Fall back to `standard_mc` format if no format-specific question exists
4. Questions without `question_format` are treated as `standard_mc`

This ensures backward compatibility — existing question packs work for the 7 round types that use `standard_mc`, while new packs can include format-specific questions for Snap, Grab Bag, Close Call, Switchagories, and Look Before You Leap.

---

## File Structure

```
src/
  roundTypes/
    registry.ts                         // ROUND_TYPE_REGISTRY map + getRoundDefinition()
    types.ts                            // RoundTypeDefinition, slot prop types, RoundTypeId
    sequence.ts                         // ROUND_TYPE_SEQUENCE constant
    definitions/
      pointBuilder.ts
      quickstarter.ts
      snap.ts
      switchagories.ts
      passTheBomb.ts
      grabBag.ts
      closeCall.ts
      pointStealer.ts
      lookBeforeYouLeap.ts
      hotSeat.ts
      finalRound.ts
  components/
    RoundTypes/
      Shared/
        BuzzButton.tsx                  // Reusable buzz-in button (Snap, LBYL)
        MultiSelectInput.tsx            // Reusable multi-select grid (Grab Bag)
        RankingInput.tsx                // Drag-to-rank interface (Close Call)
        StealPicker.tsx                 // Opponent selection UI (Point Stealer)
        CategoryPicker.tsx              // Category selection cards (Switchagories)
        SpotlightFrame.tsx              // Hot seat spotlight effect
        EliminationOverlay.tsx          // Sudden death elimination animation
      PointBuilder/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      Quickstarter/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      Snap/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      Switchagories/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      PassTheBomb/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      GrabBag/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      CloseCall/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      PointStealer/
        PlayerInput.tsx
        HostControls.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      LookBeforeYouLeap/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      HotSeat/
        PlayerInput.tsx
        HostControls.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
      FinalRound/
        PlayerInput.tsx
        TvPlay.tsx
        TvIntro.tsx
        TvReveal.tsx
```

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `RoundTypeId`, `QuestionFormat`, extend `Question`, `Player`, `GameSession` |
| `src/stores/gameStore.ts` | Refactor `revealAnswers()` to delegate to round type scoring. Add `activeRoundState` management. Update `startGame()` to set `roundTypeSequence` |
| `src/stores/multiplayerStore.ts` | Extend `GameBroadcast` with `roundType` and `roundState` |
| `src/hooks/useMultiplayer.ts` | Add new broadcast event handlers. Update `broadcastHostState()` |
| `src/hooks/useSpectator.ts` | Handle new broadcast data in spectator state |
| `src/routes/Play.tsx` | Refactor to dispatch to round type's `PlayerInput` slot |
| `src/routes/TvDisplay.tsx` | Dispatch to round type's TV slots |
| `src/routes/Reveal.tsx` | Handle round-type-specific reveal data |
| `src/routes/PlayerPlay.tsx` | Render correct PlayerInput based on broadcast round type |
| `src/utils/helpers.ts` | Update `selectQuestionsForGame()` for format matching, add `checkMultiSelectAnswer()`, `checkRankingAnswer()` |

---

## Verification Plan

1. **Unit tests**: Each round type's `score()` function tested with edge cases (all correct, all wrong, ties, steal from player with 0 points, ranking with perfect/worst order)
2. **Quick-play smoke test**: Play through all 11 rounds solo. Verify each round type renders its unique UI and scores correctly.
3. **Multiplayer test**: Host + 2 players. Verify buzz-in timestamps resolve correctly, steal targets sync, category picks broadcast properly.
4. **Team mode test**: Host + 4 players in 2 teams. Verify individual actions (steals, buzzes) correctly affect team totals.
5. **TV test**: Connect TV spectator. Verify each round type's TvIntro, TvPlay, and TvReveal render with unique animations and themes.
6. **Backward compatibility**: Load an existing question pack (no `question_format` fields). Verify rounds that need `standard_mc` work fine, and rounds needing special formats gracefully fall back.
7. **Build**: `npm run build` passes with no TypeScript errors.
