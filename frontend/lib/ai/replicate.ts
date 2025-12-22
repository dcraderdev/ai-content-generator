/**
 * Replicate AI Service
 * Image generation using Flux and other models
 */

import Replicate from 'replicate';
import { AIImageResult } from './types';

// Model configurations and pricing
const MODEL_CONFIGS = {
  'flux-schnell': {
    id: 'black-forest-labs/flux-schnell',
    cost: 0.003,
    speed: 'fastest',
    quality: 'good',
    description: 'Fastest and cheapest - great for iterations'
  },
  'flux-1.1-pro': {
    id: 'black-forest-labs/flux-1.1-pro',
    cost: 0.040,
    speed: 'medium',
    quality: 'high',
    description: 'Best balance of quality, speed, and cost'
  },
  'flux-1.1-pro-ultra': {
    id: 'black-forest-labs/flux-1.1-pro-ultra',
    cost: 0.060,
    speed: 'slow',
    quality: 'highest',
    description: '4x resolution, ultra-high quality'
  },
  'recraft-v3': {
    id: 'recraft-ai/recraft-v3',
    cost: 0.040,
    speed: 'medium',
    quality: 'highest',
    description: 'SOTA image quality - Best for photography'
  },
  'ideogram-v3': {
    id: 'ideogram-ai/ideogram-v3-quality',
    cost: 0.090,
    speed: 'slow',
    quality: 'highest',
    description: 'Best prompt adherence'
  }
} as const;

export type FluxModel = keyof typeof MODEL_CONFIGS;
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | 'square' | 'landscape' | 'portrait';

export interface GenerateImageOptions {
  model?: FluxModel;
  aspectRatio?: AspectRatio;
  steps?: number;
  guidanceScale?: number;
  negativePrompt?: string;
}

/**
 * Normalize aspect ratio to Replicate format
 */
function normalizeAspectRatio(ratio: AspectRatio): string {
  const ratioMap: Record<AspectRatio, string> = {
    '1:1': '1:1',
    'square': '1:1',
    '16:9': '16:9',
    'landscape': '16:9',
    '9:16': '9:16',
    'portrait': '9:16',
    '4:3': '4:3',
    '3:4': '3:4'
  };
  return ratioMap[ratio] || '1:1';
}

/**
 * Generate image using Replicate models
 */
export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<AIImageResult> {
  const {
    model = 'recraft-v3',
    aspectRatio = '1:1',
    steps,
    guidanceScale,
    negativePrompt
  } = options;

  console.log('[Replicate] generateImage called');
  console.log('[Replicate] Model:', model);
  console.log('[Replicate] Aspect Ratio:', aspectRatio);
  console.log('[Replicate] Prompt length:', prompt.length);

  if (!process.env.REPLICATE_API_KEY) {
    console.error('[Replicate] Missing API key');
    return {
      success: false,
      error: 'REPLICATE_API_KEY not configured in environment variables',
      provider: 'replicate'
    };
  }

  try {
    const client = new Replicate({
      auth: process.env.REPLICATE_API_KEY
    });

    const config = MODEL_CONFIGS[model];
    const normalizedRatio = normalizeAspectRatio(aspectRatio);

    const startTime = Date.now();
    console.log('[Replicate] Sending request...');
    console.log('[Replicate] Using model:', config.id);

    // Build input based on model
    let input: any = {
      prompt,
      aspect_ratio: normalizedRatio,
      output_format: 'jpg',
      output_quality: 90
    };

    // Add optional parameters if provided
    if (steps) {
      input.num_inference_steps = steps;
    }
    if (guidanceScale) {
      input.guidance_scale = guidanceScale;
    }

    // Model-specific settings
    if (model === 'flux-1.1-pro') {
      input.safety_tolerance = 2;
    } else if (model === 'flux-schnell') {
      input.num_inference_steps = 4;
      input.go_fast = true;
    } else if (model === 'recraft-v3') {
      const sizeMap: Record<string, string> = {
        '1:1': '1024x1024',
        '16:9': '1820x1024',
        '9:16': '1024x1820',
        '4:3': '1365x1024',
        '3:4': '1024x1365'
      };
      input = {
        prompt,
        size: sizeMap[normalizedRatio] || '1024x1024',
        style: 'realistic_image'
      };
      if (negativePrompt) {
        input.negative_prompt = negativePrompt;
      }
    } else if (model === 'ideogram-v3') {
      input = {
        prompt,
        aspect_ratio: normalizedRatio,
        magic_prompt: false,
        style: 'Realistic'
      };
    }

    // Retry logic for transient errors
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 2000;
    let output: any;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Replicate] Attempt ${attempt}/${MAX_RETRIES}...`);
        output = await client.run(config.id as `${string}/${string}`, {
          input
        });
        lastError = null;
        break;
      } catch (retryError: any) {
        lastError = retryError;
        const errorMessage = retryError.message || String(retryError);

        const isRetryable =
          errorMessage.includes('Connection reset') ||
          errorMessage.includes('ECONNRESET') ||
          errorMessage.includes('Queue is full') ||
          errorMessage.includes('rate limit');

        if (isRetryable && attempt < MAX_RETRIES) {
          const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.warn(`[Replicate] Attempt ${attempt} failed: ${errorMessage}`);
          console.log(`[Replicate] Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          throw retryError;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    const duration = Date.now() - startTime;

    // Extract image URL from output
    let imageUrl = '';
    if (Array.isArray(output)) {
      imageUrl = output[0] as string;
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object') {
      if ('url' in output) {
        const urlValue = (output as any).url;
        imageUrl = typeof urlValue === 'function' ? urlValue() : urlValue;
      } else if (typeof (output as any).toString === 'function') {
        imageUrl = (output as any).toString();
      }
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      return {
        success: false,
        error: 'Failed to extract valid image URL from Replicate response',
        provider: 'replicate'
      };
    }

    console.log('[Replicate] Success!');
    console.log('[Replicate] Image URL:', imageUrl);
    console.log('[Replicate] Cost: $' + config.cost.toFixed(4));
    console.log('[Replicate] Duration:', duration + 'ms');

    return {
      success: true,
      data: imageUrl,
      cost: config.cost,
      duration,
      provider: 'replicate'
    };
  } catch (error: any) {
    console.error('[Replicate] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate image',
      provider: 'replicate'
    };
  }
}

/**
 * Get available models
 */
export function getAvailableModels(): FluxModel[] {
  return Object.keys(MODEL_CONFIGS) as FluxModel[];
}

/**
 * Get model configuration
 */
export function getModelConfig(model: FluxModel) {
  return MODEL_CONFIGS[model];
}

/**
 * Get pricing for a model
 */
export function getModelPricing(model: FluxModel): number {
  return MODEL_CONFIGS[model].cost;
}

/**
 * Get supported aspect ratios
 */
export function getSupportedAspectRatios(): AspectRatio[] {
  return ['1:1', 'square', '16:9', 'landscape', '9:16', 'portrait', '4:3', '3:4'];
}
