#!/usr/bin/env node

/**
 * Send the iOS launch email to all waitlist users (confirmed + pending).
 *
 * Usage:
 *   1. Export your waitlist from Cloudflare D1 as JSON:
 *      - Go to Cloudflare Dashboard → D1 → your DB → Console
 *      - Run: SELECT email, confirm_token FROM waitlist WHERE status IN ('confirmed', 'pending')
 *      - Save the result as scripts/waitlist.json (array of { email, confirm_token })
 *
 *   2. Run:
 *      RESEND_API_KEY=re_xxxxx IOS_STORE_URL=https://apps.apple.com/... node scripts/send-ios-launch.mjs
 *
 *      Optional: --dry-run to preview without sending.
 */

import { readFile } from "node:fs/promises";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const IOS_STORE_URL = process.env.IOS_STORE_URL || "https://apps.apple.com/es/app/wildspotter-spots-salvajes/id6763240427";
const DRY_RUN = process.argv.includes("--dry-run");
const FROM = "Javier de WildSpotter <hola@wildspotter.app>";
const SUBJECT = "WildSpotter ya está en iOS 🎉";
const DELAY_MS = 1000; // 1s between sends to avoid rate limits

if (!RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY env variable");
  process.exit(1);
}

// Load email template
const templatePath = new URL("../src/emails/ios-launch.html", import.meta.url);
const templateRaw = await readFile(templatePath, "utf-8");

// Load waitlist
const waitlistPath = new URL("./waitlist.json", import.meta.url);
let users;
try {
  const raw = await readFile(waitlistPath, "utf-8");
  users = JSON.parse(raw);
} catch {
  console.error("Missing scripts/waitlist.json — see instructions at the top of this file.");
  process.exit(1);
}

console.log(`\n📧 iOS Launch Email Sender`);
console.log(`   Recipients: ${users.length}`);
console.log(`   From: ${FROM}`);
console.log(`   Store URL: ${IOS_STORE_URL}`);
console.log(`   Mode: ${DRY_RUN ? "DRY RUN (no emails sent)" : "LIVE"}\n`);

let sent = 0;
let failed = 0;

for (const user of users) {
  const html = templateRaw
    .replace(/\{\{IOS_STORE_URL\}\}/g, IOS_STORE_URL)
    .replace(/\{\{confirm_token\}\}/g, user.confirm_token || "unknown");

  if (DRY_RUN) {
    console.log(`  [dry-run] Would send to: ${user.email}`);
    sent++;
    continue;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [user.email],
        subject: SUBJECT,
        html,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  ✓ ${user.email} (id: ${data.id})`);
      sent++;
    } else {
      const err = await res.text();
      console.error(`  ✗ ${user.email}: ${res.status} ${err}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ ${user.email}: ${err.message}`);
    failed++;
  }

  // Delay between sends
  if (users.indexOf(user) < users.length - 1) {
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
}

console.log(`\n✅ Done. Sent: ${sent}, Failed: ${failed}\n`);
