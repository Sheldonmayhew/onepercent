# Game Rounds & Points Distribution

One Percent is an 11-round trivia game where difficulty rises and stakes climb with every round. A perfect game scores exactly **100,000 points**. Every question within a round is worth the same flat amount — no escalation within rounds.

## Points Overview

| Round | Round Type | Tier | Difficulty | Per Question | Questions | Round Total |
|-------|---------------------|----------|------------|-------------|-----------|-------------|
| 1 | Point Builder | Warm-up | 90% | 250 | 4 | 1,000 |
| 2 | Quickstarter | Warm-up | 80% | 500 | 4 | 2,000 |
| 3 | Snap | Warm-up | 70% | 900 | 4 | 3,600 |
| 4 | Switchagories | Mid-game | 60% | 1,600 | = players | varies |
| 5 | Pass The Bomb | Mid-game | 50% | 2,500 | 3 | 7,500 |
| 6 | Grab Bag | Mid-game | 40% | 3,700 | 3 | 11,100 |
| 7 | Close Call | Pressure | 30% | 5,000 | 2 | 10,000 |
| 8 | Point Stealer | Pressure | 20% | 7,000 | 2 | 14,000 |
| 9 | Look Before You Leap | Pressure | 10% | 9,000 | 2 | 18,000 |
| 10 | Hot Seat | Gauntlet | 5% | 12,000 | 1 | 12,000 |
| 11 | Final Round | Gauntlet | 1% | 16,000 | 1 | 16,000 |
| | | | | | **Total** | **100,000** |

### Quick Play Mode

Quick Play uses 5 rounds drawn from tiers [90, 70, 50, 20, 1], totalling a subset of the full game.

---

## Round-by-Round Breakdown

### Round 1 — Point Builder

> "Everyone plays, everyone scores!"

- **Format:** Standard multiple choice
- **Scoring:** Correct = base points. Wrong = 0.
- **Mechanics:** None. Straightforward opener to get everyone on the board.

### Round 2 — Quickstarter

> "Build your streak, build your score!"

- **Format:** Standard multiple choice
- **Scoring:** Correct = base points × streak multiplier. Wrong = 0 (multiplier resets).
- **Mechanics:** Each player tracks a streak multiplier starting at 1.0×. Each consecutive correct answer adds +0.5× to the multiplier. A wrong answer resets it to 1.0×. Rewards consistent play early on.

### Round 3 — Snap

> "First to spot it scores big!"

- **Format:** Timed reveal with buzz-in
- **Scoring:** Correct players are ranked by buzz speed. Fastest gets full base points, then halving for each subsequent position. Wrong or no buzz = 0.
- **Mechanics:** Options are revealed progressively. Players buzz in when they know the answer. Speed matters — the fastest correct player earns the most.

| Position | Multiplier |
|----------|-----------|
| 1st | 100% |
| 2nd | 50% |
| 3rd | 25% |
| 4th+ | 10% |

### Round 4 — Switchagories

> "Pick your category, own your fate!"

- **Format:** Turn-based — one player picks a category per question, then everyone answers
- **Questions:** Number of questions = number of players. Each player gets one turn to pick.
- **Scoring:** Correct = base points (1,600). The **picker** earns **double** (2× = 3,200) if they answer correctly. Wrong = 0.
- **Mechanics:** Players take turns as the "picker." On your turn, you choose from 4 random question packs (drawn from the game's selected packs) — a question from that pack is served to all players. Since you chose a pack you're confident in, you're rewarded with 2× points if correct. Everyone else earns standard points. The round total scales with player count.

### Round 5 — Pass The Bomb

> "Don't let it blow up on you!"

- **Format:** Standard multiple choice
- **Scoring:** Correct = base points. Wrong = escalating penalty.
- **Mechanics:** The first wrong answer in a question costs 10% of base points. Each additional wrong answer adds another 5% to the penalty rate, capped at 30%. The "bomb" gets more dangerous the more it's passed.

| Wrong Answer # | Penalty |
|---------------|---------|
| 1st | -10% |
| 2nd | -15% |
| 3rd | -20% |
| 4th | -25% |
| 5th+ | -30% (cap) |

### Round 6 — Grab Bag

> "Pick the right ones, dodge the wrong!"

- **Format:** Multi-select
- **Scoring:** Base points are split equally across all correct answers. Each correct pick earns its share; each wrong pick deducts the same amount. Net score is floored at 0.
- **Mechanics:** Players select multiple answers from a set. Precision is rewarded — guessing wildly can cancel out correct picks. No negative scores possible.

### Round 7 — Close Call

> "Get the order right... or close enough!"

- **Format:** Ranking / ordering
- **Scoring:** Uses Kendall Tau distance (count of pairwise inversions). Each swap out of order reduces the score by 20%. Perfect order = full points. 5+ swaps = 0.
- **Mechanics:** Partial credit for close-but-imperfect orderings.

| Swaps Off | Multiplier |
|-----------|-----------|
| 0 | 100% |
| 1 | 80% |
| 2 | 60% |
| 3 | 40% |
| 4 | 20% |
| 5+ | 0% |

### Round 8 — Point Stealer

> "Take what you can!"

- **Format:** Standard multiple choice + steal target
- **Scoring:** Correct = base points. If the player selected a steal target, they earn an extra 25% of base points, and that amount is deducted from the target. Wrong = 0 (no steal occurs).
- **Mechanics:** After answering, players can choose another player to steal from. Only correct players execute the steal. Creates tension and rivalry in the late game.

### Round 9 — Look Before You Leap

> "Risk it for a bigger reward!"

- **Format:** Progressive reveal with buzz-in
- **Scoring:** Depends on when the player buzzes in relative to how much of the question has been revealed. Wrong answer = -50% of base points. No buzz = 0.
- **Mechanics:** The question is revealed gradually. Buzzing in early is a gamble — huge reward if right, painful penalty if wrong.

| Reveal % When Buzzed | Correct Multiplier |
|----------------------|-------------------|
| < 25% | 3× |
| 25–50% | 2× |
| 50–75% | 1.5× |
| > 75% | 1× |
| Wrong answer | -50% |

### Round 10 — Hot Seat

> "All eyes on you!"

- **Format:** Standard multiple choice, one player at a time
- **Scoring:** Correct = base points. Wrong = 0.
- **Mechanics:** Players are put in the spotlight individually, ordered from lowest score to highest (mercy rule). Everyone watches as each player answers alone. Simple scoring but maximum pressure.

### Round 11 — Final Round

> "One wrong and you're out!"

- **Format:** Standard multiple choice with elimination
- **Scoring:** Correct = base points. Wrong = 0 + **eliminated from the game**.
- **Mechanics:** The ultimate round. A wrong answer doesn't just cost points — it knocks the player out entirely. Eliminated players are skipped. Last player standing with the highest score wins.

---

## Design Philosophy

The points curve follows a quadratic progression rather than exponential. This ensures:

- **Consistency is rewarded** — the first 6 rounds (Warm-up + Mid-game) account for ~30% of total points, not a negligible fraction
- **Late rounds still matter** — rounds 10-11 are worth ~28% of total points, enough to create drama without erasing a consistent lead
- **Every round counts** — a player can't ignore early rounds and win on the final two alone
- **Flat per-question scoring** — no escalation within rounds keeps things simple and predictable for players
