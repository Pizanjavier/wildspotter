"""HTML scraper configurations for 8 CCAA official gazettes.

These CCAA don't provide RSS feeds but have scrapeable web pages.
entry_pattern is only set when the CSS selector has been verified against
the live HTML. When absent, the scraper falls back to block-level text
line extraction with keyword matching.
"""

HTML_SOURCES: list[dict] = [
    {
        "source_id": "boja_andalucia",
        "name": "BOJA - Boletín Oficial de la Junta de Andalucía",
        "ccaa": "andalucia",
        "url": "https://www.juntadeandalucia.es/boja/buscador/",
        "base_url": "https://www.juntadeandalucia.es",
        "poll_interval_hours": 24,
    },
    {
        "source_id": "bopa_asturias",
        "name": "BOPA - Boletín Oficial del Principado de Asturias",
        "ccaa": "asturias",
        "url": "https://sede.asturias.es/bopa",
        "base_url": "https://sede.asturias.es",
        "poll_interval_hours": 24,
    },
    {
        "source_id": "boc_cantabria",
        "name": "BOC - Boletín Oficial de Cantabria",
        "ccaa": "cantabria",
        "url": "https://boc.cantabria.es/boces/",
        "base_url": "https://boc.cantabria.es",
        "poll_interval_hours": 24,
    },
    {
        "source_id": "bon_navarra_html",
        "name": "BON - Boletín Oficial de Navarra (HTML)",
        "ccaa": "navarra",
        "url": "https://bon.navarra.es/",
        "base_url": "https://bon.navarra.es",
        "poll_interval_hours": 24,
    },
    {
        "source_id": "bopv_pais_vasco",
        "name": "BOPV - Boletín Oficial del País Vasco",
        "ccaa": "pais_vasco",
        "url": "https://www.euskadi.eus/y22-bopv/es/",
        "base_url": "https://www.euskadi.eus",
        "poll_interval_hours": 24,
    },
    {
        "source_id": "bor_la_rioja_html",
        "name": "BOR - Boletín Oficial de La Rioja (HTML)",
        "ccaa": "la_rioja",
        "url": "https://web.larioja.org/bor-portada",
        "base_url": "https://web.larioja.org",
        "poll_interval_hours": 24,
    },
    {
        "source_id": "boa_aragon_html",
        "name": "BOA - Boletín Oficial de Aragón (HTML)",
        "ccaa": "aragon",
        "url": "https://www.boa.aragon.es/cgi-bin/EBOA/BRSCGI?CMD=VERLST&OUTPUTMODE=HTML",
        "base_url": "https://www.boa.aragon.es",
        "poll_interval_hours": 24,
    },
    {
        "source_id": "dogv_valencia_html",
        "name": "DOGV - Diari Oficial de la Generalitat Valenciana (HTML)",
        "ccaa": "valencia",
        "url": "https://dogv.gva.es/es/resultat.html",
        "base_url": "https://dogv.gva.es",
        "poll_interval_hours": 24,
    },
]
