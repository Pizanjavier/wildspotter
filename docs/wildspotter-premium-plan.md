# WildSpotter Premium: The "Explorer" Membership

This document outlines the functional goals for the WildSpotter Premium tier. The focus is on providing safety, professional-grade tools for off-grid exploration, and a trusted environment for shared discovery without compromising the app's "secret spot" philosophy.

---

## 1. Full Offline Map & Data Access
**Goal:** Enable total independence from cellular networks.
* **Offline Global Radar:** Users can download the entire database of identified spots (coordinates, safety scores, and legal status) to navigate and explore in areas with zero coverage.
* **Base Map Caching:** Integration of high-quality topographic and base map layers for use in remote mountain ranges or coastal cliffs where data signals are non-existent.
* **On-Device Legal Verification:** The ability to check the legality of any spot in the database without an active API connection.

## 2. Advanced "Explorer" Filters (V3 Intelligence)
**Goal:** Grant power users the ability to find spots based on professional geographic and topographic criteria.
* **Niche Archetype Filtering:** Access to filters based on advanced environmental data, such as:
    * **Altitude & Alpine Tiers:** Find spots specifically above 1,500m or within specific elevation ranges.
    * **Isolation Levels:** Filter for "dead-end" forest tracks or spots at a specific distance from the nearest building/road.
    * **Environmental Context:** Search for spots near specific water bodies, coastal proximity, or high "natural fraction" scores.
* **Proprietary Scoring Access:** Use the full weight of the V3 scoring engine to sort spots by "Wildness" or "Safety" rather than just distance.

## 3. Active Legal Guard & Notifications
**Goal:** Provide peace of mind by actively monitoring the legal landscape for the user.
* **Spot Watchdog:** Automatic notifications if the legal status of a "Saved Spot" changes due to new regional decrees, seasonal fire bans, or environmental protection updates.
* **Regional Enforcement Alerts:** Contextual warnings when entering regions with aggressive overnight parking enforcement or specific seasonal restrictions.
* **Preventative Legal Toolkit:** Digital access to the specific legal articles and decrees applicable to a spot, formatted to be shown to authorities to prove the distinction between "parking/overnighting" and "camping." **maybe offering this free**

## 4. Tap-to-Check: Legal Verification Anywhere

**Goal:** Let users verify the legal situation of any point on the map — not just existing spots — combining all available legal intelligence in a single gesture.

* **Long-Press Legal Check:** Long-press anywhere on the map (where no spot exists) to trigger a full legal analysis of that coordinate. The check runs entirely offline using local PostGIS data:
    * **MITECO spatial checks:** Natura 2000, National Parks, Natural Parks, Coastal Law (DPMT, Servidumbre, Terrenos Incluidos).
    * **Cadastre classification:** Land type (rustic, urban) via locally imported INSPIRE/ATOM cadastral parcels — replacing the unreliable Catastro REST API with a fully offline dataset.
    * **Legal pipeline intelligence:** Reverse-geocodes the point to municipality/province/CCAA and queries the legal monitoring pipeline (89+ sources) for active restrictions: regional tourism decrees, seasonal fire bans (AEMET), provincial BOP ordinances, and any other classified documents affecting that area.
* **Legal Verdict Card:** Results are displayed in a bottom sheet with the same visual language as spot legal status (green checks, red warnings, source citations). Includes links to the specific legal articles/decrees when available.
* **Offline-Ready:** Because all data sources (MITECO shapefiles, INSPIRE cadastral parcels, legal pipeline documents) are imported into the local PostGIS database, the full legal check works without network connectivity — directly supporting the Premium "On-Device Legal Verification" goal.

### [Optional — Under Evaluation] Spot Proposal

After reviewing the legal check results, Premium users could optionally propose the location as a new spot for the WildSpotter database:

* **"Propose This Spot" button:** Appears in the legal verdict card. The user can add a short note (e.g., "flat clearing behind the beach, fits 2 vans").
* **Curated, Not Crowdsourced:** Proposals enter a private review queue. The WildSpotter team validates each submission, and approved locations enter the full pipeline (Terrain, AI, Context, Scoring) before appearing in the database. Users do not add spots directly — the algorithmic radar philosophy is preserved.
* **Monthly Cap:** Limited to ~5 proposals/month per Premium user to prevent spam and maintain quality.
* **Feedback Loop:** Proposers receive a notification when their spot is approved/rejected, building engagement and trust.

> **Open questions:** Is this feature worth the moderation overhead? Does it dilute the "algorithmic radar" identity, or strengthen it by catching spots OSM data misses? To be validated with early Premium users before committing.

---

## 5. Private Explorer Circles
**Goal:** Enable secure, small-scale sharing of spots among trusted friends without exposing them to the general public.
* **Trusted Groups:** Create small, private circles to share discovered spots with a select group of travel partners.
* **Collective Planning:** A shared view of "pinned" spots for upcoming trips, visible only to members of that specific private group.
* **Anti-Crowding Philosophy:** A system designed to prevent the "broadcast effect," ensuring that shared spots remain high-quality and uncrowded by limiting sharing to direct, verified connections.

---

## Summary of Value Proposition
The Premium tier transforms WildSpotter from an exploration tool into a **professional-grade survival and legal shield**. It provides the tools to find the most isolated spots, verify the legality of any location on the map, and stay there legally — even when completely disconnected from the world.
