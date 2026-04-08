import type { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let count = 0;
  try {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM waitlist WHERE is_pioneer = 1 AND status = 'confirmed'`,
    ).first<{ c: number }>();
    count = row?.c ?? 0;
  } catch {
    count = 0;
  }
  return new Response(JSON.stringify({ count, cap: 500 }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
    },
  });
};
