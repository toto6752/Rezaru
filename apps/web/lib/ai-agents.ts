import { prisma } from "@rezaru/database";

// The AI-agent builder (services/agent-builder, formerly the separate
// rezaru-Jaha service) keeps its own SQLAlchemy tables in this same
// Postgres database (snake_case, no Prisma models). It mirrors each Better
// Auth user into its own `users` row matched by email - see
// services/agent-builder/auth.py: _get_or_create_local_user. We join
// through that same email to list a workspace owner's agents here.
export type AiAgentSummary = {
  id: number;
  name: string;
  businessType: string;
};

export async function getAiAgents(email: string): Promise<AiAgentSummary[]> {
  const normalized = email.trim().toLowerCase();
  try {
    const rows = await prisma.$queryRaw<Array<{ id: number; name: string; business_type: string }>>`
      SELECT a.id, a.name, a.business_type
      FROM users u
      JOIN agents a ON a.user_id = u.id
      WHERE u.email = ${normalized}
      ORDER BY a.created_at DESC
    `;
    return rows.map((row) => ({ id: row.id, name: row.name, businessType: row.business_type }));
  } catch {
    // The agent-builder process creates its tables on its own startup
    // (Base.metadata.create_all()); on a brand-new deploy the dashboard can
    // theoretically render before that has happened. Fail soft rather than
    // breaking the whole dashboard over it.
    return [];
  }
}
