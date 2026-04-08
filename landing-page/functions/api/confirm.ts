import type { Env } from '../types';
import { sendWelcomeEmail } from '../lib/email';

const PIONEER_CAP = 500;

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  if (!token) return new Response('Missing token', { status: 400 });

  const row = await env.DB.prepare(
    'SELECT id, email, locale, status, confirm_token FROM waitlist WHERE confirm_token = ?',
  )
    .bind(token)
    .first<{ id: string; email: string; locale: 'es' | 'en'; status: string; confirm_token: string }>();

  if (!row) return new Response('Invalid token', { status: 404 });

  const site = env.SITE_URL ?? url.origin;
  const graciasPath = row.locale === 'en' ? '/en/gracias' : '/gracias';

  if (row.status === 'confirmed') {
    return Response.redirect(`${site}${graciasPath}`, 302);
  }

  // Assign position = max(position) + 1 among non-pending rows
  const maxRow = await env.DB.prepare(
    `SELECT COALESCE(MAX(position), 0) AS max FROM waitlist WHERE status != 'pending'`,
  ).first<{ max: number }>();
  const position = (maxRow?.max ?? 0) + 1;
  const isPioneer = position <= PIONEER_CAP ? 1 : 0;

  await env.DB.prepare(
    `UPDATE waitlist
       SET status = 'confirmed',
           position = ?,
           is_pioneer = ?,
           confirmed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(position, isPioneer, row.id)
    .run();

  ctx.waitUntil(sendWelcomeEmail(env, row.email, row.locale, position, row.confirm_token));

  return Response.redirect(`${site}${graciasPath}?pos=${position}`, 302);
};
