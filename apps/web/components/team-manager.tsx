"use client";

import { Check, Copy, Loader2, MailPlus, Shield, UserRound, Users } from "lucide-react";
import { useState } from "react";

type Member = { id: string; role: string; user: { id: string; name: string | null; email: string; image: string | null } };
type Invitation = { id: string; email: string; role: string; expiresAt: string | Date };

export function TeamManager({ initialMembers, initialInvitations }: { initialMembers: Member[]; initialInvitations: Invitation[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("BUILDER");
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setLoading("invite");
    setMessage("");
    const response = await fetch("/api/team/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) });
    const body = await response.json() as { data?: Invitation & { developmentInviteUrl?: string }; error?: { message?: string } };
    setLoading("");
    if (!response.ok || !body.data) { setMessage(body.error?.message ?? "Could not send invitation"); return; }
    setInvitations((current) => [...current, body.data!]);
    setInviteUrl(body.data.developmentInviteUrl ?? "");
    setEmail("");
    setMessage("Invitation created. Email delivery uses the configured SMTP adapter.");
  }

  async function updateRole(memberId: string, nextRole: string) {
    setLoading(memberId);
    const response = await fetch(`/api/team/members/${memberId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: nextRole }) });
    setLoading("");
    if (response.ok) setMembers((current) => current.map((member) => member.id === memberId ? { ...member, role: nextRole } : member));
  }

  return <div className="team-page">
    <header className="page-header"><div><span className="page-eyebrow">PEOPLE & PERMISSIONS</span><h1>Team</h1><p>Give builders, operators, approvers, and viewers exactly the access they need.</p></div></header>
    <div className="team-grid">
      <section className="dashboard-panel team-list"><div className="panel-heading"><div><h2>Workspace members</h2><p>{members.length} people have access.</p></div></div>
        <div className="team-table"><div className="table-head"><span>Member</span><span>Role</span><span>Access</span></div>{members.map((member) => <div key={member.id}><span className="member-avatar">{member.user.name?.slice(0, 2).toUpperCase() ?? member.user.email.slice(0, 2).toUpperCase()}</span><div><b>{member.user.name ?? "Unnamed member"}</b><small>{member.user.email}</small></div>{member.role === "OWNER" ? <span className="owner-role"><Shield size={13} /> Owner</span> : <select value={member.role} onChange={(event) => updateRole(member.id, event.target.value)} disabled={loading === member.id}>{["ADMIN", "BUILDER", "OPERATOR", "VIEWER"].map((item) => <option key={item}>{item}</option>)}</select>}<small>{member.role === "VIEWER" ? "Read-only" : member.role === "OPERATOR" ? "Run & approve" : "Build & manage"}</small></div>)}</div>
      </section>
      <aside className="dashboard-panel invite-panel"><MailPlus size={20} /><h2>Invite a teammate</h2><p>Invitation links expire after seven days.</p><form onSubmit={invite}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" /></label><label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option>ADMIN</option><option>BUILDER</option><option>OPERATOR</option><option>VIEWER</option></select></label><button className="button button-primary" disabled={loading === "invite"}>{loading === "invite" ? <Loader2 className="spin" size={14} /> : <Users size={14} />} Create invitation</button></form>{message && <div className="form-message success">{message}</div>}{inviteUrl && <button className="copy-invite" onClick={() => void navigator.clipboard.writeText(inviteUrl)}><Copy size={13} /> Copy development invite link</button>}</aside>
    </div>
    {invitations.length > 0 && <section className="dashboard-panel pending-invites"><div className="panel-heading"><div><h2>Pending invitations</h2></div></div>{invitations.map((invitation) => <div key={invitation.id}><UserRound size={16} /><span><b>{invitation.email}</b><small>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</small></span><i>{invitation.role.toLowerCase()}</i></div>)}</section>}
    <section className="role-guide"><h2>Role guide</h2>{[
      ["Owner", "Everything, including ownership and billing"],
      ["Admin", "Team, billing, connections, and outcomes"],
      ["Builder", "Create, edit, test, and connect outcomes"],
      ["Operator", "Run, pause, retry, and approve executions"],
      ["Viewer", "Read outcomes and execution history"]
    ].map(([name, copy]) => <div key={name}><Check size={13} /><b>{name}</b><span>{copy}</span></div>)}</section>
  </div>;
}
