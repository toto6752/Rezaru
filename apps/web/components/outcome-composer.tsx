"use client";

import type { CompilationResult } from "@outcomeos/workflow-schema";
import {
  ArrowRight, Bot, Check, ChevronRight, CircleAlert, Clock3, FlaskConical, GitBranch,
  History, Loader2, MessageSquare, Plug, Save, Send, Settings2, Sparkles, TestTube2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TechnicalWorkflowView } from "./technical-workflow-view";

type Message = { role: "assistant" | "user"; text: string };
type Tab = "plan" | "technical" | "test" | "settings" | "versions";

const starterPrompts = [
  "Send every new website lead to Slack and HubSpot.",
  "Every Monday, summarize sales performance and email the report to the CEO.",
  "Check invoices over $5,000 for anomalies and notify finance.",
  "When a customer cancels, create a retention task and send a personalized email."
];

export function OutcomeComposer({ initialPrompt = "", initialCompilation }: { initialPrompt?: string; initialCompilation?: CompilationResult }) {
  const router = useRouter();
  const [instruction, setInstruction] = useState(initialPrompt);
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Describe the business result you want. I’ll identify the trigger, actions, required connections, and only ask questions that block a safe plan." }
  ]);
  const [compilation, setCompilation] = useState<CompilationResult | undefined>(initialCompilation);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [error, setError] = useState("");
  const [testData, setTestData] = useState(`{\n  "email": "sam@northstar.example",\n  "firstName": "Sam",\n  "company": "Northstar Labs",\n  "amount": 6800\n}`);

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
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? "The outcome could not be compiled");
      const data = body.data;
      setCompilation(data);
      setMessages((current) => [...current, {
        role: "assistant",
        text: data.clarificationQuestions.length
          ? `I understand the outcome. I need ${data.clarificationQuestions.length === 1 ? "one detail" : `${data.clarificationQuestions.length} details`} before I can create a safe executable version.`
          : `The plan is ready: ${data.humanReadablePlan.length} steps, ${data.requiredConnections.length} required connections, and an estimated ${data.estimatedExecutionsPerMonth ?? "unknown number of"} monthly executions.`
      }]);
    } catch (compileError) {
      setError(compileError instanceof Error ? compileError.message : "Compilation failed");
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
    const fullInstruction = `${instruction}\n\nModification request: ${next}`;
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
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Could not save the outcome");
      router.push(`/app/outcomes/${body.data.id}`);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the outcome");
    } finally {
      setSaving(false);
    }
  }

  const tabs = useMemo(() => [
    ["plan", "Plan", MessageSquare],
    ["technical", "Technical flow", GitBranch],
    ["test", "Test data", TestTube2],
    ["settings", "Settings", Settings2],
    ["versions", "Versions", History]
  ] as const, []);

  return <div className="composer-page">
    <header className="composer-header">
      <div><span className="page-eyebrow">AI OUTCOME BUILDER</span><h1>Build an outcome</h1></div>
      <div><span className="draft-state"><i /> Draft saved locally</span><button className="button button-primary" disabled={!workflow || saving} onClick={saveOutcome}>{saving ? <Loader2 className="spin" size={15} /> : <Save size={15} />} Save outcome</button></div>
    </header>
    {error && <div className="error-banner"><CircleAlert size={16} /><span>{error}</span><button onClick={() => setError("")}>Dismiss</button></div>}
    <div className="composer-grid">
      <section className="conversation-panel">
        <div className="conversation-heading"><div><span className="ai-avatar"><Sparkles size={15} /></span><span><b>Outcome architect</b><small>Compiles only approved operations</small></span></div><span className="online-dot">ONLINE</span></div>
        <div className="messages">
          {messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
            {message.role === "assistant" && <span className="message-avatar"><Bot size={14} /></span>}
            <div><small>{message.role === "assistant" ? "OutcomeOS" : "You"}</small><p>{message.text}</p></div>
          </div>)}
          {compilation?.clarificationQuestions.map((question) => <div className="clarification-card" key={question.id}>
            <span>REQUIRED DETAIL</span><h3>{question.question}</h3><p>{question.reason}</p>
            {question.options ? <div className="clarification-options">{question.options.map((option) => <button className={answers[question.id] === option.value ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.value }))} key={option.value}>{answers[question.id] === option.value && <Check size={13} />}{option.label}</button>)}</div> :
              <input value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Enter the business destination…" />}
          </div>)}
          {compilation?.clarificationQuestions.length ? <button className="button button-primary clarification-submit" onClick={submitClarifications} disabled={!allAnswered || loading}>{loading ? <Loader2 className="spin" size={15} /> : <Sparkles size={15} />} Build the executable plan</button> : null}
          {loading && <div className="compiling"><span><i /><i /><i /></span><p>Validating intent, security, and cost…</p></div>}
          {!instruction && messages.length === 1 && <div className="starter-prompts"><span>TRY AN EXAMPLE</span>{starterPrompts.map((prompt) => <button key={prompt} onClick={() => { setInstruction(prompt); void compile(prompt); }}><span>{prompt}</span><ChevronRight size={14} /></button>)}</div>}
        </div>
        <div className="composer-input">
          <textarea value={compilation ? command : instruction} onChange={(event) => compilation ? setCommand(event.target.value) : setInstruction(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (compilation) void sendCommand();
              else void compile();
            }
          }} placeholder={compilation ? "Add an approval, change a tool, make it cheaper…" : "Describe what you want your business to do…"} />
          <div><small><Sparkles size={12} /> Try: “Retry failures three times”</small><button aria-label="Send message" disabled={loading || (compilation ? !command.trim() : instruction.trim().length < 10)} onClick={() => compilation ? void sendCommand() : void compile()}><Send size={15} /></button></div>
        </div>
      </section>

      <section className="plan-panel">
        <div className="plan-tabs" role="tablist">
          {tabs.map(([id, label, Icon]) => <button role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} key={id}><Icon size={14} />{label}</button>)}
        </div>
        <div className="plan-content">
          {!compilation && <div className="plan-empty"><span><Sparkles size={24} /></span><h2>Your plan will appear here</h2><p>OutcomeOS will translate the business objective into a human-readable plan, connection requirements, and a validated technical workflow.</p><div><i /><i /><i /></div></div>}
          {compilation && activeTab === "plan" && <GeneratedPlan compilation={compilation} />}
          {workflow && activeTab === "technical" && <TechnicalWorkflowView workflow={workflow} />}
          {!workflow && activeTab === "technical" && <PanelNotice icon={<GitBranch size={20} />} title="Technical flow pending" copy="Answer required clarification questions before OutcomeOS creates an executable graph." />}
          {activeTab === "test" && <div className="test-data-panel"><div><h3>Sample trigger data</h3><p>This data is isolated from production and marked as a simulated test.</p></div><textarea value={testData} onChange={(event) => setTestData(event.target.value)} spellCheck={false} /><button className="button button-secondary" disabled={!workflow}><FlaskConical size={15} /> Validate sample data</button></div>}
          {activeTab === "settings" && <div className="settings-preview"><h3>Execution settings</h3><div><span>Concurrency</span><b>{workflow?.settings.concurrency ?? 5} executions</b></div><div><span>Default timeout</span><b>{(workflow?.settings.defaultTimeoutMs ?? 30000) / 1000}s</b></div><div><span>Timezone</span><b>{workflow?.settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}</b></div><div><span>Retention</span><b>{workflow?.settings.retentionDays ?? 30} days</b></div></div>}
          {activeTab === "versions" && <div className="version-preview"><div><span>v1</span><p><b>Current draft</b><small>Created by the Outcome compiler</small></p><i>Draft</i></div><p>After activation, this version becomes immutable. Future edits create a new draft version.</p></div>}
        </div>
        {compilation && <div className="plan-footer"><span><Clock3 size={14} /> ≈ {compilation.estimatedExecutionsPerMonth ?? "—"} runs / month</span><button className="button button-primary" disabled={!workflow || saving} onClick={saveOutcome}>{saving ? "Saving…" : "Save and review"} <ArrowRight size={14} /></button></div>}
      </section>
    </div>
  </div>;
}

