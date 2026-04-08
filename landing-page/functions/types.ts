export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  SITE_URL?: string;
  APP_URL?: string;
  TURNSTILE_SECRET?: string;
}

export interface SubscribeBody {
  email: string;
  locale: 'es' | 'en';
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  turnstile_token?: string;
}
