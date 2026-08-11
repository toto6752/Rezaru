"use client";

import type { CompilationResult } from "@rezaru/workflow-schema";
import {
  ArrowRight, Bot, Check, ChevronRight, CircleAlert, Clock3, FlaskConical, GitBranch,
  History, Loader2, MessageSquare, Plug, Save, Send, Settings2, Sparkles, TestTube2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TechnicalWorkflowView } from "./technical-workflow-view";
import { useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

type Message = { role: "assistant" | "user"; text: string };
type Tab = "plan" | "technical" | "test" | "settings" | "versions";

const starterKeys: readonly UiCopyKey[] = ["comp.starter1", "comp.starter2", "comp.starter3", "comp.starter4"];

export function OutcomeComposer({ initialPrompt = "", initialCompilation }: { initialPrompt?: string; initialCompilation?: CompilationResult }) {
  const router = useRouter();
  const t = useT();
  const [instruction, setInstruction] = useState(initialPrompt);
  const [command, setCommand] = useState("");
  // The opening line is stored as a key so the greeting re-renders in the new
  // language when the switch is used; later messages are real conversation
  // text and stay exactly as they were written.
  const [messages, setMessages] = useState<Array<Message | { role: "assistant"; key: UiCopyKey }>>([
    { role: "assistant", key: "comp.greeting" }
  ]);
  const [compilation, setCompilation] = useState<CompilationResult | undefined>(initialCompilation);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [error, setError] = useState("");
  const [testData, setTestData] = useState(`{\n  "name": "Мадина",\n  "phone": "+992 90 000 00 00",\n  "item": "Торт «Медовик»",\n  "amount": 180\n}`);

  const workflow = compilation?.workflow;
  const allAnswered = compilation?.clarificationQuestions.every((question) => !question.required || Boolean(answers[question.id])) ?? false;

  useEffect(() => {
    if (initialPrompt && !initialCompilation) void compile(initialPrompt);
  }, []);

  async function compile(text = instruction, mergedAnswers = answers) {
    if (text.trim().length < 10) return;
    setLoading(true);
    setError("");
    setMessages((current) => [...current, { role: "user", text }]);
    try {
      const response = await fetch("/api/outcomes/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction: text, answers: mergedAnswers, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
      });
      const body = await response.json() as { data?: CompilationResult; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? t("comp.compileFailed"));
      const data = body.data;
      setCompilation(data);
      setMessages((current) => [...current, {
        role: "assistant",
        text: data.clarificationQuestions.length
          ? t(data.clarificationQuestions.length === 1 ? "comp.needDetailOne" : "comp.needDetailMany")
          : `${t("comp.planReady")} ${data.humanReadablePlan.length} ${t("comp.planSteps")}, ${data.requiredConnections.length} ${t("comp.planConn")}, ${data.estimatedExecutionsPerMonth ?? "—"} ${t("comp.planRuns")}.`
      }]);
    } catch (compileError) {
      setError(compileError instanceof Error ? compileError.message : t("comp.compileFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function submitClarifications() {
    if (!allAnswered) return;
    await compile(instruction, answers);
  }

  async function sendCommand() {
    const next = command.trim();
    if (!next) return;
    setCommand("");
    const fullInstruction = `${instruction}\n\n${next}`;
    setInstruction(fullInstruction);
    await compile(fullInstruction, answers);
  }

  async function saveOutcome() {
    if (!compilation?.workflow) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/outcomes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: compilation.outcomeSummary,
          description: instruction,
          compilation
        })
      });
      const body = await response.json() as { data?: { id: string }; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? t("comp.saveFailed"));
      router.push(`/app/outcomes/${body.data.id}`);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("comp.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const tabs = useMemo(() => [
    ["plan", "comp.tabPlan", MessageSquare],
    ["technical", "comp.tabTechnical", GitBranch],
    ["test", "comp.tabTest", TestTube2],
    ["settings", "comp.tabSettings", Settings2],
    ["versions", "comp.tabVersions", History]
  ] as const, []);

  return <div className="composer-page">
    <header className="composer-header">
      <div><span className="page-eyebrow">{t("comp.eyebrow")}</span><h1>{t("comp.title")}</h1></div>
      <div><span className="draft-state"><i /> {t("comp.draft")}</span><button className="button button-primary" disabled={!workflow || saving} onClick={saveOutcome}>{saving ? <Loader2 className="spin" size={15} /> : <Save size={15} />} {t("comp.save")}</button></div>
    </header>
    {error && <div className="error-banner"><CircleAlert size={16} /><span>{error}</span><button onClick={() => setError("")}>{t("common.dismiss")}</button></div>}
    <div className="composer-grid">
      <section className="conversation-panel">
        <div className="conversation-heading"><div><span className="ai-avatar"><Sparkles size={15} /></span><span><b>{t("comp.architect")}</b><small>{t("comp.architectSub")}</small></span></div><span className="online-dot">{t("comp.online")}</span></div>
        <div className="messages">
          {messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
            {message.role === "assistant" && <span className="message-avatar"><Bot size={14} /></span>}
            <div><small>{message.role === "assistant" ? "Rezaru" : t("comp.you")}</small><p>{"key" in message ? t(message.key) : message.text}</p></div>
          </div>)}
          {compilation?.clarificationQuestions.map((question) => <div className="clarification-card" key={question.id}>
            <span>{t("comp.requiredDetail")}</span><h3>{question.question}</h3><p>{question.reason}</p>
            {question.options ? <div className="clarification-options">{question.options.map((option) => <button className={answers[question.id] === option.value ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.value }))} key={option.value}>{answers[question.id] === option.value && <Check size={13} />}{option.label}</button>)}</div> :
              <input value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder={t("comp.answerPlaceholder")} />}
          </div>)}
          {compilation?.clarificationQuestions.length ? <button className="button button-primary clarification-submit" onClick={submitClarifications} disabled={!allAnswered || loading}>{loading ? <Loader2 className="spin" size={15} /> : <Sparkles size={15} />} {t("comp.buildPlan")}</button> : null}
          {loading && <div className="compiling"><span><i /><i /><i /></span><p>{t("comp.validating")}</p></div>}
          {!instruction && messages.length === 1 && <div className="starter-prompts"><span>{t("comp.tryExample")}</span>{starterKeys.map((key) => <button key={key} onClick={() => { setInstruction(t(key)); void compile(t(key)); }}><span>{t(key)}</span><ChevronRight size={14} /></button>)}</div>}
        </div>
        <div className="composer-input">
          <textarea value={compilation ? command : instruction} onChange={(event) => compilation ? setCommand(event.target.value) : setInstruction(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (compilation) void sendCommand();
              else void compile();
            }
          }} placeholder={compilation ? t("comp.modifyPlaceholder") : t("comp.describePlaceholder")} />
          <div><small><Sparkles size={12} /> {t("comp.hint")}</small><button aria-label={t("comp.send")} disabled={loading || (compilation ? !command.trim() : instruction.trim().length < 10)} onClick={() => compilation ? void sendCommand() : void compile()}><Send size={15} /></button></div>
        </div>
      </section>

      <section className="plan-panel">
        <div className="plan-tabs" role="tablist">
          {tabs.map(([id, labelKey, Icon]) => <button role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} key={id}><Icon size={14} />{t(labelKey)}</button>)}
        </div>
        <div className="plan-content">
          {!compilation && <div className="plan-empty"><span><Sparkles size={24} /></span><h2>{t("comp.emptyTitle")}</h2><p>{t("comp.emptyCopy")}</p><div><i /><i /><i /></div></div>}
          {compilation && activeTab === "plan" && <GeneratedPlan compilation={compilation} />}
          {workflow && activeTab === "technical" && <TechnicalWorkflowView workflow={workflow} />}
          {!workflow && activeTab === "technical" && <div className="plan-empty"><span><GitBranch size={20} /></span><h2>{t("comp.pendingTitle")}</h2><p>{t("comp.pendingCopy")}</p></div>}
          {activeTab === "test" && <div className="test-data-panel"><div><h3>{t("comp.sampleTitle")}</h3><p>{t("comp.sampleCopy")}</p></div><textarea value={testData} onChange={(event) => setTestData(event.target.value)} spellCheck={false} /><button className="button button-secondary" disabled={!workflow}><FlaskConical size={15} /> {t("comp.validateSample")}</button></div>}
          {activeTab === "settings" && <div className="settings-preview"><h3>{t("comp.execSettings")}</h3><div><span>{t("comp.concurrency")}</span><b>{workflow?.settings.concurrency ?? 5} {t("comp.concurrencyUnit")}</b></div><div><span>{t("comp.timeout")}</span><b>{(workflow?.settings.defaultTimeoutMs ?? 30000) / 1000}s</b></div><div><span>{t("comp.timezone")}</span><b>{workflow?.settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}</b></div><div><span>{t("comp.retention")}</span><b>{workflow?.settings.retentionDays ?? 30} {t("comp.days")}</b></div></div>}
          {activeTab === "versions" && <div className="version-preview"><div><span>v1</span><p><b>{t("comp.currentDraft")}</b><small>{t("comp.createdBy")}</small></p><i>{t("comp.draftBadge")}</i></div><p>{t("comp.versionNote")}</p></div>}
        </div>
        {compilation && <div className="plan-footer"><span><Clock3 size={14} /> ≈ {compilation.estimatedExecutionsPerMonth ?? "—"} {t("comp.perMonth")}</span><button className="button button-primary" disabled={!workflow || saving} onClick={saveOutcome}>{saving ? t("common.saving") : t("comp.saveReview")} <ArrowRight size={14} /></button></div>}
      </section>
    </div>
  </div>;
}

