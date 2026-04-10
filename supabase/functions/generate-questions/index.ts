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
