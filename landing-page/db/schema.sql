-- WildSpotter waitlist — Cloudflare D1 schema
-- Apply:  wrangler d1 execute wildspotter-waitlist --file=db/schema.sql

CREATE TABLE IF NOT EXISTS waitlist (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  locale        TEXT NOT NULL DEFAULT 'es',
  status        TEXT NOT NULL DEFAULT 'pending',
  position      INTEGER NOT NULL DEFAULT 0,
  is_pioneer    INTEGER NOT NULL DEFAULT 0,
  referrer      TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  user_agent    TEXT,
  ip_country    TEXT,
  confirm_token TEXT NOT NULL,
  confirmed_at  TIMESTAMP,
  notified_at   TIMESTAMP,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON waitlist(position);
CREATE INDEX IF NOT EXISTS idx_waitlist_is_pioneer ON waitlist(is_pioneer);
CREATE INDEX IF NOT EXISTS idx_waitlist_token ON waitlist(confirm_token);
