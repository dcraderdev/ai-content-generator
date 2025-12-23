import { NextRequest, NextResponse } from 'next/server';
import { generateText, ClaudeModel } from '@/lib/ai/anthropic';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('[API /api/generate/text] Request received');

  try {
    const body = await request.json();
    const {
      prompt,
      model = 'claude-sonnet-4-5-20250929' as ClaudeModel,
      systemPrompt,
      maxTokens = 4096,
      temperature = 1.0,
      useWebSearch = true,  // Enabled by default
      webSearchDomains = []
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('[API /api/generate/text] Calling Anthropic service...');
    console.log('[API /api/generate/text] Web search:', useWebSearch);

    const result = await generateText(prompt, {
      model: model as ClaudeModel,
      maxTokens,
      temperature,
      systemPrompt,
      useWebSearch,
      webSearchDomains
    });

    if (!result.success) {
      console.error('[API /api/generate/text] Error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate text' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: result.data,
      model,
      tokens: result.tokens,
      cost: result.cost,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/generate/text] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate text' },
      { status: 500 }
    );
  }
}
