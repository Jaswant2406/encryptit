/**
 * Steganography Service
 * Implements Least Significant Bit (LSB) steganography for hiding data in images.
 */

import { encryptFile, decryptFile } from './cryptoService';

/**
 * Embeds a file into a cover image.
 */
export async function embedDataInImage(
  file: File,
  coverImage: File,
  password: string,
  canvas: HTMLCanvasElement
): Promise<string> {
  // 1. Encrypt the file first using the password for extra security
  // This ensures the hidden data is itself encrypted.
  const encrypted = await encryptFile(file, password);
  const data = encrypted.data; // Uint8Array

  // 2. Load the cover image into the canvas
  const img = new Image();
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Could not get canvas context"));

        // Use high precision for hidden bits
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Header: 32 bits for the data length
        // Each pixel has 4 channels: R, G, B, A.
        // We'll use R, G, B channels. 3 bits per pixel.
        const maxBits = (pixels.length / 4) * 3;
        const totalBitsNeeded = (4 + data.length) * 8;

        if (totalBitsNeeded > maxBits) {
          return reject(new Error("Cover image is too small to hide this file. Try a larger image."));
        }

        // Prepare bit stream: 4 bytes length + N bytes data
        const bitStream = new Uint8Array(4 + data.length);
        const dataView = new DataView(bitStream.buffer);
        dataView.setUint32(0, data.length, true);
        bitStream.set(data, 4);

        let streamBitOffset = 0;

        for (let i = 0; i < pixels.length && streamBitOffset < totalBitsNeeded; i++) {
          if (i % 4 === 3) continue; // Skip Alpha channel to avoid visibility issues in some viewers

          const byteIdx = Math.floor(streamBitOffset / 8);
          const bitIdx = streamBitOffset % 8;
          const bit = (bitStream[byteIdx] >> (7 - bitIdx)) & 1;

          // Set LSB
          pixels[i] = (pixels[i] & 0xFE) | bit;
          streamBitOffset++;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(coverImage);
  });
}

/**
 * Extracts hidden data from an image.
 */
export async function extractDataFromImage(
  stegoImage: File,
  password: string,
  canvas: HTMLCanvasElement
): Promise<{ name: string; type: string; data: Uint8Array; size: number }> {
  const img = new Image();
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      img.onload = async () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Could not get canvas context"));

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // 1. Extract first 32 bits (4 bytes) to get data length
        const lengthBuffer = new Uint8Array(4);
        let streamBitOffset = 0;
        let pixelIdx = 0;

        while (streamBitOffset < 32 && pixelIdx < pixels.length) {
          if (pixelIdx % 4 === 3) {
            pixelIdx++;
            continue;
          }

          const bit = pixels[pixelIdx] & 1;
          const byteIdx = Math.floor(streamBitOffset / 8);
          const bitIdx = streamBitOffset % 8;
          
          lengthBuffer[byteIdx] = (lengthBuffer[byteIdx] << 1) | bit;
          
          streamBitOffset++;
          pixelIdx++;
        }

        const dataLength = new DataView(lengthBuffer.buffer).getUint32(0, true);
        
        // Safety check for obvious corruption or huge size
        if (dataLength > pixels.length || dataLength === 0) {
          return reject(new Error("No valid hidden data found or invalid password."));
        }

        // 2. Extract the actual encrypted data
        const encryptedData = new Uint8Array(dataLength);
        streamBitOffset = 0; // Reset for relative data bits
        const totalDataBits = dataLength * 8;

        while (streamBitOffset < totalDataBits && pixelIdx < pixels.length) {
          if (pixelIdx % 4 === 3) {
            pixelIdx++;
            continue;
          }

          const bit = pixels[pixelIdx] & 1;
          const byteIdx = Math.floor(streamBitOffset / 8);
          // Accumulate bits into bytes
          encryptedData[byteIdx] = (encryptedData[byteIdx] << 1) | bit;

          streamBitOffset++;
          pixelIdx++;
        }

        try {
          // Wrap it in a pseudo-file for decryptFile
          const blob = new Blob([encryptedData]);
          const file = new File([blob], "temp", { type: 'application/octet-stream' });
          const decrypted = await decryptFile(file, password);
          resolve(decrypted);
        } catch (err) {
          reject(new Error("Failed to decrypt extracted data. Check your password."));
        }
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(stegoImage);
  });
}
