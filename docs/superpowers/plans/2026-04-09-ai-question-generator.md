# AI Question Generator Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static JSON question packs with an AI-powered generator via Supabase Edge Function + Ollama Cloud, producing 29 unique questions per game with two-pass verification and silent fallback to static packs.

**Architecture:** A Supabase Edge Function receives the round sequence and categories, builds a structured prompt, calls Ollama Cloud twice (generate + verify), and returns `Question[][]`. The client calls this at game start via a new `questionGenerator.ts` utility, shows a loading overlay, and passes results to the existing `startGame()` flow. If anything fails, static packs are used transparently.

**Tech Stack:** Supabase Edge Functions (Deno), Ollama Cloud API, React + Zustand (existing), TypeScript

---

## File Structure

| File | Responsibility |
|------|---------------|
| **Create:** `supabase/functions/generate-questions/index.ts` | Edge Function entry point — request validation, orchestration of generate + verify calls, error handling |
| **Create:** `supabase/functions/generate-questions/prompts.ts` | System/user prompt builders for generation and verification |
| **Create:** `supabase/functions/generate-questions/llm.ts` | Provider-agnostic `callLLM()` helper with Ollama Cloud adapter |
| **Create:** `src/utils/questionGenerator.ts` | Client-side wrapper — calls Edge Function, validates response, falls back to static packs |
| **Create:** `src/components/Game/GeneratingOverlay.tsx` | Loading overlay shown during AI generation |
| **Modify:** `src/types/index.ts` | Add `GenerateQuestionsRequest`, `GenerateQuestionsResponse` types |
| **Modify:** `src/stores/gameStore.ts` | `startGame()` accepts optional `Question[][]` param |
| **Modify:** `src/routes/CategorySelect.tsx` | Wire up async generation before navigation, show loading overlay |

---

### Task 1: Add TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add request/response types to `src/types/index.ts`**

Add at the end of the file, before the last export (after `QUICK_TIERS`):

```typescript
// AI Question Generator types
export interface GenerateQuestionsRequest {
  categories: string[];
  roundSequence: {
    roundType: RoundTypeId;
    difficulty: number;
    questionFormat: QuestionFormat;
    questionCount: number;
  }[];
}

export interface GenerateQuestionsResponse {
  questions: Question[][];
  verified: boolean;
  fallback: boolean;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to the new types.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add AI question generator request/response types"
```

---

### Task 2: Create Supabase Edge Function — LLM Provider Helper

**Files:**
- Create: `supabase/functions/generate-questions/llm.ts`

- [ ] **Step 1: Create supabase functions directory**

```bash
mkdir -p supabase/functions/generate-questions
```

- [ ] **Step 2: Create the LLM provider helper**

Create `supabase/functions/generate-questions/llm.ts`:

```typescript
interface LLMMessage {
  role: 'system' | 'user';
  content: string;
}

interface LLMResponse {
  content: string;
}

export async function callLLM(messages: LLMMessage[]): Promise<LLMResponse> {
  const provider = Deno.env.get('LLM_PROVIDER') ?? 'ollama';

  if (provider === 'ollama') {
    return callOllama(messages);
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}

async function callOllama(messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = Deno.env.get('OLLAMA_API_KEY');
  if (!apiKey) throw new Error('OLLAMA_API_KEY not set');

  const model = Deno.env.get('LLM_MODEL') ?? 'gpt-oss:120b';

  const response = await fetch('https://ollama.com/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      format: 'json',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return { content: data.message?.content ?? '' };
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/generate-questions/llm.ts
git commit -m "feat: add LLM provider helper with Ollama Cloud adapter"
```

---

### Task 3: Create Supabase Edge Function — Prompt Builders

**Files:**
- Create: `supabase/functions/generate-questions/prompts.ts`

- [ ] **Step 1: Create the prompt builder file**

Create `supabase/functions/generate-questions/prompts.ts`:

