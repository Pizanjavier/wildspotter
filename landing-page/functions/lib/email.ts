import type { Env } from '../types';

type Locale = 'es' | 'en';

const subjects: Record<Locale, { confirm: string; welcome: (pos: number) => string }> = {
  es: {
    confirm: 'Confirma tu lugar en WildSpotter',
    welcome: (pos) => `Eres Pioneer #${pos}. Bienvenido al radar.`,
  },
  en: {
    confirm: 'Confirm your WildSpotter Early Access spot',
    welcome: (pos) => `You are Pioneer #${pos}. Welcome to the radar.`,
  },
};

const wrap = (locale: Locale, inner: string, unsubUrl: string): string => {
  const foot =
    locale === 'es'
      ? `<p style="margin-top:32px;padding-top:20px;border-top:1px solid #2a2a2a;color:#888;font-size:12px;font-family:Arial,sans-serif">
Recibes este correo porque te apuntaste a la lista de WildSpotter.
<br/><a href="${unsubUrl}" style="color:#888">Darse de baja</a> — WildSpotter · Hecho en España.
<br/>Responsable: hola@wildspotter.app</p>`
      : `<p style="margin-top:32px;padding-top:20px;border-top:1px solid #2a2a2a;color:#888;font-size:12px;font-family:Arial,sans-serif">
You are receiving this because you joined the WildSpotter waitlist.
<br/><a href="${unsubUrl}" style="color:#888">Unsubscribe</a> — WildSpotter · Made in Spain.
<br/>Contact: hola@wildspotter.app</p>`;
  return `<div style="background:#0F0D0B;padding:32px;font-family:Arial,sans-serif;color:#F5EBD8;max-width:560px;margin:0 auto">${inner}${foot}</div>`;
};

const confirmBody = (locale: Locale, url: string, unsubUrl: string): string => {
  const inner =
    locale === 'es'
      ? `<h1 style="font-size:24px;margin:0 0 16px;color:#F5EBD8">Confirma tu email</h1>
<p style="line-height:1.55;color:#E8D9BF">Gracias por unirte a WildSpotter. Haz clic para confirmar tu email y reservar tu plaza Pioneer.</p>
<p><a href="${url}" style="background:#D97706;color:#fff;padding:14px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;margin:16px 0">Confirmar email</a></p>
<p style="color:#B7A089;font-size:13px">Si no fuiste tú, ignora este correo y no pasará nada.</p>`
      : `<h1 style="font-size:24px;margin:0 0 16px;color:#F5EBD8">Confirm your email</h1>
<p style="line-height:1.55;color:#E8D9BF">Thanks for joining WildSpotter. Click to confirm your email and reserve your Pioneer seat.</p>
<p><a href="${url}" style="background:#D97706;color:#fff;padding:14px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;margin:16px 0">Confirm email</a></p>
<p style="color:#B7A089;font-size:13px">If this was not you, just ignore this email.</p>`;
  return wrap(locale, inner, unsubUrl);
};

const welcomeBody = (locale: Locale, position: number, isPioneer: boolean, unsubUrl: string): string => {
  const inner =
    locale === 'es'
      ? `<h1 style="font-size:26px;margin:0 0 16px;color:#F5EBD8">${isPioneer ? `Eres Pioneer #${position} de 500.` : `Estás dentro (#${position}).`}</h1>
<p style="line-height:1.6;color:#E8D9BF"><strong>La app será gratis para todo el mundo</strong> — mapa, puntuaciones y toda la información legal.</p>
${isPioneer ? `<p style="line-height:1.6;color:#E8D9BF">Además, has bloqueado el precio <strong>Pioneer</strong> del plan premium: <strong>24,99 €/año para siempre</strong>. Nunca te subirá. El plan premium añade uso offline y vista satélite por spot.</p>` : `<p style="line-height:1.6;color:#E8D9BF">Si quieres el plan premium (offline + vista satélite), saldrá a 34,99 €/año en el lanzamiento.</p>`}
<p style="line-height:1.6;color:#B7A089;font-size:14px">Te escribiremos el día del lanzamiento con acceso prioritario y las instrucciones para activar tu precio.</p>`
      : `<h1 style="font-size:26px;margin:0 0 16px;color:#F5EBD8">${isPioneer ? `You are Pioneer #${position} of 500.` : `You are in (#${position}).`}</h1>
<p style="line-height:1.6;color:#E8D9BF"><strong>The app will be free for everyone</strong> — map, scores and the full legal layer.</p>
${isPioneer ? `<p style="line-height:1.6;color:#E8D9BF">On top of that, you have locked the <strong>Pioneer</strong> premium price: <strong>€24.99/yr, forever</strong>. It never goes up for you. The premium plan adds offline use and a satellite preview per spot.</p>` : `<p style="line-height:1.6;color:#E8D9BF">If you want the premium plan (offline + satellite preview), it will be €34.99/yr at launch.</p>`}
<p style="line-height:1.6;color:#B7A089;font-size:14px">We will email you on launch day with priority access and how to activate your price.</p>`;
  return wrap(locale, inner, unsubUrl);
};

const send = async (env: Env, to: string, subject: string, html: string): Promise<void> => {
  if (!env.RESEND_API_KEY) {
    console.log('[email:stub]', subject, '→', to);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM ?? 'WildSpotter <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });
};

export const sendConfirmationEmail = async (
  env: Env,
  to: string,
  locale: Locale,
  token: string,
): Promise<void> => {
  const site = env.SITE_URL ?? 'https://wildspotter.app';
  const url = `${site}/api/confirm?t=${encodeURIComponent(token)}`;
  const unsubUrl = `${site}/api/unsubscribe?t=${encodeURIComponent(token)}`;
  await send(env, to, subjects[locale].confirm, confirmBody(locale, url, unsubUrl));
};

export const sendWelcomeEmail = async (
  env: Env,
  to: string,
  locale: Locale,
  position: number,
  token: string,
): Promise<void> => {
  const site = env.SITE_URL ?? 'https://wildspotter.app';
  const unsubUrl = `${site}/api/unsubscribe?t=${encodeURIComponent(token)}`;
  const isPioneer = position <= 500;
  await send(env, to, subjects[locale].welcome(position), welcomeBody(locale, position, isPioneer, unsubUrl));
};
