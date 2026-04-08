import type { Env, SubscribeBody } from '../types';
import { sendConfirmationEmail } from '../lib/email';
import { verifyTurnstile } from '../lib/turnstile';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid_email' }, 400);

  const locale = body.locale === 'en' ? 'en' : 'es';
  const ip = request.headers.get('CF-Connecting-IP') ?? '';

  const turnstileOk = await verifyTurnstile(env, body.turnstile_token, ip);
  if (!turnstileOk) return json({ ok: false, error: 'turnstile' }, 400);

  // Best-effort rate limit: cap new pending rows from the same country in the last 60s.
  // Hard edge rate limiting is configured in the Cloudflare dashboard (3 req/min/IP).
  try {
    const country = request.headers.get('CF-IPCountry') ?? '';
    if (country) {
      const recent = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM waitlist
          WHERE ip_country = ? AND created_at > datetime('now', '-60 seconds')`,
      )
        .bind(country)
        .first<{ c: number }>();
      if ((recent?.c ?? 0) > 30) return json({ ok: false, error: 'rate_limited' }, 429);
    }
  } catch {
    // ignore rate limit failures
  }

  // Dedup
  const existing = await env.DB.prepare('SELECT id, status FROM waitlist WHERE email = ?')
    .bind(email)
    .first<{ id: string; status: string }>();
  if (existing) return json({ ok: false, error: 'duplicate' }, 409);

  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const country = request.headers.get('CF-IPCountry') ?? '';
  const ua = request.headers.get('User-Agent') ?? '';

  await env.DB.prepare(
    `INSERT INTO waitlist (id, email, locale, status, position, is_pioneer,
       referrer, utm_source, utm_medium, utm_campaign, user_agent, ip_country, confirm_token)
     VALUES (?, ?, ?, 'pending', 0, 0, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      email,
      locale,
      body.referrer ?? '',
      body.utm_source ?? '',
      body.utm_medium ?? '',
      body.utm_campaign ?? '',
      ua,
      country,
      token,
    )
    .run();

  ctx.waitUntil(sendConfirmationEmail(env, email, locale, token));

  return json({ ok: true });
};
