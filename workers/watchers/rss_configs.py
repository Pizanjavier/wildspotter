"""RSS feed configurations for CCAA official gazettes.

Active feeds verified 2026-05-14. Notes on disabled sources:
- boa_aragon: BRSCGI CGI endpoint decommissioned; new Angular site requires auth API. Disabled.
- dogv_valencia: RSS feed removed from DOGV Liferay portal. Disabled.
"""

RSS_SOURCES: list[dict] = [
    # boa_aragon DISABLED — BRSCGI CGI decommissioned, Angular app API requires auth (401).
    # Revisit if Aragón publishes a new public RSS endpoint.
    # {
    #     "source_id": "boa_aragon",
    #     "name": "BOA - Boletín Oficial de Aragón",
    #     "ccaa": "aragon",
    #     "url": "DISABLED",
    #     "poll_interval_hours": 12,
    # },
    {
        "source_id": "boib_baleares",
        "name": "BOIB - Butlletí Oficial de les Illes Balears",
        "ccaa": "baleares",
        # Fixed 2026-05-14: old /rss/ca returned 404; correct endpoint is indexrss.do
        "url": "https://www.caib.es/eboibfront/indexrss.do?lang=es",
        "poll_interval_hours": 12,
    },
    {
        "source_id": "boc_canarias",
        "name": "BOC - Boletín Oficial de Canarias (Disposiciones Generales)",
        "ccaa": "canarias",
        # Fixed 2026-05-14: old boc-rss.xml returned 404; feeds moved under /feeds/capitulo/
        "url": "https://www.gobiernodecanarias.org/boc/feeds/capitulo/disposiciones_generales.rss",
        "poll_interval_hours": 12,
    },
    {
        "source_id": "bocyl_castilla_y_leon",
        "name": "BOCyL - Boletín Oficial de Castilla y León",
        "ccaa": "castilla_y_leon",
        # Fixed 2026-05-14: old /rss/bocyl-ultimas-disposiciones.xml returned 500; correct path is /rss
        "url": "https://bocyl.jcyl.es/rss",
        "poll_interval_hours": 12,
    },
    {
        "source_id": "doe_extremadura",
        "name": "DOE - Diario Oficial de Extremadura (Otras Resoluciones)",
        "ccaa": "extremadura",
        # Fixed 2026-05-14: old /rss/ultimosDOE.xml returned 404; correct endpoint is rss.php?seccion=3
        # seccion=3 = "Otras Resoluciones" (15 entries). seccion=1 = Disposiciones Generales (0 entries).
        # NOTE: feed is ISO-8859-1 encoded; rss_watcher must use resp.content (bytes) not resp.text.
        "url": "https://doe.juntaex.es/rss/rss.php?seccion=3",
        "poll_interval_hours": 12,
        "fetch_as_bytes": True,
    },
    {
        "source_id": "bocm_madrid",
        "name": "BOCM - Boletín Oficial de la Comunidad de Madrid",
        "ccaa": "madrid",
        # Fixed 2026-05-14: old /rss returned mismatched-tag parse error; /boletines.rss is clean (20 entries)
        "url": "https://www.bocm.es/boletines.rss",
        "poll_interval_hours": 12,
    },
    {
        "source_id": "bop_badajoz_rss",
        "name": "BOP Badajoz (Atom feed)",
        "ccaa": "extremadura",
        "url": "https://www.dip-badajoz.es/canales/atom_xml_bop.php?c=1&u=1",
        "poll_interval_hours": 24,
    },
    # dogv_valencia DISABLED — RSS/Atom feed removed from DOGV Liferay portal.
    # All /rss/* and /feed/* paths return HTML 200. Disabled until they restore RSS.
    # {
    #     "source_id": "dogv_valencia",
    #     "name": "DOGV - Diari Oficial de la Generalitat Valenciana",
    #     "ccaa": "valencia",
    #     "url": "DISABLED",
    #     "poll_interval_hours": 12,
    # },
    # boe_secondary REMOVED — dedicated boe_watcher.py already covers BOE national gazette.
]
