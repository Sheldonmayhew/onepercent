import type { Question, QuestionPack } from '../types';
import { DIFFICULTY_TIERS } from '../types';

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

export function selectQuestionsForGame(packs: QuestionPack[]): Question[] {
  const tiers = [...DIFFICULTY_TIERS];

  // Merge all questions from selected packs, tagging each with its pack name
  const allQuestions = packs.flatMap((p) =>
    p.questions.map((q) => ({ ...q, category: q.category ?? p.name })),
  );

  return tiers.map((difficulty) => {
    let available = allQuestions.filter((q) => q.difficulty === difficulty);

    // Fallback: if no exact match, pick from the nearest available tier
    if (available.length === 0) {
      const sorted = [...new Set(allQuestions.map((q) => q.difficulty))].sort(
        (a, b) => Math.abs(a - difficulty) - Math.abs(b - difficulty),
      );
      if (sorted.length > 0) {
        available = allQuestions.filter((q) => q.difficulty === sorted[0]);
      }
    }

    if (available.length === 0) {
      // Last resort: pick any question
      available = allQuestions;
    }

    return available[Math.floor(Math.random() * available.length)];
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