```typescript
interface RoundSpec {
  roundType: string;
  difficulty: number;
  questionFormat: string;
  questionCount: number;
}

const ROUND_TYPE_CONTEXT: Record<string, string> = {
  point_builder: `POINT BUILDER — Simple binary scoring. Straightforward common knowledge.
    Format: standard_mc. 4 options, 1 correct. Fields: options (4 strings), correct_answer (index 0-3).`,

  quickstarter: `QUICKSTARTER — Escalating multiplier per consecutive correct answer. Still accessible but slightly harder.
    Format: standard_mc. 4 options, 1 correct. Fields: options (4 strings), correct_answer (index 0-3).`,

  snap: `SNAP — Options appear one at a time every 3 seconds. Players buzz in as soon as they recognise the answer. Earlier = more points.
    Format: timed_reveal. IMPORTANT: The correct answer must NOT be the first option revealed (index 0). Place it at index 1, 2, or 3.
    Fields: options (exactly 4 strings), correct_answer (index 1-3), reveal_delay_ms (always 3000).`,

  switchagories: `SWITCHAGORIES — Player picks from 3 category labels first, then answers a question from their chosen category. 2x bonus if correct.
    Format: categorized. The question should work regardless of which category the player picks.
    Fields: options (4 strings), correct_answer (index 0-3), categories (array of exactly 3 category label strings that the question topic fits into).`,

  pass_the_bomb: `PASS THE BOMB — Wrong answer = point penalty. Questions should be tricky enough that blind guessing is risky.
    Format: standard_mc. 4 options, 1 correct. Fields: options (4 strings), correct_answer (index 0-3).`,

  grab_bag: `GRAB BAG — "Select ALL that apply." 6-8 options, 3-4 are correct. Points per correct pick, penalty per wrong pick.
    Format: multi_select.
    Fields: options (6-8 strings), correct_answers (array of indices of the correct options, e.g. [0, 2, 5]).`,

  close_call: `CLOSE CALL — Rank 4 items by a criterion (e.g. "oldest to newest"). Partial credit via distance from correct order.
    Format: ranking.
    Fields: options (exactly 4 strings), ranking_criterion (string, e.g. "by population, smallest to largest"), ranking_order (array of 4 indices representing the correct order, e.g. [2, 0, 3, 1] means option at index 2 is first).`,

  point_stealer: `POINT STEALER — Hard question. Most players should get it wrong. Correct answer lets you steal points from another player.
    Format: standard_mc. 4 options, 1 correct. Fields: options (4 strings), correct_answer (index 0-3).`,

  look_before_you_leap: `LOOK BEFORE YOU LEAP — Question text reveals in 3-4 chunks. Early buzz = multiplier bonus, but risk answering with less info.
    Format: progressive_reveal. The first chunk should be very vague, each subsequent chunk adds meaningful info, the last chunk nearly gives it away.
    Fields: options (4 strings), correct_answer (index 0-3), reveal_chunks (array of 3-4 strings, each a partial version of the question).`,

  hot_seat: `HOT SEAT — Solo spotlight on one player at a time. Expert-level difficulty.
    Format: standard_mc. 4 options, 1 correct. Fields: options (4 strings), correct_answer (index 0-3).`,

  final_round: `FINAL ROUND — Sudden death. One wrong = eliminated. Near-impossible difficulty. Should stump trivia experts.
    Format: standard_mc. 4 options, 1 correct. Fields: options (4 strings), correct_answer (index 0-3).`,
};

const DIFFICULTY_EXAMPLES = `
Difficulty calibration (the percentage = what fraction of people would answer correctly):
- 90%: "What planet is closest to the Sun?" (common knowledge, almost everyone knows)
- 80%: "What is the chemical symbol for gold?" (basic education)
- 70%: "Which country's flag features a Union Jack in the corner?" (moderate knowledge)
- 60%: "What is the largest desert in the world?" (many guess wrong — it's Antarctica)
- 50%: "Which country has the most UNESCO World Heritage Sites?" (tricky)
- 40%: "What is the smallest bone in the human body?" (specialised knowledge)
- 30%: "What element has the atomic number 76?" (expert knowledge)
- 20%: "In what year did the Berlin Conference partition Africa?" (historical deep cut)
- 10%: "In which year was the Treaty of Tordesillas signed?" (expert historian level)
- 5%: "What is the only planet whose name in English doesn't derive from Greek or Roman mythology?" (very obscure)
- 1%: "What is the only letter that doesn't appear in any US state name?" (virtually nobody knows — answer: Q)
`;

const QUESTION_SCHEMA = `
Each question must be a JSON object with these fields:
{
  "id": string,           // unique identifier, use format "ai-{round}-{index}" e.g. "ai-0-0"
  "difficulty": number,   // must match the round's difficulty tier (90, 80, 70, etc.)
  "type": "multiple_choice",
  "time_limit_seconds": 45,
  "question": string,     // the question text
  "options": string[],    // answer options (4 for standard_mc/timed_reveal/ranking/progressive_reveal/categorized, 6-8 for multi_select)
  "correct_answer": number, // index of the correct option (0-based). For multi_select, this is the first correct index.
  "explanation": string,  // why the answer is correct — cite reasoning, don't just restate
  "question_format": string, // must match the round's required format
  
  // Format-specific fields (include ONLY the ones required for this round's format):
  "correct_answers": number[],    // multi_select only: all correct indices
  "ranking_criterion": string,    // ranking only: e.g. "by population, smallest to largest"
  "ranking_order": number[],      // ranking only: correct order of option indices
  "reveal_delay_ms": number,      // timed_reveal only: always 3000
  "reveal_chunks": string[],      // progressive_reveal only: 3-4 partial question strings
  "categories": string[]          // categorized only: exactly 3 category labels
}
`;

export function buildGenerationPrompt(
  categories: string[],
  roundSequence: RoundSpec[],
): { system: string; user: string } {
  const roundDescriptions = roundSequence
    .map((r, i) => {
      const context = ROUND_TYPE_CONTEXT[r.roundType] ?? 'Standard multiple choice.';
      return `Round ${i + 1} (${r.difficulty}% difficulty, ${r.questionCount} question${r.questionCount > 1 ? 's' : ''}):
  Type: ${r.roundType}
  Format: ${r.questionFormat}
  ${context}`;
    })
    .join('\n\n');

  const system = `You are a trivia question writer for "The One Percent Club" game show.
The game has 11 rounds of increasing difficulty from 90% (easiest) to 1% (hardest).
Each round may have multiple questions. You must generate ALL questions for ALL rounds.

${DIFFICULTY_EXAMPLES}

${QUESTION_SCHEMA}

RULES:
- ALL answers must be factually verifiable and unambiguously correct.
- No two questions in the entire game may cover the same specific topic or fact.
- Difficulty must scale genuinely — do not make all questions the same difficulty.
- Explanations must explain WHY the answer is correct, not just restate it.
- For each question, think step by step about whether the answer is correct before including it.
- Draw question topics from these categories: ${categories.join(', ')}.
- Distribute topics across categories — don't cluster all questions in one category.

OUTPUT FORMAT:
Return a JSON object with a single key "rounds" containing an array of 11 arrays.
Each inner array contains the questions for that round.
Example structure: { "rounds": [ [q1, q2, q3, q4], [q1, q2, q3, q4], ... ] }`;

  const user = `Generate trivia questions for this game. Here is the round sequence:

${roundDescriptions}

Return valid JSON with the "rounds" key. Ensure every question has all required fields for its format.`;

  return { system, user };
}

export function buildVerificationPrompt(
  questionsJson: string,
): { system: string; user: string } {
  const system = `You are a fact-checker for trivia questions in "The One Percent Club" game show.
For each question, you must:
1. Verify the stated correct answer is factually, unambiguously correct.
2. Confirm no other provided option could also be considered correct.
3. Check the difficulty is appropriate for its percentage tier.
4. Validate format-specific fields:
   - ranking: ranking_order contains valid indices and the order is correct
   - multi_select: correct_answers indices exist in the options array
   - progressive_reveal: reveal_chunks build logically from vague to specific
   - timed_reveal: correct_answer is NOT index 0 (first revealed)
   - categorized: categories array has exactly 3 entries

OUTPUT FORMAT:
Return a JSON object: { "results": [{ "roundIndex": number, "questionIndex": number, "pass": boolean, "reason": string }] }
Include one entry per question. If pass is false, explain what's wrong.`;

  const user = `Fact-check these trivia questions. Be strict — any incorrect answer, ambiguous question, or invalid format should fail.

${questionsJson}`;

  return { system, user };
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/generate-questions/prompts.ts
git commit -m "feat: add generation and verification prompt builders"
```

---

### Task 4: Create Supabase Edge Function — Main Handler

**Files:**
- Create: `supabase/functions/generate-questions/index.ts`

- [ ] **Step 1: Create the Edge Function entry point**

Create `supabase/functions/generate-questions/index.ts`:

```typescript
import { callLLM } from './llm.ts';
import { buildGenerationPrompt, buildVerificationPrompt } from './prompts.ts';

interface RoundSpec {
  roundType: string;
  difficulty: number;
  questionFormat: string;
  questionCount: number;
}

interface GenerateRequest {
  categories: string[];
  roundSequence: RoundSpec[];
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: GenerateRequest = await req.json();
    const { categories, roundSequence } = body;

    if (!categories?.length || !roundSequence?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing categories or roundSequence' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 1: Generate questions
    const genPrompt = buildGenerationPrompt(categories, roundSequence);
    const genResponse = await callLLM([
      { role: 'system', content: genPrompt.system },
      { role: 'user', content: genPrompt.user },
    ]);

    let generated: { rounds: unknown[][] };
    try {
      generated = JSON.parse(genResponse.content);
    } catch {
      console.error('Failed to parse generation response:', genResponse.content.slice(0, 500));
      return new Response(
        JSON.stringify({ questions: [], verified: false, fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!generated.rounds || !Array.isArray(generated.rounds) || generated.rounds.length !== 11) {
      console.error('Invalid rounds structure, got', generated.rounds?.length, 'rounds');
      return new Response(
        JSON.stringify({ questions: [], verified: false, fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validate question counts per round
    for (let i = 0; i < roundSequence.length; i++) {
      const expected = roundSequence[i].questionCount;
      const actual = generated.rounds[i]?.length ?? 0;
      if (actual < expected) {
        console.error(`Round ${i}: expected ${expected} questions, got ${actual}`);
        return new Response(
          JSON.stringify({ questions: [], verified: false, fallback: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Step 2: Verify questions
    const verifyPrompt = buildVerificationPrompt(JSON.stringify(generated));
    const verifyResponse = await callLLM([
      { role: 'system', content: verifyPrompt.system },
      { role: 'user', content: verifyPrompt.user },
    ]);

    let verification: { results: { roundIndex: number; questionIndex: number; pass: boolean; reason: string }[] };
    try {
      verification = JSON.parse(verifyResponse.content);
    } catch {
      // If verification parsing fails, return questions anyway but mark as unverified
      console.error('Failed to parse verification response');
      return new Response(
        JSON.stringify({ questions: generated.rounds, verified: false, fallback: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const failures = verification.results?.filter((r) => !r.pass) ?? [];
    if (failures.length > 5) {
      // Too many failures — retry generation once
      console.warn(`Verification failed ${failures.length} questions, retrying generation...`);
      const retryResponse = await callLLM([
        { role: 'system', content: genPrompt.system },
        { role: 'user', content: genPrompt.user },
      ]);

      try {
        const retryGenerated = JSON.parse(retryResponse.content);
        if (retryGenerated.rounds?.length === 11) {
          return new Response(
            JSON.stringify({ questions: retryGenerated.rounds, verified: false, fallback: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
      } catch {
        // Retry also failed
      }

      return new Response(
        JSON.stringify({ questions: [], verified: false, fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        questions: generated.rounds,
        verified: failures.length === 0,
        fallback: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ questions: [], verified: false, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/generate-questions/index.ts
git commit -m "feat: add generate-questions Edge Function with generation, verification, and retry"
```

---

### Task 5: Create Client-Side Question Generator

**Files:**
- Create: `src/utils/questionGenerator.ts`

- [ ] **Step 1: Create `src/utils/questionGenerator.ts`**

```typescript
import { supabase } from '../lib/supabase';
import type { Question, GenerateQuestionsRequest, GenerateQuestionsResponse } from '../types';
import { DIFFICULTY_TIERS, QUESTIONS_PER_ROUND } from '../types';
import { ROUND_TYPE_SEQUENCE } from '../roundTypes/sequence';
import { getRoundDefinition } from '../roundTypes/registry';
import { selectQuestionsForGame } from './helpers';
import type { QuestionPack } from '../types';

const GENERATION_TIMEOUT_MS = 30_000;

export async function generateQuestions(
  categories: string[],
  fallbackPacks: QuestionPack[],
): Promise<{ questions: Question[][]; fallback: boolean }> {
  const roundSequence: GenerateQuestionsRequest['roundSequence'] = ROUND_TYPE_SEQUENCE.map(
    (id, i) => {
      const def = getRoundDefinition(id);
      const difficulty = DIFFICULTY_TIERS[i];
      return {
        roundType: id,
        difficulty,
        questionFormat: def.questionFormat,
        questionCount: QUESTIONS_PER_ROUND[difficulty] ?? 1,
      };
    },
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    const { data, error } = await supabase.functions.invoke<GenerateQuestionsResponse>(
      'generate-questions',
      {
        body: { categories, roundSequence } satisfies GenerateQuestionsRequest,
      },
    );

    clearTimeout(timeout);

    if (error || !data || data.fallback || !data.questions?.length) {
      console.warn('AI generation failed or returned fallback, using static packs');
      return { questions: selectQuestionsForGame(fallbackPacks), fallback: true };
    }

    // Basic validation: ensure we got 11 rounds
    if (data.questions.length !== 11) {
      console.warn(`Expected 11 rounds, got ${data.questions.length}, using fallback`);
      return { questions: selectQuestionsForGame(fallbackPacks), fallback: true };
    }

    return { questions: data.questions, fallback: false };
  } catch (err) {
    console.warn('AI generation error, using static packs:', err);
    return { questions: selectQuestionsForGame(fallbackPacks), fallback: true };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/questionGenerator.ts
git commit -m "feat: add client-side question generator with fallback to static packs"
```

---

### Task 6: Modify `gameStore.ts` — Accept Pre-Generated Questions

**Files:**
- Modify: `src/stores/gameStore.ts`

- [ ] **Step 1: Update the `GameStore` interface**

In `src/stores/gameStore.ts`, change the `startGame` signature in the `GameStore` interface (around line 35):

```typescript
// Before:
startGame: () => void;

// After:
startGame: (preGeneratedQuestions?: Question[][]) => void;
```

- [ ] **Step 2: Update the `startGame` implementation**

In `src/stores/gameStore.ts`, update the `startGame` method (around line 183):

```typescript
// Before:
startGame: () => {
    const { session } = get();
    if (!session) return;

    const packs = get().availablePacks.filter((p) => session.settings.packIds.includes(p.pack_id));
    const questions = selectQuestionsForGame(packs.length > 0 ? packs : [session.pack]);

// After:
startGame: (preGeneratedQuestions) => {
    const { session } = get();
    if (!session) return;

    const questions = preGeneratedQuestions
      ?? selectQuestionsForGame(
           get().availablePacks.filter((p) => session.settings.packIds.includes(p.pack_id))
             || [session.pack]
         );
```

The rest of `startGame` remains unchanged — it already uses `questions` to set up `selectedQuestions`, `activeRoundState`, etc.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/stores/gameStore.ts
git commit -m "feat: allow startGame to accept pre-generated questions"
```

---

### Task 7: Create Generating Overlay Component

**Files:**
- Create: `src/components/Game/GeneratingOverlay.tsx`

- [ ] **Step 1: Create the overlay component**

Create `src/components/Game/GeneratingOverlay.tsx`:

```tsx
import { motion } from 'framer-motion';

interface GeneratingOverlayProps {
  visible: boolean;
}

export function GeneratingOverlay({ visible }: GeneratingOverlayProps) {
  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Pulsing icon */}
      <motion.div
        className="mb-8"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          className="w-20 h-20 text-neon-cyan"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      </motion.div>

      {/* Text */}
      <h2 className="font-display text-2xl text-text-primary tracking-wide mb-3">
        Crafting Your Questions
      </h2>
      <p className="text-text-secondary text-sm max-w-xs text-center">
        Our AI is generating unique questions just for this game...
      </p>

      {/* Spinner dots */}
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-neon-cyan"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Game/GeneratingOverlay.tsx
git commit -m "feat: add generating overlay component for AI question loading"
```

---

### Task 8: Wire Up CategorySelect — Quick Play Flow

**Files:**
- Modify: `src/routes/CategorySelect.tsx`

- [ ] **Step 1: Add imports and state**

At the top of `src/routes/CategorySelect.tsx`, add imports:

```typescript
// Add to existing imports:
import { generateQuestions } from '../utils/questionGenerator';
import { GeneratingOverlay } from '../components/Game/GeneratingOverlay';
```

Inside the `Component` function, add state for the loading overlay (after the existing `selectedPacks` state):

```typescript
const [isGenerating, setIsGenerating] = useState(false);
```

- [ ] **Step 2: Update `handleQuickPlay` to use AI generation**

Replace the existing `handleQuickPlay` function:

```typescript
const handleQuickPlay = async () => {
  const packs = selectedPacks.length > 0 ? selectedPacks : availablePacks.slice(0, 1).map((p) => p.pack_id);
  initQuickPlay(packs);
  addPlayer(profile?.name ?? 'Player', profile?.avatar);

  // Get selected pack names as categories for AI generation
  const categoryNames = availablePacks
    .filter((p) => packs.includes(p.pack_id))
    .map((p) => p.name);

  const fallbackPacks = availablePacks.filter((p) => packs.includes(p.pack_id));

  setIsGenerating(true);
  const { questions } = await generateQuestions(categoryNames, fallbackPacks);
  setIsGenerating(false);

  startGame(questions);
  navigate('/quick-play/round-intro');
};
```

- [ ] **Step 3: Update `handleHost` to use AI generation**

Replace the existing `handleHost` function. Add `async` and AI generation before navigation. The key change is adding generation before `navigate('/host/lobby')` — but for host mode, generation happens after lobby when `startGame` is called. Since `startGame` is called from the lobby, we need to store the generation result. 

Actually, looking at the flow more carefully: for multiplayer, `startGame()` is called from the host lobby after all players join, not from CategorySelect. So we should NOT generate in `handleHost`. Instead, we need to modify the host lobby's start-game trigger. Let me check where `startGame()` is called for multiplayer.

- [ ] **Step 4: Check where multiplayer `startGame()` is called**

Read `src/routes/HostLobby.tsx` to find where `startGame()` is invoked for multiplayer games, so we can inject AI generation there too.

- [ ] **Step 5: Add the GeneratingOverlay to the component JSX**

In the `return` statement of `CategorySelect`, add the overlay just before the closing `</div>`:

```tsx
{/* Add just before the final closing </div> */}
<GeneratingOverlay visible={isGenerating} />
```

- [ ] **Step 6: Verify the app compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/routes/CategorySelect.tsx
git commit -m "feat: wire up AI question generation in quick play flow"
```

---

### Task 9: Wire Up Host Lobby — Multiplayer Start Flow

**Files:**
- Modify: `src/routes/HostLobby.tsx` (need to read first to see structure)

- [ ] **Step 1: Read `src/routes/HostLobby.tsx`**

Read the file to find where `startGame()` is called and understand the flow.

- [ ] **Step 2: Add imports and state**

Add to imports:

```typescript
import { generateQuestions } from '../utils/questionGenerator';
import { GeneratingOverlay } from '../components/Game/GeneratingOverlay';
```

Add state:

```typescript
const [isGenerating, setIsGenerating] = useState(false);
```

- [ ] **Step 3: Wrap the existing start-game trigger with AI generation**

Find the existing `startGame()` call and wrap it. The pattern is:

```typescript
// Before:
startGame();
// navigation...

// After:
const categoryNames = availablePacks
  .filter((p) => session.settings.packIds.includes(p.pack_id))
  .map((p) => p.name);
const fallbackPacks = availablePacks.filter((p) => session.settings.packIds.includes(p.pack_id));

setIsGenerating(true);
const { questions } = await generateQuestions(categoryNames, fallbackPacks);
setIsGenerating(false);

startGame(questions);
// navigation...
```

Make the handler function `async` if it isn't already.

- [ ] **Step 4: Add the GeneratingOverlay to the JSX**

```tsx
<GeneratingOverlay visible={isGenerating} />
```

- [ ] **Step 5: Verify the app compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/routes/HostLobby.tsx
git commit -m "feat: wire up AI question generation in multiplayer host lobby"
```

---

### Task 10: Set Up Supabase Environment Variables

**Files:** None (Supabase dashboard configuration)

- [ ] **Step 1: Add env vars to Supabase project**

In the Supabase dashboard → Project Settings → Edge Functions → Secrets, add:

```
LLM_PROVIDER=ollama
OLLAMA_API_KEY=<your key from https://ollama.com/settings/keys>
LLM_MODEL=gpt-oss:120b
```

- [ ] **Step 2: Deploy the Edge Function**

```bash
npx supabase functions deploy generate-questions
```

- [ ] **Step 3: Test the Edge Function manually**

```bash
curl -X POST "https://<your-project>.supabase.co/functions/v1/generate-questions" \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["Science", "History"],
    "roundSequence": [
      {"roundType": "point_builder", "difficulty": 90, "questionFormat": "standard_mc", "questionCount": 4},
      {"roundType": "quickstarter", "difficulty": 80, "questionFormat": "standard_mc", "questionCount": 4},
      {"roundType": "snap", "difficulty": 70, "questionFormat": "timed_reveal", "questionCount": 4},
      {"roundType": "switchagories", "difficulty": 60, "questionFormat": "categorized", "questionCount": 3},
      {"roundType": "pass_the_bomb", "difficulty": 50, "questionFormat": "standard_mc", "questionCount": 3},
      {"roundType": "grab_bag", "difficulty": 40, "questionFormat": "multi_select", "questionCount": 3},
      {"roundType": "close_call", "difficulty": 30, "questionFormat": "ranking", "questionCount": 2},
      {"roundType": "point_stealer", "difficulty": 20, "questionFormat": "standard_mc", "questionCount": 2},
      {"roundType": "look_before_you_leap", "difficulty": 10, "questionFormat": "progressive_reveal", "questionCount": 2},
      {"roundType": "hot_seat", "difficulty": 5, "questionFormat": "standard_mc", "questionCount": 1},
      {"roundType": "final_round", "difficulty": 1, "questionFormat": "standard_mc", "questionCount": 1}
    ]
  }'
```

Expected: JSON response with `questions` array of 11 sub-arrays, `verified` boolean, `fallback: false`.

- [ ] **Step 4: Verify questions play through a full game**

Start a quick play game in the browser. The generating overlay should appear, then the game should proceed with AI-generated questions through all 11 rounds.

---

### Task 11: End-to-End Smoke Testing

- [ ] **Step 1: Quick Play smoke test**

1. Open the app → Quick Play → Select a category → Start
2. Verify the generating overlay appears
3. Verify all 11 rounds play through with unique questions
4. Verify special round types work: Snap (timed reveal), Grab Bag (multi-select), Close Call (ranking), LBYL (progressive reveal), Switchagories (categories)

- [ ] **Step 2: Multiplayer smoke test**

1. Host a game → Select categories → Create lobby
2. Have a player join via room code
3. Start the game from lobby
4. Verify generating overlay appears on host
5. Verify questions broadcast to player correctly
6. Play through at least 3-4 rounds to verify different round types

- [ ] **Step 3: Fallback smoke test**

1. Temporarily set an invalid `OLLAMA_API_KEY` in Supabase dashboard
2. Start a game
3. Verify the game still starts (using static packs)
4. Check browser console for fallback warning message
5. Restore the correct API key

- [ ] **Step 4: TV display smoke test**

1. Open TV display in a separate window
2. Start a multiplayer game with AI-generated questions
3. Verify TV display shows questions, player answers, and reveals correctly
