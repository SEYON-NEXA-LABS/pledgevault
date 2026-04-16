/**
 * Compresses an image Base64 string using HTML5 Canvas.
 * @param base64 The source base64 string
 * @param maxWidth Max width of the resulting image
 * @param quality Compression quality (0 to 1)
 * @returns A promise that resolves to the compressed base64 string
 */
export async function compressImage(base64: string, maxWidth = 1024, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as WebP (falls back to JPEG if not supported)
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = (err) => reject(err);
  });
}
