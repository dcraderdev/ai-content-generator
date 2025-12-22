import { NextRequest, NextResponse } from 'next/server';
import { downloadAndOptimize, formatBytes } from '@/lib/imageOptimization';
import path from 'path';
import fs from 'fs';

/**
 * API Route: Optimize image and save locally
 *
 * POST /api/optimize-image
 *
 * Body:
 * {
 *   imageUrl: string;    // URL from Replicate/DALL-E
 *   slug: string;        // Content slug (for filename)
 *   size?: string;       // 'fullSize' | 'thumbnail' | 'hero' | 'square'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, slug, size = 'fullSize' } = body;

    if (!imageUrl || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, slug' },
        { status: 400 }
      );
    }

    console.log(`[Optimize] Processing image for: ${slug}`);
    console.log(`[Optimize] Downloading from: ${imageUrl.substring(0, 80)}...`);

    // Determine output directory
    const publicDir = path.join(process.cwd(), 'public');
    const outputDir = path.join(publicDir, 'generated', slug);
    const outputPath = path.join(outputDir, `${slug}.jpg`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Download and optimize image
    console.log('[Optimize] Optimizing with Sharp...');
    const result = await downloadAndOptimize(
      imageUrl,
      outputPath,
      size as any
    );

    console.log(`[Optimize] Done: ${result.compressionRatio.toFixed(1)}% size reduction`);
    console.log(`[Optimize]   Original: ${formatBytes(result.originalSize)}`);
    console.log(`[Optimize]   WebP: ${formatBytes(result.webpSize)}`);
    console.log(`[Optimize]   JPEG: ${formatBytes(result.jpegSize)}`);

    // Build local URLs
    const localUrls = {
      webp: `/generated/${slug}/${slug}.webp`,
      jpeg: `/generated/${slug}/${slug}-optimized.jpg`,
      thumbnail: result.thumbnailPath
        ? `/generated/${slug}/${slug}-thumb.webp`
        : undefined,
    };

    return NextResponse.json({
      success: true,
      image: localUrls,
      local: {
        webp: result.webpPath.replace(publicDir, ''),
        jpeg: result.jpegPath.replace(publicDir, ''),
        thumbnail: result.thumbnailPath
          ? result.thumbnailPath.replace(publicDir, '')
          : undefined,
      },
      optimization: {
        originalSize: result.originalSize,
        webpSize: result.webpSize,
        jpegSize: result.jpegSize,
        compressionRatio: result.compressionRatio,
      },
    });
  } catch (error: any) {
    console.error('[Optimize] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to optimize image',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
