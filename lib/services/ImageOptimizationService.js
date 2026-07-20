import sharp from 'sharp';

const WEBP_QUALITY = 85;
const COMPRESS_QUALITY = 80;
const CONVERTABLE_FORMATS = ['jpg', 'jpeg', 'png'];
const SKIP_FORMATS = ['svg', 'gif'];

export class ImageOptimizationService {
  static async optimizeBuffer(buffer, originalMimeType) {
    const ext = (originalMimeType.split('/')[1] || '').toLowerCase().replace('jpeg', 'jpg');

    if (SKIP_FORMATS.includes(ext)) {
      return {
        buffer,
        format: ext === 'jpeg' ? 'jpg' : ext,
        originalFormat: ext,
        optimized: false,
        originalSize: buffer.length,
        newSize: buffer.length,
      };
    }

    if (CONVERTABLE_FORMATS.includes(ext)) {
      try {
        const metadata = await sharp(buffer).metadata();
        const isPngWithAlpha = ext === 'png' && metadata.hasAlpha;

        const optimized = await sharp(buffer)
          .rotate()
          .webp({ quality: WEBP_QUALITY, alphaQuality: 90, effort: 4 })
          .toBuffer({ resolveWithObject: true });

        return {
          buffer: optimized.data,
          format: 'webp',
          originalFormat: ext,
          optimized: true,
          originalSize: buffer.length,
          newSize: optimized.info.size,
          width: optimized.info.width,
          height: optimized.info.height,
          hasAlpha: isPngWithAlpha,
        };
      } catch (error) {
        console.warn('WebP conversion failed, compressing in original format:', error.message);
        return this.compressBuffer(buffer, ext);
      }
    }

    return this.compressBuffer(buffer, ext);
  }

  static async compressBuffer(buffer, format) {
    try {
      const pipeline = sharp(buffer).rotate();

      let outputBuffer;
      let outputFormat = format;

      switch (format) {
        case 'jpg':
        case 'jpeg':
          outputBuffer = await pipeline
            .jpeg({ quality: COMPRESS_QUALITY, mozjpeg: true })
            .toBuffer({ resolveWithObject: true });
          outputFormat = 'jpg';
          break;
        case 'png':
          outputBuffer = await pipeline
            .png({ quality: COMPRESS_QUALITY, compressionLevel: 8 })
            .toBuffer({ resolveWithObject: true });
          outputFormat = 'png';
          break;
        case 'webp':
          outputBuffer = await pipeline
            .webp({ quality: COMPRESS_QUALITY })
            .toBuffer({ resolveWithObject: true });
          outputFormat = 'webp';
          break;
        default:
          return {
            buffer,
            format,
            originalFormat: format,
            optimized: false,
            originalSize: buffer.length,
            newSize: buffer.length,
          };
      }

      return {
        buffer: outputBuffer.data,
        format: outputFormat,
        originalFormat: format,
        optimized: true,
        originalSize: buffer.length,
        newSize: outputBuffer.info.size,
        width: outputBuffer.info.width,
        height: outputBuffer.info.height,
      };
    } catch (error) {
      console.warn('Compression failed, returning original:', error.message);
      return {
        buffer,
        format,
        originalFormat: format,
        optimized: false,
        originalSize: buffer.length,
        newSize: buffer.length,
      };
    }
  }

  static getMimeTypeForFormat(format) {
    const mimeMap = {
      webp: 'image/webp',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      avif: 'image/avif',
    };
    return mimeMap[format] || 'application/octet-stream';
  }

  static isImageMime(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }

  static isOptimizable(mimeType) {
    if (!this.isImageMime(mimeType)) return false;
    const ext = (mimeType.split('/')[1] || '').toLowerCase().replace('jpeg', 'jpg');
    return CONVERTABLE_FORMATS.includes(ext) || ext === 'webp' || ext === 'png' || ext === 'jpg';
  }
}
