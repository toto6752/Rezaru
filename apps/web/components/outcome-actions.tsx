"use client";

import { CirclePause, Copy, Loader2, Play, TestTube2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OutcomeActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  async function action(name: "activate" | "pause" | "duplicate" | "test") {
    setLoading(name);
    setMessage("");
    const response = await fetch(`/api/outcomes/${id}/${name}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: name === "test" ? JSON.stringify({ demo: true, sampleData: { email: "sam@northstar.example", firstName: "Sam", company: "Northstar Labs", amount: 6800 } }) : undefined
    });
    const body = await response.json() as { data?: { id?: string }; error?: { message?: string } };
    setLoading("");
    if (!response.ok) {
      setMessage(body.error?.message ?? "Action failed");
      return;
    }
    if (name === "duplicate" && body.data?.id) router.push(`/app/outcomes/${body.data.id}`);
    else if (name === "test" && body.data?.id) router.push(`/app/executions/${body.data.id}`);
    else router.refresh();
  }

  return <div className="outcome-actions">
    {message && <span className="action-message">{message}</span>}
    <button className="button button-secondary" onClick={() => action("duplicate")} disabled={Boolean(loading)}>{loading === "duplicate" ? <Loader2 className="spin" size={15} /> : <Copy size={15} />} Duplicate</button>
    <button className="button button-secondary" onClick={() => action("test")} disabled={Boolean(loading)}>{loading === "test" ? <Loader2 className="spin" size={15} /> : <TestTube2 size={15} />} Test</button>
    {status === "ACTIVE" ? <button className="button button-secondary" onClick={() => action("pause")} disabled={Boolean(loading)}>{loading === "pause" ? <Loader2 className="spin" size={15} /> : <CirclePause size={15} />} Pause</button> :
    <button className="button button-primary" onClick={() => action("activate")} disabled={Boolean(loading)}>{loading === "activate" ? <Loader2 className="spin" size={15} /> : <Play size={15} />} Activate</button>}
  </div>;
}
