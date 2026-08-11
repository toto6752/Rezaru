import { cn } from "@rezaru/ui";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { StatusLabel } from "@/components/i18n";

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
  return <Badge tone={tone}><span className="status-dot" /><StatusLabel status={status} /></Badge>;
}

// title and description are nodes rather than strings so server pages can pass
// a <T k="…" /> without becoming client components themselves.
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: ReactNode; description: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
