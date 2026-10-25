import 'server-only';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * Server-side AI access. This module MUST stay server-only: the API keys it reads
 * are never inlined into the client bundle, which is the entire point of moving
 * the calls off the browser.
 *
 * Provider selection mirrors the original single-slot behaviour — an `sk-or-…`
 * key means OpenRouter, anything else means Google — but each provider now has
 * its own named env var so both can be configured at once.
 */

const GOOGLE_MODEL = 'gemini-2.0-flash-lite';
const OPENROUTER_MODEL = 'openrouter/free';

type Provider = 'google' | 'openrouter' | null;

function resolveProvider(): Provider {
  const openRouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouter) return 'openrouter';

  const google = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (google) return 'google';

  return null;
}

export function getProvider(): Provider {
  return resolveProvider();
}

export class AIKeyMissingError extends Error {
  constructor() {
    super('AI provider is not configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.');
    this.name = 'AIKeyMissingError';
  }
}

interface GenerateArgs {
  prompt: string;
  /** base64 payload (no `data:` prefix) for image/audio attachments */
  data?: string;
  mimeType?: string;
  model?: string;
}

export async function generateAIContent({ prompt, data, mimeType, model }: GenerateArgs): Promise<string> {
  const provider = resolveProvider();
  if (!provider) throw new AIKeyMissingError();

  const content: Array<Record<string, unknown>> = [{ type: 'text', text: prompt }];

  if (data && mimeType) {
    // Strip a leading `data:<mime>;base64,` if the caller passed a full data URL.
    const base64 = data.includes('base64,') ? data.split('base64,')[1] : data;
    content.push({ type: 'file', data: base64, mediaType: mimeType });
  }

  if (provider === 'openrouter') {
    const openrouter = createOpenAICompatible({
      name: 'openrouter',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'TypeMaster AI',
      },
    });

    const { text } = await generateText({
      model: openrouter(model || OPENROUTER_MODEL),
      messages: [{ role: 'user', content: content as never }],
      temperature: 0.7,
      maxRetries: 2,
    });
    return text.trim();
  }

  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

  const { text } = await generateText({
    model: google(model || GOOGLE_MODEL),
    messages: [{ role: 'user', content: content as never }],
    temperature: 0.7,
    maxRetries: 2,
  });
  return text.trim();
}
