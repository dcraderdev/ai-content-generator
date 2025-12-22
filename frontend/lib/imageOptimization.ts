import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Image optimization configuration
 */
const IMAGE_CONFIG = {
  fullSize: {
    width: 1200,
    height: 675,
    webpQuality: 80,
    jpegQuality: 85
  },
  thumbnail: {
    width: 400,
    height: 225,
    webpQuality: 75,
    jpegQuality: 80
  },
  hero: {
    width: 1920,
    height: 1080,
    webpQuality: 85,
    jpegQuality: 90
  },
  square: {
    width: 1024,
    height: 1024,
    webpQuality: 80,
    jpegQuality: 85
  }
};

export type ImageSize = 'fullSize' | 'thumbnail' | 'hero' | 'square';

export interface OptimizationResult {
  webpPath: string;
  jpegPath: string;
  thumbnailPath?: string;
  originalSize: number;
  webpSize: number;
  jpegSize: number;
  compressionRatio: number;
}

/**
 * Optimize a single image and generate WebP + JPEG versions
 */
export async function optimizeImage(
  inputPath: string,
  size: ImageSize = 'fullSize',
  generateThumbnail: boolean = false,
  outputFilename?: string
): Promise<OptimizationResult> {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file does not exist: ${inputPath}`);
  }

  const config = IMAGE_CONFIG[size];
  const outputDir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const filename = outputFilename || path.basename(inputPath, ext);

  const originalSize = fs.statSync(inputPath).size;

  // Generate WebP version
  const webpPath = path.join(outputDir, `${filename}.webp`);
  await sharp(inputPath)
    .resize(config.width, config.height, {
      fit: 'cover',
      position: 'center'
    })
    .webp({
      quality: config.webpQuality,
      effort: 6
    })
    .toFile(webpPath);

  // Generate optimized JPEG version
  const jpegPath = path.join(outputDir, `${filename}-optimized.jpg`);
  await sharp(inputPath)
    .resize(config.width, config.height, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({
      quality: config.jpegQuality,
      mozjpeg: true
    })
    .toFile(jpegPath);

  const webpSize = fs.statSync(webpPath).size;
  const jpegSize = fs.statSync(jpegPath).size;

  const result: OptimizationResult = {
    webpPath,
    jpegPath,
    originalSize,
    webpSize,
    jpegSize,
    compressionRatio: ((originalSize - webpSize) / originalSize) * 100
  };

  if (generateThumbnail) {
    const thumbPath = path.join(outputDir, `${filename}-thumb.webp`);
    await sharp(inputPath)
      .resize(IMAGE_CONFIG.thumbnail.width, IMAGE_CONFIG.thumbnail.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({
        quality: IMAGE_CONFIG.thumbnail.webpQuality,
        effort: 6
      })
      .toFile(thumbPath);

    result.thumbnailPath = thumbPath;
  }

  return result;
}

/**
 * Download image from URL and optimize it
 */
export async function downloadAndOptimize(
  imageUrl: string,
  outputPath: string,
  size: ImageSize = 'fullSize'
): Promise<OptimizationResult> {
  const https = require('https');
  const http = require('http');

  const protocol = imageUrl.startsWith('https') ? https : http;
  const outputDir = path.dirname(outputPath);

  const ext = path.extname(outputPath);
  const desiredFilename = path.basename(outputPath, ext);
  const tempPath = path.join(outputDir, `temp-${Date.now()}-download.jpg`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Download image to temp file
  await new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(tempPath);

    protocol.get(imageUrl, (response: any) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err: Error) => {
      fs.unlink(tempPath, () => {});
      reject(err);
    });

    file.on('error', (err: Error) => {
      fs.unlink(tempPath, () => {});
      reject(err);
    });
  });

  // Optimize the downloaded image
  const result = await optimizeImage(tempPath, size, true, desiredFilename);

  // Delete temp download file
  fs.unlinkSync(tempPath);

  return result;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
