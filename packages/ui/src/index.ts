import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const statusTone = {
  SUCCEEDED: "success",
  ACTIVE: "success",
  CONNECTED: "success",
  RUNNING: "info",
  QUEUED: "neutral",
  WAITING: "warning",
  WAITING_FOR_APPROVAL: "warning",
  NEEDS_ATTENTION: "warning",
  FAILED: "danger",
  CANCELLED: "neutral",
  PAUSED: "neutral",
  DRAFT: "neutral"
} as const;
