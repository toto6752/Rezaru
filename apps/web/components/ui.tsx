import { cn } from "@outcomeos/ui";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={cn("button", `button-${variant}`, className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: string }) {
  return <span className={cn("badge", `badge-${tone}`, className)} {...props} />;
}

export function StatusDot({ status }: { status: string }) {
  const tone = ["SUCCEEDED", "ACTIVE", "CONNECTED"].includes(status) ? "success" :
    ["FAILED", "TIMED_OUT"].includes(status) ? "danger" :
    ["WAITING", "WAITING_FOR_APPROVAL", "NEEDS_ATTENTION"].includes(status) ? "warning" :
    ["RUNNING"].includes(status) ? "info" : "neutral";
  return <Badge tone={tone}><span className="status-dot" />{status.replaceAll("_", " ").toLowerCase()}</Badge>;
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
