# WildSpotter: Legal Data Pipeline Strategy (2026)

## 0. Integration & Compatibility
This strategy is an **evolutionary addition** to the existing legal infrastructure (V2/V3). It does not replace the current baseline but enhances it with automated ingestion, structured parsing, and a hybrid confidence-scoring model. It is designed to be fully combinable with the existing georeferenced data layers, ensuring that the legacy data remains as a fallback while the new automated pipeline provides high-frequency updates.

## 1. Strategic Vision: The Legal Radar
The primary goal of the WildSpotter Legal Data Pipeline is to transform the "Legal" axis of our radar from a static overlay into a **dynamic, high-confidence scoring engine**. In the vanlife world, legality is the #1 pain point; this system must provide an authoritative, auditable, and georeferenced answer to the question: *"Can I legally spend the night here right now?"*

The system will not aim for "perfect truth" (which doesn't exist in Spanish law due to local contradictions) but for **Maximum Confidence through Multi-Source Validation**.

## 2. The 4-Layer Hybrid Architecture
We adopt a hybrid strategy that prioritizes deterministic data (hard facts) and uses AI as a specialized tool for context and unstructured text extraction.

### Layer 1: Deterministic Core (APIs & Structured Feeds)
**Goal:** Automate 80% of data ingestion using zero-ambiguity sources.
- **Priority:** XML/RSS feeds from official bulletins (BOE, BOJA, DOGC, etc.) and WFS (Web Feature Service) from geoportales.
- **Mechanism:** A "Watcher" service monitors hashes and timestamps. If a new law or geometry is detected, it triggers the pipeline.

### Layer 2: Contextual Ingestion (Discovery Crawling)
**Goal:** Monitor the "non-structured" web (tourism portals, park websites).
- **Mechanism:** A focused crawler targets "Normativa" sections of 17 regional tourism portals and the MITECO park directory.
- **AI Task:** Classification. A fast, low-cost LLM determines if a newly found PDF is a relevant regulation (e.g., "PRUG", "Decreto de Turismo") or irrelevant noise.

### Layer 3: Legal Rule Engine (The Decision Maker)
**Goal:** Eliminate AI hallucinations in final legal verdicts.
- **Mechanism:** A Python-based engine that processes extracted attributes (e.g., `elevation > 1600m`, `outside_national_park`, `is_municipal_road`) through a deterministic decision tree.
- **AI Task:** Extraction. AI is used only to turn PDF text into structured JSON attributes (e.g., finding the specific altitude limit for bivouacking in Picos de Europa).

### Layer 4: Confidence Scoring (The Trust Signal)
**Goal:** Transparency for the user.
- **UI Output:** Every spot is assigned a **Confidence Score (0-100)** based on:
    - Age of the source (Recency).
    - Source Hierarchy (State Law > Regional Decree > Municipal Ordinance).
    - Conflict Detection (Does the City Hall allow what the Park forbids?).

---

## 3. Master Inventory: Sources of Truth (Spain)

### 3.1. National Level (High Priority)
| Source | Type | Availability | Key Document |
| :--- | :--- | :--- | :--- |
| **BOE** | XML/ELI | Excellent | General State Laws |
| **DGT** | PDF/Web | High | Instruction PROT 2023/14 (Baseline for parking) |
| **MITECO (Costas)** | WFS/Web | High | Coastal Protection Zones (Deslindes) |
| **MITECO (Parks)** | PDF/Web | Medium | National Park Management Plans (PRUG) |

### 3.2. Regional Level (CC.AA. Bulletins & Tourism)
The following sources provide the "Regional Rules" that often override general state guidelines.

| Region | Bulletin Source (RSS/Atom) | Tourism Regulation | Status |
| :--- | :--- | :--- | :--- |
| **Andalucía** | [BOJA RSS](https://www.juntadeandalucia.es/boja) | Decree 26/2018 | **Ready** |
| **Aragón** | [BOA RSS](http://www.boa.aragon.es) | Decree 79/1990 | **Found** |
| **Asturias** | [BOPA RSS](https://sede.asturias.es) | Decree 61/2022 | **Ready** |
| **Baleares** | [BOIB RSS](https://www.caib.es/boib) | General Prohibition | **Ready** |
| **Canarias** | [BOC RSS](https://www.gobiernodecanarias.org/boc) | Decree 119/2024 | **Ready** |
| **Cantabria** | [BOC RSS](https://boc.cantabria.es) | Decree 51/2019 (Updating 2026) | **Monitoring** |
| **Castilla-La Mancha** | [DOCM RSS](https://docm.jccm.es) | Decree 5/2022 | **Ready** |
| **Castilla y León** | [BOCyL RSS](https://bocyl.jcyl.es) | Decree 9/2017 | **Ready** |
| **Cataluña** | [DOGC RSS](https://dogc.gencat.cat) | Decree 159/2012 | **Ready** |
| **Extremadura** | [DOE RSS](http://doe.juntaex.es) | Decree 46/2025 | **Ready** |
| **Galicia** | [DOG RSS](https://www.xunta.gal/dog) | Decree 159/2019 | **Ready** |
| **Madrid** | [BOCM RSS](https://www.bocm.es) | Decree 3/1993 | **Ready** |
| **Murcia** | [BORM RSS](https://www.borm.es) | Decree 193/2022 | **Ready** |
| **Navarra** | [BON RSS](https://bon.navarra.es) | Decree 24/2009 | **Ready** |
| **País Vasco** | [BOPV RSS](https://www.euskadi.eus/bopv) | Decree 396/2013 | **Ready** |
| **Valencia** | [DOGV RSS](https://dogv.gva.es) | Decree 10/2021 | **Ready** |
| **La Rioja** | [BOR RSS](https://larioja.org/bor) | - | **Ready** |

### 3.3. Local Level (The Municipal Challenge)
To monitor Spain's 8,000+ municipalities, we monitor the **50 Provincial Bulletins (BOP)**. This is where municipal ordinances are legally published.
- **Strategy:** Target BOPs with a Keyword-Watcher (e.g., "autocaravana", "pernocta", "ordenanza civismo").

### 3.4. Protected Natural Areas (PRUGs)
Specific "mini-laws" for Parks.
- **Picos de Europa:** Bivouac allowed > 1600m (Sunset to Sunrise).
- **Sierra Nevada:** Bivouac allowed > 1600m (specific distance from roads).
- **Doñana / Tablas de Daimiel:** Strictly prohibited.

## 4. Operational Gaps & Unknowns
1.  **Municipal "Shadow" Laws:** Some villages place "No Parking" signs that are not backed by a published ordinance. Our system will mark these as "Low Confidence" until user reports (Community Feedback) validate them.
2.  **Frequency of PRUG Updates:** Natural park management plans are updated infrequently (every 5-10 years) but without a clear RSS feed. This remains a manual/Discovery Crawling target.
3.  **Real-time Fire Bans:** During summer, regional governments issue temporary emergency bans. These need a dedicated "Emergency Watcher" for Civil Protection alerts.

## 5. Success Metric
The system is successful if:
- A change in the **Asturias Tourism Decree** is reflected in the app within 48 hours of publication.
- A user can click on a spot and see: *"Legal (95% Confidence) - Source: BOPA Decree 61/2022, last verified 3 days ago."*