function GeneratedPlan({ compilation }: { compilation: CompilationResult }) {
  return <div className="generated-plan">
    <div className="generated-heading"><div><span>OUTCOME</span><h2>{compilation.outcomeSummary}</h2></div><span className={compilation.workflow ? "validated" : "waiting"}>{compilation.workflow ? <><Check size={12} /> Validated</> : <><Clock3 size={12} /> Needs input</>}</span></div>
    <ol>{compilation.humanReadablePlan.map((step, index) => <li key={step.id}><span>{index + 1}</span><div><b>{step.title}</b><p>{step.description}</p>{step.connectorKey && <small><Plug size={11} /> {step.connectorKey.replace("_", " ")}</small>}</div>{index < compilation.humanReadablePlan.length - 1 && <i />}</li>)}</ol>
    {compilation.requiredConnections.length > 0 && <div className="missing-connections"><div><Plug size={16} /><span><b>{compilation.requiredConnections.length} connection{compilation.requiredConnections.length > 1 ? "s" : ""} required</b><small>Connect securely during review. Secrets never enter this plan.</small></span></div><div>{compilation.requiredConnections.map((connection) => <span key={connection.connectorKey}>{connection.label}</span>)}</div></div>}
    {compilation.assumptions.length > 0 && <div className="assumption-list"><span>ASSUMPTIONS</span>{compilation.assumptions.map((assumption) => <p key={assumption}><Check size={12} />{assumption}</p>)}</div>}
    {compilation.warnings.map((warning) => <div className="warning-row" key={warning}><CircleAlert size={14} />{warning}</div>)}
  </div>;
}

function PanelNotice({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="plan-empty"><span>{icon}</span><h2>{title}</h2><p>{copy}</p></div>;
}
