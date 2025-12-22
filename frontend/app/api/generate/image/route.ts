import { NextRequest, NextResponse } from 'next/server';
import { generateImage, FluxModel } from '@/lib/ai/replicate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('[API /api/generate/image] Request received');

  try {
    const body = await request.json();
    const {
      prompt,
      negativePrompt,
      model = 'recraft-v3',
      aspectRatio = '1:1'
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('[API /api/generate/image] Calling Replicate service...');
    console.log('[API /api/generate/image] Model:', model);

    const result = await generateImage(prompt, {
      model: model as FluxModel,
      aspectRatio,
      negativePrompt: negativePrompt || undefined
    });

    if (!result.success) {
      console.error('[API /api/generate/image] Error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.data,
      model,
      cost: result.cost,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/generate/image] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
