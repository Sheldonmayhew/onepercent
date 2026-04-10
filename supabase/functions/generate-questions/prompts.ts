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
