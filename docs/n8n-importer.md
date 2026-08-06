# n8n importer limitations

The importer is intentionally conservative.

Supported mappings include Webhook, Schedule Trigger, HTTP Request, Set/Edit Fields, Slack, Gmail, HubSpot, Notion, and Wait. IF/Switch, Google Sheets, PostgreSQL, OpenAI, Stripe, and Merge are partial because expression, API-version, query, prompt, or merge semantics require review.

Code and Function nodes are unsupported. They become visible manual-review placeholders containing the original node name, type, and parameters; code is never executed.

The original JSON and compatibility report are preserved. Credentials are mapped by connector type but never imported from the JSON. Unsupported nodes prevent an equivalent claim but do not hide the rest of the converted plan.

Always run the converted draft with sample data before connecting production credentials or activating it.
