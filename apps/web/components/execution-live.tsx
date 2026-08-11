"use client";

import { AlertTriangle, Bot, Check, ChevronDown, Clock3, Loader2, Play, RotateCcw, Square, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusDot } from "./ui";
import { useLocale, useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

type Step = {
  id?: string;
  stepId: string;
  name: string;
  status: string;
  attempt: number;
  durationMs: number | null;
  input?: unknown;
  output?: unknown;
  error?: unknown;
  logs?: Array<{ id: string; level: string; message: string; createdAt: string | Date }>;
};

export function ExecutionLive({ executionId, initialStatus, initialSteps }: { executionId: string; initialStatus: string; initialSteps: Step[] }) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [status, setStatus] = useState(initialStatus);
  const [steps, setSteps] = useState(initialSteps);
  const [expanded, setExpanded] = useState<string | null>(initialSteps.find((step) => step.status === "FAILED")?.stepId ?? null);
  const [working, setWorking] = useState("");
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    if (["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"].includes(status)) return;
    const source = new EventSource(`/api/executions/${executionId}/stream`);
    source.addEventListener("execution", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { status: string; steps: Step[] };
      setStatus(data.status);
      setSteps((current) => data.steps.map((step) => ({ ...current.find((item) => item.stepId === step.stepId), ...step })));
      if (["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"].includes(data.status)) {
        source.close();
        router.refresh();
      }
    });
    return () => source.close();
  }, [executionId, router, status]);

  async function action(name: "retry" | "cancel") {
    setWorking(name);
    const response = await fetch(`/api/executions/${executionId}/${name}`, { method: "POST" });
    setWorking("");
    if (response.ok) {
      setStatus(name === "retry" ? "QUEUED" : "CANCELLED");
      router.refresh();
    }
  }

  async function explain(question: "why_failed" | "fix" | "add_fallback" | "plain_language") {
    setWorking(question);
    const response = await fetch(`/api/executions/${executionId}/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question })
    });
    const body = await response.json() as { data?: { explanation: string; suggestionCreated: boolean } };
    setWorking("");
    setExplanation(body.data?.explanation ?? t("exec.noExplanation"));
  }

  return <div className="execution-live">
    <div className="execution-live-head"><StatusDot status={status} /><span>{["RUNNING", "QUEUED"].includes(status) ? t("exec.live") : t("exec.timeline")}</span><div>
      {["QUEUED", "RUNNING", "WAITING", "WAITING_FOR_APPROVAL"].includes(status) && <button className="button button-secondary button-small" onClick={() => action("cancel")}><Square size={13} /> {t("exec.cancel")}</button>}
      {status === "FAILED" && <button className="button button-primary button-small" onClick={() => action("retry")}>{working === "retry" ? <Loader2 className="spin" size={13} /> : <RotateCcw size={13} />} {t("exec.retry")}</button>}
    </div></div>
    <div className="step-timeline">
      {steps.map((step, index) => <article className={expanded === step.stepId ? "expanded" : ""} key={step.stepId}>
        <button className="step-summary" onClick={() => setExpanded(expanded === step.stepId ? null : step.stepId)}>
          <span className={`step-marker step-${step.status.toLowerCase()}`}>{step.status === "SUCCEEDED" ? <Check size={14} /> : step.status === "FAILED" ? <AlertTriangle size={14} /> : step.status === "RUNNING" ? <Loader2 className="spin" size={14} /> : <Play size={13} />}</span>
          {index < steps.length - 1 && <i />}
          <div><small>{t("exec.step")} {index + 1}</small><b>{step.name}</b></div>
          <StatusDot status={step.status} />
          <span><Clock3 size={12} />{step.durationMs ? `${step.durationMs} ${t("exec.ms")}` : "—"}</span>
          <span>{step.attempt > 1 ? `${step.attempt} ${t("exec.attempts")}` : `1 ${t("exec.attempt")}`}</span>
          <ChevronDown size={15} />
        </button>
        {expanded === step.stepId && <div className="step-details">
          <JsonPanel titleKey="exec.input" value={step.input} />
          <JsonPanel titleKey="exec.output" value={step.output} />
          {Boolean(step.error) && <JsonPanel titleKey="exec.error" value={step.error} error />}
          {step.logs?.length ? <div className="log-panel"><span>{t("exec.logs")}</span>{step.logs.map((log) => <p key={log.id}><i className={`log-${log.level}`} />{new Date(log.createdAt).toLocaleTimeString(locale)} · {log.message}</p>)}</div> : null}
        </div>}
      </article>)}
    </div>
    {status === "FAILED" && <aside className="debugger-panel">
      <div className="debugger-heading"><span><Bot size={17} /></span><div><b>{t("exec.debugTitle")}</b><small>{t("exec.debugSub")}</small></div><Sparkles size={14} /></div>
      <div className="debugger-actions">
        <button onClick={() => explain("why_failed")}>{t("exec.whyFailed")}</button>
        <button onClick={() => explain("plain_language")}>{t("exec.plainLanguage")}</button>
        <button onClick={() => explain("fix")}>{t("exec.proposeFix")}</button>
        <button onClick={() => explain("add_fallback")}>{t("exec.addFallback")}</button>
      </div>
      {working && !["retry", "cancel"].includes(working) && <div className="debugger-loading"><Loader2 className="spin" size={14} /> {t("exec.reviewing")}</div>}
      {explanation && <div className="debugger-response"><Sparkles size={15} /><p>{explanation}</p></div>}
    </aside>}
  </div>;
}

function JsonPanel({ titleKey, value, error }: { titleKey: UiCopyKey; value: unknown; error?: boolean }) {
  const t = useT();
  return <div className={error ? "json-panel error" : "json-panel"}><span>{t(titleKey)}</span><pre>{value === null || value === undefined ? t("common.noData") : JSON.stringify(value, null, 2)}</pre></div>;
}
