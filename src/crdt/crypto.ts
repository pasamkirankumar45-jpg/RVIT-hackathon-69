/**
 * Client-Side End-to-End Encryption (E2EE) Module
 * Implements standard AES-GCM (256-bit) using Web Crypto API.
 * Never invents custom crypto; uses authenticated symmetric encryption.
 */

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes for AES-GCM)
  authTag?: string;
}

export class E2EEService {
  private static keyCache: Map<string, CryptoKey> = new Map();

  /**
   * Derives a 256-bit AES-GCM key from a user/project passphrase using PBKDF2.
   */
  public static async deriveKeyFromPassphrase(
    passphrase: string,
    saltStr: string = 'codesync-salt-v1'
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = encoder.encode(saltStr);

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    return key;
  }

  /**
   * Generates a new random 256-bit AES-GCM key.
   */
  public static async generateRandomKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Exports a CryptoKey to a Base64 string for project sharing.
   */
  public static async exportKeyToBase64(key: CryptoKey): Promise<string> {
    const raw = await window.crypto.subtle.exportKey('raw', key);
    const bytes = new Uint8Array(raw);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Imports a CryptoKey from a Base64 string.
   */
  public static async importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
    const binary = atob(base64Key);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return window.crypto.subtle.importKey(
      'raw',
      bytes.buffer,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plaintext string using AES-GCM 256.
   */
  public static async encrypt(text: string, key: CryptoKey): Promise<EncryptedPayload> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // AES-GCM standard initialization vector is 12 bytes (96 bits)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    const ciphertextBytes = new Uint8Array(encryptedBuffer);
    let binary = '';
    for (let i = 0; i < ciphertextBytes.length; i++) {
      binary += String.fromCharCode(ciphertextBytes[i]);
    }

    let ivBinary = '';
    for (let i = 0; i < iv.length; i++) {
      ivBinary += String.fromCharCode(iv[i]);
    }

    return {
      ciphertext: btoa(binary),
      iv: btoa(ivBinary),
    };
  }

  /**
   * Decrypts ciphertext Base64 using AES-GCM 256.
   */
  public static async decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
    const ivBinary = atob(payload.iv);
    const iv = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      iv[i] = ivBinary.charCodeAt(i);
    }

    const cipherBinary = atob(payload.ciphertext);
    const cipherBytes = new Uint8Array(cipherBinary.length);
    for (let i = 0; i < cipherBinary.length; i++) {
      cipherBytes[i] = cipherBinary.charCodeAt(i);
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBytes.buffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }
}
