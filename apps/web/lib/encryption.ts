import { decryptSecretRecord, encryptSecretRecord, hashSecretValue, verifySecretValue } from "@outcomeos/config";

export function encryptCredentials(value: Record<string, string>): string {
  return encryptSecretRecord(value);
}

export function decryptCredentials(encrypted: string): Record<string, string> {
  return decryptSecretRecord(encrypted);
}

export function hashSecret(value: string): string {
  return hashSecretValue(value);
}

export function verifySecret(value: string, expectedHash: string): boolean {
  return verifySecretValue(value, expectedHash);
}

export function maskCredentialMetadata(credentials: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.keys(credentials).map((key) => [key, "••••••••"]));
}
