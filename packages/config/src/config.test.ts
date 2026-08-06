import { beforeEach, describe, expect, it } from "vitest";
import { encryptSecretRecord, decryptSecretRecord, PLAN_LIMITS, usageLevel } from "./index";

describe("security and plan configuration", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.BETTER_AUTH_SECRET = "test-secret-with-sufficient-length";
    delete process.env.APP_ENCRYPTION_KEY;
  });

  it("encrypts credentials with authenticated encryption", () => {
    const encrypted = encryptSecretRecord({ token: "sensitive", account: "northstar" });
    expect(encrypted).not.toContain("sensitive");
    expect(decryptSecretRecord(encrypted)).toEqual({ token: "sensitive", account: "northstar" });
    const parts = encrypted.split(".");
    const ciphertext = parts[3]!;
    const index = Math.floor(ciphertext.length / 2);
    parts[3] = `${ciphertext.slice(0, index)}${ciphertext[index] === "A" ? "B" : "A"}${ciphertext.slice(index + 1)}`;
    expect(() => decryptSecretRecord(parts.join("."))).toThrow();
  });

  it("uses warning thresholds without changing plan limits", () => {
    expect(usageLevel(700, 1000)).toBe("warning");
    expect(usageLevel(900, 1000)).toBe("critical");
    expect(usageLevel(1000, 1000)).toBe("blocked");
    expect(PLAN_LIMITS.FREE.activeOutcomes).toBe(3);
  });
});
