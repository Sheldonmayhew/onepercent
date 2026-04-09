import type { Question, QuestionPack, QuestionFormat } from '../types';
import { DIFFICULTY_TIERS, QUESTIONS_PER_ROUND } from '../types';
import { ROUND_TYPE_SEQUENCE } from '../roundTypes/sequence';
import { getRoundDefinition } from '../roundTypes/registry';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getQuestionFormat(q: Question): QuestionFormat {
  return q.question_format ?? 'standard_mc';
}

function findQuestions(
  allQuestions: Question[],
  difficulty: number,
  requiredFormat: QuestionFormat,
  count: number,
  usedIds: Set<string>,
): Question[] {
  const result: Question[] = [];

  // Try to find questions matching both difficulty and format
  let pool = allQuestions.filter(
    (q) => q.difficulty === difficulty && getQuestionFormat(q) === requiredFormat && !usedIds.has(q.id),
  );

  // Fallback 1: Match difficulty, any format (for standard_mc)
  if (pool.length < count && requiredFormat === 'standard_mc') {
    pool = allQuestions.filter((q) => q.difficulty === difficulty && !usedIds.has(q.id));
  }

  // Fallback 2: Match format, nearest difficulty
  if (pool.length < count) {
    const formatMatches = allQuestions.filter(
      (q) => getQuestionFormat(q) === requiredFormat && !usedIds.has(q.id),
    );
    if (formatMatches.length > 0) {
      const sorted = [...new Set(formatMatches.map((q) => q.difficulty))].sort(
        (a, b) => Math.abs(a - difficulty) - Math.abs(b - difficulty),
      );
      if (sorted.length > 0) {
        pool = formatMatches.filter((q) => q.difficulty === sorted[0]);
      }
    }
  }

  // Fallback 3: Match difficulty only
  if (pool.length < count) {
    pool = allQuestions.filter((q) => q.difficulty === difficulty && !usedIds.has(q.id));
  }

  // Fallback 4: Nearest difficulty, any format
  if (pool.length < count) {
    const unused = allQuestions.filter((q) => !usedIds.has(q.id));
    const sorted = [...new Set(unused.map((q) => q.difficulty))].sort(
      (a, b) => Math.abs(a - difficulty) - Math.abs(b - difficulty),
    );
    if (sorted.length > 0) {
      pool = unused.filter((q) => q.difficulty === sorted[0]);
    }
  }

  // Last resort: any question not yet used
  if (pool.length === 0) {
    pool = allQuestions.filter((q) => !usedIds.has(q.id));
  }

  // If still empty, allow reuse
  if (pool.length === 0) {
    pool = allQuestions;
  }

  // Pick `count` random questions from pool (without replacement within this round)
  const shuffled = shuffleArray(pool);
  for (let i = 0; i < count && i < shuffled.length; i++) {
    result.push(shuffled[i]);
    usedIds.add(shuffled[i].id);
  }

  // If we still don't have enough, fill with random from pool (allowing repeats)
  while (result.length < count && pool.length > 0) {
    result.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return result;
}

// Returns a 2D array: selectedQuestions[roundIndex][questionIndex]
export function selectQuestionsForGame(packs: QuestionPack[]): Question[][] {
  const tiers = [...DIFFICULTY_TIERS];
  const usedIds = new Set<string>();

  // Merge all questions from selected packs, tagging each with its pack name
  const allQuestions = packs.flatMap((p) =>
    p.questions.map((q) => ({ ...q, category: q.category ?? p.name })),
  );

  return tiers.map((difficulty, roundIndex) => {
    const roundTypeId = ROUND_TYPE_SEQUENCE[roundIndex];
    const roundDef = getRoundDefinition(roundTypeId);
    const requiredFormat = roundDef.questionFormat;
    const count = QUESTIONS_PER_ROUND[difficulty] ?? 1;

    return findQuestions(allQuestions, difficulty, requiredFormat, count, usedIds);
  });
}

export function formatPoints(points: number): string {
  return points.toLocaleString('en-ZA');
}

export function formatRands(points: number): string {
  return `R${points.toLocaleString('en-ZA')}`;
}

export function getDifficultyLabel(difficulty: number): string {
  return `${difficulty}%`;
}

export function getDifficultyColour(difficulty: number): string {
  if (difficulty >= 70) return '#22C55E';
  if (difficulty >= 40) return '#EAB308';
  if (difficulty >= 10) return '#F97316';
  return '#EF4444';
}

export function checkAnswer(question: Question, answer: string | number | null): boolean {
  if (answer === null || answer === '') return false;

  if (question.type === 'numeric_input') {
    const diff = Math.abs(Number(answer) - Number(question.correct_answer));
    return diff <= (question.error_range ?? 0);
  }

  if (question.type === 'sequence') {
    return String(answer) === String(question.correct_answer);
  }

  // multiple_choice and image_based use index
  return Number(answer) === Number(question.correct_answer);
}
