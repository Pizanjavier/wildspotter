# WildSpotter — Launch Strategy Analysis

> Should you launch before or after implementing monetization?
>
> **Update (2026-04-07):** Plan revised to include a waitlist landing page (Phase 2.5 of `launch-plan.md`) as the connective tissue between the TikTok/Reels campaign and the app launch. All video CTAs point to the waitlist, not the App Store, to absorb review delays and build a mailing list for the monetization launch. Pricing raised to €4.99/mo / €34.99/yr with a capped Pioneer tier at €24.99/yr (first 500 waitlist signups, locked forever). Lifetime tier removed. See `docs/landing-spec.md`.

## TL;DR: Launch FREE first. Don't implement monetization yet.

**My recommendation is clear: launch without monetization.** Here's the full reasoning based on your docs and project status.

---

## 1. Your Cost Structure

| Item | Cost |
|------|------|
| Initial launch investment | ~€100 (one-time setup) |
| Monthly server (Hetzner CX41) | ~€25/mo |
| Break-even | **7 paying users** |

Your costs are remarkably low. At €25/month running cost, you can sustain WildSpotter for **4 months on your initial €100 budget alone** if we're talking just server costs. This is a massive advantage — you have room to breathe.

---

## 2. Why Launch Free First — The Arguments

### ✅ A) You Need to Validate Product-Market Fit

This is the single most important reason. You have a well-designed product with a clear value prop ("discover spots no one has shared"). But you don't know yet:

- **Do vanlifers actually use it regularly?** Or do they try it once and go back to Park4night?
- **Is the pipeline accurate enough?** Does the AI scoring + legal data hold up in real-world use?
- **Which features do users actually care about?** Your monetization plan gates offline cache, full score breakdown, and satellite previews — but maybe users only care about one of these.

Launching free lets you answer these questions with **zero revenue risk**.

### ✅ B) The Vanlife Community is Skeptical of Commercial Apps

Your own monetization doc says it:

> *"The vanlife community is skeptical of commercial spot apps — transparency in the client code signals we're not harvesting location data."*

If you launch with a paywall on day 1, many potential users will never try it. You'll never know if the product works because the audience self-selects away. **A free launch builds trust and word-of-mouth** in a community that lives on van forums, Reddit, and Instagram recommendations.

### ✅ C) Your Monetization Design Already Supports This

Your feature gating architecture is **API-side**:

> *"All gating is API-side. No client-side DRM needed."*

This means you can launch with the full Explorer experience for everyone, then later add gating server-side without any app update needed. The tech architecture already supports "launch free now, gate later":

1. Launch → everyone gets full features
2. Collect usage data → learn what features users love
3. Implement API-side gating → gate the features users proved they value
4. Push no client update — the API just starts returning limited data for free users

### ✅ D) You'll Get Better Pricing Data

Right now your tiers are educated guesses:
- Scout (Free): 3 spot views/day
- Explorer: €3.99/mo
- Lifetime: €49.99

After a free launch with usage analytics, you'll know:
- How many spots per day users actually view (maybe 3 is too generous or too restrictive)
- What conversion event would trigger upgrades
- Whether offline cache is the killer feature you think it is

### ✅ E) Your Revenue Projections Are Low-Risk Anyway

Your conservative projections:
- 6 months: €155/mo revenue
- 1 year: €400/mo

This means **monetization won't meaningfully cover costs for months regardless**. Whether you launch free or paid, you're self-funding through the initial period anyway. So the question becomes: would you rather self-fund with 500 free users generating feedback, or self-fund with 50 users behind a paywall generating silence?

---

## 3. What About "Users Won't Pay Later If It Was Free"?

This is the common counter-argument, and it's wrong for your case:

1. **You're not removing features** — you're adding a free tier below the current experience. Users who got everything free will be shown the value clearly: "you've been using Explorer features, keep them for €3.99/mo."
2. **You have the Lifetime tier** — vanlifers who've been using it free and love it will happily pay €49.99 once. That's the price of a good headlamp.
3. **RevenueCat/App Store give you the infrastructure** to offer free trials, introductory pricing, and grandfather existing users.

---

## 4. What You SHOULD Do Before Launch

Instead of building monetization, focus on:

| Priority | What | Why |
|----------|------|-----|
| 🔴 Critical | **Analytics/telemetry** | You NEED usage data — how many spots viewed, areas scanned, session duration, feature usage. Without this, you're flying blind. |
| 🔴 Critical | **Pipeline stability** | Make sure the Radar→Topographer→Legal→Satellite→Context pipeline is reliable on real data at scale. |
| 🟡 Important | **Crash reporting** (Sentry/Bugsnag) | You need to know immediately if the app crashes in production. |
| 🟡 Important | **Small upgrade banner** | Your monetization doc mentions "small non-intrusive upgrade banner" for free users. You could add a subtle "WildSpotter is free during Early Access" banner — plants the seed that premium is coming. |
| 🟢 Nice | **Feedback mechanism** | A simple in-app "Send Feedback" button (even just a mailto: link) so users can report bad spots, inaccurate legal data, etc. |

---

## 5. Suggested Launch Timeline

```
NOW ───────────────────────────────────────────────────────────
│
├── Week 0-1:  Launch free ("Early Access" label)
│              Add basic analytics (PostHog free tier / Plausible)
│              Add crash reporting
│
├── Week 2-8:  Collect usage data
│              Fix bugs from real usage
│              Validate pipeline accuracy with real user reports
│              Grow organic user base (vanlife forums, Reddit, IG)
│
├── Week 8-12: Analyze usage patterns
│              Decide final tier gating based on REAL data
│              Implement RevenueCat + API-side gating
│              Announce: "Premium is coming, early users get X% off"
│
└── Week 12+:  Activate monetization (3 tiers)
               Grandfather early users with discount
```

---

## 6. Risk Assessment

| Risk | Launching Free First | Launching with Monetization |
|------|---------------------|---------------------------|
| No users at all | Low — free removes the biggest barrier | High — paywall filters out curious users |
| Bad product feedback | You'll find out quickly and cheaply | You'll never know (nobody tried it) |
| Can't monetize later | Low — API-side gating is trivial to add | N/A |
| Wasting €100 | You learn from real user data | You learn from nobody using it |
| Running out of money | €25/mo is sustainable for months | Same cost, but with fewer data points |

---

## Bottom Line

You've built a genuinely unique product. Your cost structure is incredibly lean. **Your biggest risk isn't revenue — it's launching to silence because you gated features nobody tried.** 

Launch free, label it "Early Access", collect data for 2-3 months, then monetize with confidence based on real usage patterns. The €100 investment is worth it either way, but you'll get 10x more value from it if hundreds of people actually use the app.
