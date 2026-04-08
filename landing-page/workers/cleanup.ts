/// <reference types="@cloudflare/workers-types" />
// WildSpotter waitlist — scheduled cleanup Worker.
// Deletes unconfirmed `pending` rows older than 30 days (GDPR retention).
// Runs on its own schedule — NOT a Pages Function.
// Deploy: `wrangler deploy -c workers/wrangler.cleanup.toml`

interface Env {
	DB: D1Database;
}

export default {
	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(
			env.DB.prepare(
				`DELETE FROM waitlist
				  WHERE status = 'pending'
				    AND created_at < datetime('now', '-30 days')`,
			)
				.run()
				.then((r) => console.log("[cleanup] deleted", r.meta?.changes ?? 0, "pending rows")),
		);
	},
};
