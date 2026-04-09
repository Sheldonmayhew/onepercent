# AI Question Generator Engine — Design Spec

**Date:** 2026-04-09  
**Status:** Draft

## Overview

Replace static JSON question packs with an AI-powered question generator that produces unique questions for every game session. The system uses a Supabase Edge Function to call an LLM, generating all 29 questions at game start with two-pass verification (generate + fact-check). Static packs remain as a silent fallback if generation fails.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend | Supabase Edge Function | Keeps API keys secure, no new infrastructure |
| Timing | Pre-generate full game at start | One loading screen, then seamless play |
| LLM Provider | Ollama Cloud (provider-agnostic) | Start with Ollama Cloud, swap via env vars later |
| Quality | Two-pass verification | Generate then verify — critical for game show correctness |
| Categories | Predefined categories (same grid) | Consistent UX, no free-text needed |
| Coexistence | AI-first with static fallback | Graceful degradation if generation fails |
| Architecture | Single batch request | One generate call + one verify call = 2 API calls total |

## Questions Per Game

The game has 11 rounds with varying question counts per round:

| Tier | Rounds | Questions/Round | Total |
|------|--------|-----------------|-------|
| Warm-up (90%, 80%, 70%) | 3 | 4 | 12 |
| Mid-game (60%, 50%, 40%) | 3 | 3 | 9 |
| Pressure (30%, 20%, 10%) | 3 | 2 | 6 |
| Gauntlet (5%, 1%) | 2 | 1 | 2 |
| **Total** | **11** | | **29** |

The generator must produce a 2D array: `Question[roundIndex][questionIndex]` matching this structure exactly.

## Architecture

```
┌──────────────┐     POST /generate-questions     ┌─────────────────────────┐
│  Client      │ ──────────────────────────────►   │  Supabase Edge Function │
│  (Host only) │                                   │                         │
│              │  ◄──────────────────────────────   │  1. Build prompt        │
│              │     { questions[][], verified }    │  2. Call LLM (generate) │
└──────┬───────┘                                   │  3. Call LLM (verify)   │
       │                                           │  4. Return or fallback  │
       │ questions passed to startGame()           └────────┬────────────────┘
       │                                                    │
       ▼                                                    ▼
┌──────────────┐                                   ┌────────────────┐
│  gameStore   │                                   │  LLM Provider  │
│  (unchanged) │                                   │  (OpenAI /     │
│              │                                   │   Anthropic /  │
│  Broadcast   │                                   │   etc.)        │
│  to players  │                                   └────────────────┘
└──────────────┘
```

### Flow

1. **CategorySelect** — Host selects predefined categories (same UI as today)
2. **Loading screen** — Client calls `generateQuestions()` which POSTs to the Edge Function. A themed loading overlay displays ("Crafting your unique questions...")
3. **Edge Function — Generation** — Builds a structured prompt with round sequence, question formats, difficulty calibration, and categories. Calls LLM. Parses structured JSON response.
4. **Edge Function — Verification** — Sends the 29 generated questions to a second LLM call for fact-checking. Each question gets a pass/fail with reasoning.
5. **Edge Function — Response** — If all (or most) pass verification, returns the questions. If >5 fail, retries generation once. If retry also fails, returns `fallback: true`.
6. **Client — Success** — Passes `Question[][]` to `startGame(generatedQuestions)`. Game proceeds normally.
7. **Client — Fallback** — Uses `selectQuestionsForGame()` from static packs. Shows subtle toast ("Using classic questions").

## Supabase Edge Function

### Endpoint

`POST /functions/v1/generate-questions`

### Request

```typescript
interface GenerateQuestionsRequest {
  categories: string[];
  roundSequence: {
    roundType: RoundTypeId;
    difficulty: number;
    questionFormat: QuestionFormat;
    questionCount: number;
  }[];
}
```

### Response

```typescript
interface GenerateQuestionsResponse {
  questions: Question[][];    // 2D array: [roundIndex][questionIndex]
  verified: boolean;          // true if all passed verification
  fallback: boolean;          // true if static packs were used
}
```

### Provider: Ollama Cloud

