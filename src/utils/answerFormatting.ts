import type { RoundResult } from '../types';

export function getCorrectAnswerText(roundResult: RoundResult): string {
  const q = roundResult.question;

  // Multi-select (Grab Bag): show all correct options
  if (q.question_format === 'multi_select' && q.correct_answers && q.options) {
    return q.correct_answers.map((i) => q.options![i]).join(', ');
  }

  // Ranking (Close Call): show correct order
  if (q.question_format === 'ranking' && q.ranking_order && q.options) {
    return q.ranking_order.map((i) => q.options![i]).join(' → ');
  }

  // Standard multiple choice / image based
  if (q.type === 'multiple_choice' || q.type === 'image_based') {
    return q.options?.[Number(q.correct_answer)] ?? String(q.correct_answer);
  }
  if (q.type === 'sequence') {
    const items = q.sequence_items ?? q.options ?? [];
    const correctOrder = String(q.correct_answer).split(',').map(Number);
    return correctOrder.map((i) => items[i]).join(' → ');
  }
  // numeric
  return String(q.correct_answer);
}
