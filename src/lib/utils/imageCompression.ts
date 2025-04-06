"use client";

interface CompressedImage {
  file: File;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to file
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: file.type,
                lastModified: Date.now(),
              }
            );

            resolve({
              file: compressedFile,
              width,
              height,
            });
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Could not read file'));
    };
  });
} 