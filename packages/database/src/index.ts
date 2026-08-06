import { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as unknown as { outcomeOsPrisma?: PrismaClient };

export const prisma =
  globalDatabase.outcomeOsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalDatabase.outcomeOsPrisma = prisma;

export * from "@prisma/client";
