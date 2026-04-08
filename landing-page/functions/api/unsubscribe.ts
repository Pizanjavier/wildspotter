import type { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  const site = env.SITE_URL ?? url.origin;

  if (!token) return Response.redirect(`${site}/unsubscribed?err=missing`, 302);

  const row = await env.DB.prepare(
    'SELECT id, locale FROM waitlist WHERE confirm_token = ?',
  )
    .bind(token)
    .first<{ id: string; locale: 'es' | 'en' }>();

  if (!row) return Response.redirect(`${site}/unsubscribed?err=notfound`, 302);

  await env.DB.prepare(
    `UPDATE waitlist
       SET status = 'unsubscribed',
           unsubscribed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  )
    .bind(row.id)
    .run();

  const path = row.locale === 'en' ? '/en/unsubscribed' : '/unsubscribed';
  return Response.redirect(`${site}${path}`, 302);
};
