import type { Question, QuestionPack, GameMode } from '../types';
import { DIFFICULTY_TIERS, QUICK_TIERS } from '../types';

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

export function selectQuestionsForGame(pack: QuestionPack, mode: GameMode): Question[] {
  const tiers = mode === 'quick' ? [...QUICK_TIERS] : [...DIFFICULTY_TIERS];

  return tiers.map((difficulty) => {
    const available = pack.questions.filter((q) => q.difficulty === difficulty);
    if (available.length === 0) {
      throw new Error(`No questions found for difficulty ${difficulty}% in pack "${pack.name}"`);
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
  if (difficulty >= 70) return '#00FF88';
  if (difficulty >= 40) return '#FFD700';
  if (difficulty >= 10) return '#FF8C00';
  return '#FF2D6B';
}

export function checkAnswer(question: Question, answer: string | number | null): boolean {
  if (answer === null || answer === '') return false;

  if (question.type === 'numeric_input') {
    return Number(answer) === Number(question.correct_answer);
  }

  if (question.type === 'sequence') {
    return String(answer) === String(question.correct_answer);
  }

  // multiple_choice and image_based use index
  return Number(answer) === Number(question.correct_answer);
}