function GeneratedPlan({ compilation }: { compilation: CompilationResult }) {
  const t = useT();
  return <div className="generated-plan">
    <div className="generated-heading"><div><span>{t("comp.outcome")}</span><h2>{compilation.outcomeSummary}</h2></div><span className={compilation.workflow ? "validated" : "waiting"}>{compilation.workflow ? <><Check size={12} /> {t("comp.validated")}</> : <><Clock3 size={12} /> {t("comp.needsInput")}</>}</span></div>
    <ol>{compilation.humanReadablePlan.map((step, index) => <li key={step.id}><span>{index + 1}</span><div><b>{step.title}</b><p>{step.description}</p>{step.connectorKey && <small><Plug size={11} /> {step.connectorKey.replace("_", " ")}</small>}</div>{index < compilation.humanReadablePlan.length - 1 && <i />}</li>)}</ol>
    {compilation.requiredConnections.length > 0 && <div className="missing-connections"><div><Plug size={16} /><span><b>{compilation.requiredConnections.length} {t("comp.connNeeded")}</b><small>{t("comp.connNeededSub")}</small></span></div><div>{compilation.requiredConnections.map((connection) => <span key={connection.connectorKey}>{connection.label}</span>)}</div></div>}
    {compilation.assumptions.length > 0 && <div className="assumption-list"><span>{t("comp.assumptions")}</span>{compilation.assumptions.map((assumption) => <p key={assumption}><Check size={12} />{assumption}</p>)}</div>}
    {compilation.warnings.map((warning) => <div className="warning-row" key={warning}><CircleAlert size={14} />{warning}</div>)}
  </div>;
}
