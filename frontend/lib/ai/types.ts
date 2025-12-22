/**
 * AI Services - Shared Types
 * Standardized types for all AI providers (Anthropic, OpenAI, Replicate)
 */

export type AIProvider = 'anthropic' | 'openai' | 'replicate';

/**
 * Result type for text generation operations
 */
export interface AITextResult {
  success: boolean;
  data?: string;           // Generated text
  error?: string;          // Error message if failed
  cost?: number;           // Cost in USD
  duration?: number;       // Time in milliseconds
  tokens?: number;         // Total tokens used
  provider: AIProvider;
}

/**
 * Result type for image generation operations
 */
export interface AIImageResult {
  success: boolean;
  data?: string;           // Image URL
  error?: string;          // Error message if failed
  cost?: number;           // Cost in USD
  duration?: number;       // Time in milliseconds
  provider: AIProvider;
  revisedPrompt?: string;  // AI-revised prompt (DALL-E)
}

/**
 * Error codes for AI operations
 */
export enum AIErrorCode {
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_REQUEST = 'INVALID_REQUEST',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}
