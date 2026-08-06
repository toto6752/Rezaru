"use client";

import { authClient } from "@/lib/auth-client";
import { ArrowRight, Github, Loader2, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";

type AuthMode = "login" | "register" | "forgot";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "register") {
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) throw new Error(result.error.message);
        const bootstrap = await fetch("/api/workspaces/bootstrap", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: workspace || `${name}'s workspace` })
        });
        if (!bootstrap.ok) {
          const body = await bootstrap.json() as { error?: { message?: string } };
          throw new Error(body.error?.message ?? "Could not create the workspace");
        }
        router.push("/app/onboarding");
        router.refresh();
      } else if (mode === "login") {
        const result = await authClient.signIn.email({ email, password, callbackURL: "/app" });
        if (result.error) throw new Error(result.error.message);
        router.push("/app");
        router.refresh();
      } else {
        const result = await authClient.requestPasswordReset({ email, redirectTo: "/login" });
        if (result.error) throw new Error(result.error.message);
        setMessage({ tone: "success", text: "If an account exists, a reset link is on its way." });
      }
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  async function magicLink() {
    if (!email) {
      setMessage({ tone: "error", text: "Enter your email address first." });
      return;
    }
    setLoading(true);
    const result = await authClient.signIn.magicLink({ email, callbackURL: "/app" });
    setLoading(false);
    setMessage(result.error
      ? { tone: "error", text: result.error.message ?? "Could not send the sign-in link" }
      : { tone: "success", text: "Your secure sign-in link has been sent." });
  }

  const title = mode === "register" ? "Create your workspace" : mode === "login" ? "Welcome back" : "Reset your password";
  const subtitle = mode === "register" ? "Start with 500 monthly executions. No card required." : mode === "login" ? "Continue operating your outcomes." : "We’ll send a secure reset link if your account exists.";

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Logo />
        <div className="auth-heading"><div><Sparkles size={16} /></div><h1>{title}</h1><p>{subtitle}</p></div>
        <form onSubmit={submit}>
          {mode === "register" && <>
            <label>Full name<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" /></label>
            <label>Workspace name<input required value={workspace} onChange={(event) => setWorkspace(event.target.value)} placeholder="Acme Operations" /></label>
          </>}
          <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
          {mode !== "forgot" && <label>Password
            <input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
            {mode === "login" && <Link href="/forgot-password">Forgot password?</Link>}
          </label>}
          {message && <div className={`form-message ${message.tone}`}>{message.text}</div>}
          <button className="button button-primary auth-submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} /> : mode === "register" ? "Create workspace" : mode === "login" ? "Sign in" : "Send reset link"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>
        {mode !== "forgot" && <>
          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-alternatives">
            <button onClick={magicLink} disabled={loading}><Mail size={16} /> Email link</button>
            {process.env.NEXT_PUBLIC_GITHUB_OAUTH === "true" && <button onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/app" })}><Github size={16} /> GitHub</button>}
          </div>
        </>}
        <p className="auth-switch">
          {mode === "register" ? <>Already have an account? <Link href="/login">Sign in</Link></> :
           mode === "login" ? <>New to OutcomeOS? <Link href="/register">Start free</Link></> :
           <Link href="/login">Return to sign in</Link>}
        </p>
      </section>
      <aside className="auth-aside">
        <div className="auth-quote">
          <span>OUTCOMEOS</span>
          <blockquote>“The workflow is implementation detail. The outcome is the product.”</blockquote>
          <div className="auth-mini-plan">
            {["Describe what should happen", "Review the generated plan", "Activate with confidence"].map((item, index) => <div key={item}><i>{index + 1}</i><span>{item}</span></div>)}
          </div>
        </div>
      </aside>
    </main>
  );
}
