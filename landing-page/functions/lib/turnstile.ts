import type { Env } from '../types';

export const verifyTurnstile = async (env: Env, token: string | undefined, ip: string): Promise<boolean> => {
  if (!env.TURNSTILE_SECRET) return true; // disabled in dev
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return Boolean(data.success);
};