The initial implementation uses [Ollama Cloud](https://docs.ollama.com/cloud) as the LLM provider.

**API details:**
- Endpoint: `https://ollama.com/api/chat`
- Auth: `Authorization: Bearer <OLLAMA_API_KEY>`
- Format: Standard chat completion (system + user messages, JSON response)

**Environment variables:**
- `LLM_PROVIDER` — `"ollama"` (default), extensible to `"openai"` | `"anthropic"` later
- `OLLAMA_API_KEY` — API key from https://ollama.com/settings/keys
- `LLM_MODEL` — Ollama model identifier (e.g., `"gpt-oss:120b"`)

**Provider abstraction:** The Edge Function uses an internal `callLLM()` helper that dispatches based on `LLM_PROVIDER`. Initially only the Ollama adapter is implemented. Adding a new provider later means adding a new adapter function — no changes to prompt logic or the rest of the Edge Function.

```typescript
// Ollama Cloud call
const response = await fetch('https://ollama.com/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OLLAMA_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: Deno.env.get('LLM_MODEL') ?? 'gpt-oss:120b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
    format: 'json',
  }),
});
```

### Error Handling

- Generation fails (network/timeout/parse error) → return `{ fallback: true, questions: [], verified: false }` (client handles fallback locally)
- Verification flags >5 questions as incorrect → retry generation once
- Retry also fails → return `{ fallback: true }`
- Hard timeout: 30 seconds for entire flow

## Prompt Engineering

### Generation Prompt

**System prompt** includes:

1. **Role**: "You are a trivia question writer for The One Percent Club game show"
2. **Question JSON schema**: Full `Question` interface with all format-specific fields
3. **Round type reference**: Each of the 11 round types with:
   - Mechanic description (how the round is played)
   - Question style guidance (what makes a good question for this mechanic)
   - Required format-specific fields
4. **Difficulty calibration**: What each percentage means with examples
5. **Constraints**: No repeat topics, factually verifiable answers, explanations required

**Round Type Reference** (included in system prompt):

| Round | Format | Mechanic Context for LLM |
|-------|--------|--------------------------|
| Point Builder (90%) | standard_mc | Simple binary scoring. Straightforward common knowledge. |
| Quickstarter (80%) | standard_mc | Escalating multiplier. Still accessible but slightly harder. |
| Snap (70%) | timed_reveal | Options appear one at a time. Correct answer must NOT be first option. Set `reveal_delay_ms: 3000`. |
| Switchagories (60%) | categorized | Player picks from 3 categories first. Include `categories` array with 3 entries. |
| Pass The Bomb (50%) | standard_mc | Wrong = penalty. Questions should be tricky enough that guessing is risky. |
| Grab Bag (40%) | multi_select | 6-8 options, 3-4 correct. "Select ALL that apply." Use `correct_answers` array. |
| Close Call (30%) | ranking | Rank 4 items by criterion. Include `ranking_criterion` and `ranking_order`. |
| Point Stealer (20%) | standard_mc | Hard. Most players should get it wrong. Correct = steal points. |
| Look Before You Leap (10%) | progressive_reveal | 3-4 `reveal_chunks` from vague to specific. Early buzz = bonus multiplier. |
| Hot Seat (5%) | standard_mc | Expert-level. Solo spotlight. |
| Final Round (1%) | standard_mc | Near-impossible. Should stump trivia experts. Sudden death. |

**Difficulty calibration examples in prompt:**
- 90%: "What planet is closest to the Sun?" (common knowledge)
- 70%: "Which country's flag features a Union Jack in the corner?" (moderate)
- 50%: "Which country has the most UNESCO World Heritage Sites?" (tricky)
- 30%: "What element has the atomic number 76?" (specialized)
- 10%: "In which year was the Treaty of Tordesillas signed?" (expert)
- 1%: "What is the only letter that doesn't appear in any US state name?" (stumps experts)

**User prompt** provides the specific round sequence and categories for this game session.

### Verification Prompt

**System prompt**: "You are a fact-checker for trivia questions."

**Instructions**:
1. Verify each answer is factually correct
2. Confirm no other option could also be considered correct
3. Check difficulty rating is appropriate for the percentage
4. Validate format-specific fields (ranking_order is valid, correct_answers indices exist, reveal_chunks build logically)

**Output**: `{ results: [{ roundIndex, questionIndex, pass, reason }] }`

## Client-Side Integration

### New File: `src/utils/questionGenerator.ts`

Responsibilities:
- Build the `GenerateQuestionsRequest` from selected categories and round sequence
- Call the Supabase Edge Function
- Validate the response matches the `Question` schema
- Handle errors and trigger fallback to `selectQuestionsForGame()`

```typescript
// Pseudocode
export async function generateQuestions(
  categories: string[],
): Promise<{ questions: Question[][]; fallback: boolean }> {
  const roundSequence = ROUND_TYPE_SEQUENCE.map((id, i) => {
    const def = getRoundDefinition(id);
    const difficulty = DIFFICULTY_TIERS[i];
    return {
      roundType: id,
      difficulty,
      questionFormat: def.questionFormat,
      questionCount: QUESTIONS_PER_ROUND[difficulty],
    };
  });

  try {
    const response = await supabase.functions.invoke('generate-questions', {
      body: { categories, roundSequence },
    });

    if (response.error || response.data.fallback) {
      return { questions: selectQuestionsForGame(staticPacks), fallback: true };
    }

    return { questions: response.data.questions, fallback: false };
  } catch {
    return { questions: selectQuestionsForGame(staticPacks), fallback: true };
  }
}
```

### Modified: `src/stores/gameStore.ts`

`startGame()` accepts an optional `Question[][]` parameter. If provided, it uses those questions directly instead of calling `selectQuestionsForGame()`.

```typescript
startGame: (preGeneratedQuestions?: Question[][]) => {
  // ... existing setup ...
  const questions = preGeneratedQuestions ?? selectQuestionsForGame(packs);
  // ... rest unchanged ...
}
```

### Modified: `src/routes/CategorySelect.tsx`

On "START" / "NEXT" button press:
1. Show loading overlay
2. Call `generateQuestions(selectedCategories)`
3. Pass result to `startGame(questions)`
4. Navigate to round-intro

### New: Loading Screen

A loading overlay or interstitial screen shown during generation. Displays:
- Themed animation (spinning question mark, pulsing brain, etc.)
- "Crafting your unique questions..." text
- Progress indicator (indeterminate spinner — we don't have per-question progress)
- Falls back after 30s with toast notification

### Types: `src/types/index.ts`

Add:
```typescript
interface GenerateQuestionsRequest {
  categories: string[];
  roundSequence: {
    roundType: RoundTypeId;
    difficulty: number;
    questionFormat: QuestionFormat;
    questionCount: number;
  }[];
}

interface GenerateQuestionsResponse {
  questions: Question[][];
  verified: boolean;
  fallback: boolean;
}
```

## Multiplayer Impact

**None.** Only the host generates questions. The existing broadcast mechanism sends question data to players and the TV display. Since the generated questions conform to the same `Question` type, no changes are needed to:
- Player play flow
- TV display flow
- Multiplayer store
- Broadcast payloads

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-questions/index.ts` | Edge Function: prompt building, LLM calls, verification |
| `src/utils/questionGenerator.ts` | Client wrapper: calls Edge Function, handles fallback |
| `src/components/Game/GeneratingOverlay.tsx` | Loading screen during question generation |

## Files to Modify

| File | Change |
|------|--------|
| `src/stores/gameStore.ts` | `startGame()` accepts optional pre-generated questions |
| `src/routes/CategorySelect.tsx` | Async generation call before navigation, loading state |
| `src/types/index.ts` | Add request/response types |

## Cost Estimate

Using Ollama Cloud as the initial provider. Ollama Cloud pricing is not publicly documented at time of writing — monitor usage via the Ollama dashboard. If costs are a concern, the provider-agnostic design allows switching to a cheaper provider by changing env vars.

## Latency Budget

- Target: <15 seconds for generation + verification
- Loading screen provides visual feedback during wait
- 30-second hard timeout before automatic fallback to static packs

## Testing Strategy

- **Unit tests** for `questionGenerator.ts`: mock Edge Function responses, test fallback logic, test schema validation of returned questions
- **Integration test** for Edge Function: call with known categories, validate output matches `Question[][]` schema, verify all 29 questions have correct formats per round type
- **Verification accuracy**: manually review a sample of verified questions to calibrate prompt quality
- **Fallback testing**: simulate Edge Function failure and verify game proceeds with static packs
- **Multiplayer smoke test**: verify generated questions broadcast correctly to players and TV
