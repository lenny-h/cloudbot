// AES-GCM encryption using Web Crypto API (available in Cloudflare Workers)
export async function encryptApiKey(
  password: string,
  encryptionKey: string,
): Promise<string> {
  const encoder = new TextEncoder();

  // Import the key
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(encryptionKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the password
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(password),
  );

  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(
  encryptedPassword: string,
  encryptionKey: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedPassword), (c) =>
    c.charCodeAt(0),
  );

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Import the key
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(encryptionKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted,
  );

  return decoder.decode(decrypted);
}
