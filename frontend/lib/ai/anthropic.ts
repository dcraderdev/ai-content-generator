/**
 * Anthropic AI Service
 * Text generation using Claude models
 */

import Anthropic from '@anthropic-ai/sdk';
import { AITextResult } from './types';

// Model pricing per million tokens
const MODEL_PRICING = {
  'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
  'claude-opus-4-1-20250805': { input: 15.00, output: 75.00 },
  'claude-haiku-4-5-20251001': { input: 1.00, output: 5.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
} as const;

export type ClaudeModel = keyof typeof MODEL_PRICING;

export interface GenerateTextOptions {
  model?: ClaudeModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  useWebSearch?: boolean;
  webSearchDomains?: string[];
}

/**
 * Generate text using Claude
 */
export async function generateText(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<AITextResult> {
  const {
    model = 'claude-sonnet-4-5-20250929',
    maxTokens = 4096,
    temperature = 1.0,
    systemPrompt,
    useWebSearch = false,
    webSearchDomains = []
  } = options;

  console.log('[Anthropic] generateText called');
  console.log('[Anthropic] Model:', model);
  console.log('[Anthropic] Prompt length:', prompt.length);
  console.log('[Anthropic] Web search enabled:', useWebSearch);

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[Anthropic] Missing API key');
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY not configured in environment variables',
      provider: 'anthropic'
    };
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const startTime = Date.now();
    console.log('[Anthropic] Sending request...');

    // Build tools array if web search is enabled
    const tools = useWebSearch ? [{
      type: 'web_search_20250305' as const,
      name: 'web_search' as const,
      max_uses: 3,
      ...(webSearchDomains.length > 0 && { allowed_domains: webSearchDomains })
    }] : undefined;

    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      tools,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const duration = Date.now() - startTime;

    // Extract text from response
    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n');

    // Calculate cost
    const pricing = MODEL_PRICING[model];
    const inputCost = (message.usage.input_tokens / 1_000_000) * pricing.input;
    const outputCost = (message.usage.output_tokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const totalTokens = message.usage.input_tokens + message.usage.output_tokens;

    console.log('[Anthropic] Success!');
    console.log('[Anthropic] Tokens:', totalTokens);
    console.log('[Anthropic] Cost: $' + totalCost.toFixed(4));
    console.log('[Anthropic] Duration:', duration + 'ms');

    return {
      success: true,
      data: text,
      cost: totalCost,
      duration,
      tokens: totalTokens,
      provider: 'anthropic'
    };
  } catch (error: any) {
    console.error('[Anthropic] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate text',
      provider: 'anthropic'
    };
  }
}

/**
 * Get available Claude models
 */
export function getAvailableModels(): ClaudeModel[] {
  return Object.keys(MODEL_PRICING) as ClaudeModel[];
}

/**
 * Get pricing for a specific model
 */
export function getModelPricing(model: ClaudeModel) {
  return MODEL_PRICING[model];
}
