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
