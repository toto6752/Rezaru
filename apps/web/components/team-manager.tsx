"use client";

import { Check, Copy, Loader2, MailPlus, Shield, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { LocalDate, RoleLabel, useT } from "@/components/i18n";
import { BackLink } from "@/components/back-link";
import type { UiCopyKey } from "@/components/ui-copy";

type Member = { id: string; role: string; user: { id: string; name: string | null; email: string; image: string | null } };
type Invitation = { id: string; email: string; role: string; expiresAt: string | Date };

const roleGuide: ReadonlyArray<readonly [UiCopyKey, UiCopyKey]> = [
  ["team.roleOwner", "team.roleOwnerCopy"],
  ["team.roleAdmin", "team.roleAdminCopy"],
  ["team.roleBuilder", "team.roleBuilderCopy"],
  ["team.roleOperator", "team.roleOperatorCopy"],
  ["team.roleViewer", "team.roleViewerCopy"]
];

export function TeamManager({ initialMembers, initialInvitations }: { initialMembers: Member[]; initialInvitations: Invitation[] }) {
  const t = useT();
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
    if (!response.ok || !body.data) { setMessage(body.error?.message ?? t("team.inviteFailed")); return; }
    setInvitations((current) => [...current, body.data!]);
    setInviteUrl(body.data.developmentInviteUrl ?? "");
    setEmail("");
    setMessage(t("team.inviteCreated"));
  }

  async function updateRole(memberId: string, nextRole: string) {
    setLoading(memberId);
    const response = await fetch(`/api/team/members/${memberId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: nextRole }) });
    setLoading("");
    if (response.ok) setMembers((current) => current.map((member) => member.id === memberId ? { ...member, role: nextRole } : member));
  }

  // The <option> value is the database enum; only the visible text is translated.
  const roleOptions = ["ADMIN", "BUILDER", "OPERATOR", "VIEWER"];

  return <div className="team-page">
    <BackLink href="/app/settings" labelKey="set.back" />
    <header className="page-header"><div><span className="page-eyebrow">{t("team.eyebrow")}</span><h1>{t("team.title")}</h1><p>{t("team.lead")}</p></div></header>
    <div className="team-grid">
      <section className="dashboard-panel team-list"><div className="panel-heading"><div><h2>{t("team.members")}</h2><p>{members.length} {t("team.membersCount")}</p></div></div>
        <div className="team-table"><div className="table-head"><span>{t("team.colMember")}</span><span>{t("team.colRole")}</span><span>{t("team.colAccess")}</span></div>{members.map((member) => <div key={member.id}><span className="member-avatar">{member.user.name?.slice(0, 2).toUpperCase() ?? member.user.email.slice(0, 2).toUpperCase()}</span><div><b>{member.user.name ?? t("team.unnamed")}</b><small>{member.user.email}</small></div>{member.role === "OWNER" ? <span className="owner-role"><Shield size={13} /> {t("team.owner")}</span> : <select value={member.role} onChange={(event) => updateRole(member.id, event.target.value)} disabled={loading === member.id}>{roleOptions.map((item) => <option value={item} key={item}>{t(`role.${item}` as UiCopyKey)}</option>)}</select>}<small>{member.role === "VIEWER" ? t("team.accessRead") : member.role === "OPERATOR" ? t("team.accessRun") : t("team.accessBuild")}</small></div>)}</div>
      </section>
      <aside className="dashboard-panel invite-panel"><MailPlus size={20} /><h2>{t("team.invite")}</h2><p>{t("team.inviteSub")}</p><form onSubmit={invite}><label>{t("team.inviteEmail")}<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("team.inviteEmailPlaceholder")} /></label><label>{t("team.inviteRole")}<select value={role} onChange={(event) => setRole(event.target.value)}>{roleOptions.map((item) => <option value={item} key={item}>{t(`role.${item}` as UiCopyKey)}</option>)}</select></label><button className="button button-primary" disabled={loading === "invite"}>{loading === "invite" ? <Loader2 className="spin" size={14} /> : <Users size={14} />} {t("team.inviteCreate")}</button></form>{message && <div className="form-message success">{message}</div>}{inviteUrl && <button className="copy-invite" onClick={() => void navigator.clipboard.writeText(inviteUrl)}><Copy size={13} /> {t("team.copyInvite")}</button>}</aside>
    </div>
    {invitations.length > 0 && <section className="dashboard-panel pending-invites"><div className="panel-heading"><div><h2>{t("team.pending")}</h2></div></div>{invitations.map((invitation) => <div key={invitation.id}><UserRound size={16} /><span><b>{invitation.email}</b><small>{t("team.expires")} <LocalDate value={invitation.expiresAt} /></small></span><i><RoleLabel role={invitation.role} /></i></div>)}</section>}
    <section className="role-guide"><h2>{t("team.roleGuide")}</h2>{roleGuide.map(([nameKey, copyKey]) => <div key={nameKey}><Check size={13} /><b>{t(nameKey)}</b><span>{t(copyKey)}</span></div>)}</section>
  </div>;
}
