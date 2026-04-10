import { supabase } from '../lib/supabase';
import type { Question, GenerateQuestionsRequest, GenerateQuestionsResponse, QuestionPack } from '../types';
import { DIFFICULTY_TIERS, QUESTIONS_PER_ROUND } from '../types';
import { ROUND_TYPE_SEQUENCE } from '../roundTypes/sequence';
import { getRoundDefinition } from '../roundTypes/registry';
import { selectQuestionsForGame } from './helpers';

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
