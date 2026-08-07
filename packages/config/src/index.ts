import { z } from "zod";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("postgresql://rezaru:rezaru@localhost:5432/rezaru"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  BETTER_AUTH_SECRET: z.string().min(16).default("development-only-secret-change-me"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  APP_ENCRYPTION_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["openai", "anthropic", "compatible", "rule-based"]).default("rule-based"),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  AI_MODEL: z.string().default("gpt-5-mini"),
  DEMO_MODE: z.coerce.boolean().default(true),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional()
});

export type Environment = z.infer<typeof environmentSchema>;

let cachedEnvironment: Environment | undefined;

export function getEnvironment(): Environment {
  cachedEnvironment ??= environmentSchema.parse(process.env);
  return cachedEnvironment;
}

export const PLAN_LIMITS = {
  FREE: { activeOutcomes: 3, executions: 500, members: 1, aiCredits: 50 },
  PRO: { activeOutcomes: 20, executions: 10_000, members: 3, aiCredits: 1_000 },
  TEAM: { activeOutcomes: 100, executions: 50_000, members: 20, aiCredits: 5_000 },
  BUSINESS: { activeOutcomes: Number.MAX_SAFE_INTEGER, executions: Number.MAX_SAFE_INTEGER, members: Number.MAX_SAFE_INTEGER, aiCredits: Number.MAX_SAFE_INTEGER }
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export function usageLevel(used: number, limit: number): "ok" | "warning" | "critical" | "blocked" {
  const ratio = used / limit;
  if (ratio >= 1) return "blocked";
  if (ratio >= 0.9) return "critical";
  if (ratio >= 0.7) return "warning";
  return "ok";
}

function applicationKey(): Buffer {
  const configured = process.env.APP_ENCRYPTION_KEY;
  if (configured) {
    const decoded = Buffer.from(configured, "base64");
    if (decoded.length !== 32) throw new Error("APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
    return decoded;
  }
  if (process.env.NODE_ENV === "production") throw new Error("APP_ENCRYPTION_KEY is required in production");
  return createHash("sha256").update(process.env.BETTER_AUTH_SECRET ?? "development-only-secret-change-me").digest();
}

export function encryptSecretRecord(value: Record<string, string>): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", applicationKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecretRecord(encrypted: string): Record<string, string> {
  const [version, ivValue, tagValue, ciphertextValue] = encrypted.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) throw new Error("Invalid encrypted credential envelope");
  const decipher = createDecipheriv("aes-256-gcm", applicationKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return JSON.parse(Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final()
  ]).toString("utf8")) as Record<string, string>;
}

export function hashSecretValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function verifySecretValue(value: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashSecretValue(value));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
