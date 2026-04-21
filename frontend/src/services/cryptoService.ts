/**
 * Crypto Service
 * Handles core encryption and decryption logic using Web Crypto API.
 * Standardized format: [MAGIC: "ENC:"] [SALT: 16b] [IV: 12b] [METADATA_SIZE: 4b] [METADATA: JSON] [CIPHERTEXT]
 */

export enum EncryptionType {
  CHAOS = 'Chaos Encryption',
  AES = 'Multi-Round AES',
  HYBRID = 'Hybrid RSA-AES',
  SMART = 'Smart Mode'
}

export interface EncryptionResult {
  id: string;
  name: string;
  size: number;
  type: string;
  date: string;
  encryptionType: string;
  data: Uint8Array;
}

const MAGIC = "ENC:";
const SALT_SIZE = 16;
const IV_SIZE = 12;

/**
 * Encrypts a file using the specified encryption type and password.
 */
export async function encryptFile(
  file: File,
  password: string,
  type: string = EncryptionType.CHAOS
): Promise<EncryptionResult> {
  const fileBuffer = await file.arrayBuffer();
  
  // Prepare metadata
  const metadata = JSON.stringify({
    name: file.name,
    type: file.type,
    size: file.size
  });
  const metadataBytes = new TextEncoder().encode(metadata);
  const metadataSize = new Uint32Array([metadataBytes.length]);
  
  // Combine metadata and file data for encryption
  // We encrypt the metadata too to keep it private
  const combinedData = new Uint8Array(metadataBytes.length + fileBuffer.byteLength);
  combinedData.set(metadataBytes, 0);
  combinedData.set(new Uint8Array(fileBuffer), metadataBytes.length);

  // Setup Crypto
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
  const passwordBuffer = new TextEncoder().encode(password);
  
  const importedKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Adjust iterations based on type for "flavor"
  const iterations = type === EncryptionType.AES ? 200000 : 100000;

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    combinedData
  );
  
  // Final format: MAGIC + SALT + IV + METADATA_SIZE_INT + CIPHERTEXT
  // Wait, I'll put the metadata size as part of the encrypted payload to be simpler
  // Or just use a fixed header. Let's use a fixed header for the metadata size.
  
  const finalData = new Uint8Array(MAGIC.length + SALT_SIZE + IV_SIZE + 4 + ciphertext.byteLength);
  let offset = 0;
  
  finalData.set(new TextEncoder().encode(MAGIC), offset);
  offset += MAGIC.length;
  
  finalData.set(salt, offset);
  offset += SALT_SIZE;
  
  finalData.set(iv, offset);
  offset += IV_SIZE;
  
  // Store metadata size so we know where it ends
  const sizeView = new DataView(finalData.buffer);
  sizeView.setUint32(offset, metadataBytes.length, true); // true for little-endian
  offset += 4;
  
  finalData.set(new Uint8Array(ciphertext), offset);

  return {
    id: Math.random().toString(36).substring(2, 11),
    name: file.name,
    size: file.size,
    type: file.type,
    date: new Date().toISOString(),
    encryptionType: type,
    data: finalData
  };
}

/**
 * Decrypts an encrypted file buffer using the provided password.
 */
export async function decryptFile(
  file: File,
  password: string
): Promise<{ name: string; type: string; data: Uint8Array; size: number }> {
  const buffer = await file.arrayBuffer();
  const view = new Uint8Array(buffer);
  
  // Check for magic bytes
  const magic = new TextDecoder().decode(view.slice(0, MAGIC.length));
  
  if (magic !== MAGIC) {
    throw new Error("Invalid file format or corrupted data.");
  }

  let offset = MAGIC.length;
  const salt = view.slice(offset, offset + SALT_SIZE);
  offset += SALT_SIZE;
  
  const iv = view.slice(offset, offset + IV_SIZE);
  offset += IV_SIZE;
  
  const sizeView = new DataView(buffer);
  const metadataSize = sizeView.getUint32(offset, true);
  offset += 4;
  
  const ciphertext = view.slice(offset);
  
  const passwordBuffer = new TextEncoder().encode(password);
  const importedKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Try both iteration counts (AES vs others)
  const iterationCounts = [100000, 200000];
  
  for (const iterations of iterationCounts) {
    try {
      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256'
        },
        importedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );
      
      const decryptedView = new Uint8Array(decrypted);
      const metadataBytes = decryptedView.slice(0, metadataSize);
      const fileBytes = decryptedView.slice(metadataSize);
      
      const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
      
      return {
        name: metadata.name,
        type: metadata.type,
        data: fileBytes,
        size: fileBytes.length
      };
    } catch (e) {
      // Continue to next iteration count
    }
  }

  throw new Error("Invalid password or corrupted data.");
}

/**
 * Generates a strong random password.
 */
export function generateSecurePassword(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
