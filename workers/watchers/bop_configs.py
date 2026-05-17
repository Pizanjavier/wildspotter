"""BOP configurations for 49 Spanish provinces (Madrid covered by BOCM RSS).

Each province's BOP is classified into groups:
  B: HTML scrapeable (33 provinces)
  C: Daily PDF only (10 provinces) — scraper finds PDF link on page, then extracts
  D: JS-heavy / access issues (7 provinces) — Playwright fallback

URLs last verified 2026-05-15. Fixed: Sevilla, Girona, Tarragona, Alicante,
Teruel, Soria, Ourense, Zaragoza.
"""

BOP_CONFIGS: list[dict] = [
    # Aragón + Cataluña (formerly had RSS, now Group B HTML)
    {"source_id": "bop_barcelona", "name": "BOP Barcelona", "province": "Barcelona", "ccaa": "cataluna", "group": "B", "url": "https://bop.diba.cat/", "poll_interval_hours": 24},
    {"source_id": "bop_huesca", "name": "BOP Huesca", "province": "Huesca", "ccaa": "aragon", "group": "B", "url": "https://bop.dphuesca.es/", "poll_interval_hours": 24},
    {"source_id": "bop_zaragoza", "name": "BOP Zaragoza", "province": "Zaragoza", "ccaa": "aragon", "group": "B", "url": "https://bop.dpz.es/BOPZ/", "poll_interval_hours": 24},
    {"source_id": "bop_teruel", "name": "BOP Teruel", "province": "Teruel", "ccaa": "aragon", "group": "B", "url": "https://236ws.dpteruel.es/DPT/bopt.nsf/inicio.xsp", "poll_interval_hours": 24},
    {"source_id": "bop_bizkaia", "name": "BOP Bizkaia", "province": "Bizkaia", "ccaa": "pais_vasco", "group": "D", "url": "https://www.bizkaia.eus/eu/bao", "poll_interval_hours": 48},

    # Group B — HTML scrapeable (coastal + high-priority provinces first)
    {"source_id": "bop_cadiz", "name": "BOP Cádiz", "province": "Cádiz", "ccaa": "andalucia", "group": "B", "url": "https://www.bopcadiz.es/", "poll_interval_hours": 24},
    {"source_id": "bop_malaga", "name": "BOP Málaga", "province": "Málaga", "ccaa": "andalucia", "group": "B", "url": "https://www.bopmalaga.es/", "poll_interval_hours": 24},
    {"source_id": "bop_valencia", "name": "BOP Valencia", "province": "Valencia", "ccaa": "valencia", "group": "B", "url": "https://bop.dival.es/bop/", "poll_interval_hours": 24},
    {"source_id": "bop_alicante", "name": "BOP Alicante", "province": "Alicante", "ccaa": "valencia", "group": "B", "url": "https://sede.diputacionalicante.es/consultas-bop/", "poll_interval_hours": 24},
    {"source_id": "bop_castellon", "name": "BOP Castellón", "province": "Castellón", "ccaa": "valencia", "group": "B", "url": "https://bop.dipcas.es/", "poll_interval_hours": 24},
    {"source_id": "bop_girona", "name": "BOP Girona", "province": "Girona", "ccaa": "cataluna", "group": "B", "url": "https://www.ddgi.es/bop/", "poll_interval_hours": 24},
    {"source_id": "bop_tarragona", "name": "BOP Tarragona", "province": "Tarragona", "ccaa": "cataluna", "group": "D", "url": "https://www.dipta.cat/bopt/web/butlleti-del-dia", "poll_interval_hours": 48},
    {"source_id": "bop_lleida", "name": "BOP Lleida", "province": "Lleida", "ccaa": "cataluna", "group": "B", "url": "https://www.diputaciolleida.cat/bop/", "poll_interval_hours": 24},
    {"source_id": "bop_sevilla", "name": "BOP Sevilla", "province": "Sevilla", "ccaa": "andalucia", "group": "B", "url": "https://bopsevilla.dipusevilla.es/", "poll_interval_hours": 24},
    {"source_id": "bop_granada", "name": "BOP Granada", "province": "Granada", "ccaa": "andalucia", "group": "B", "url": "https://www.dipgra.es/bop/", "poll_interval_hours": 24},
    {"source_id": "bop_almeria", "name": "BOP Almería", "province": "Almería", "ccaa": "andalucia", "group": "B", "url": "https://app.dipalme.org/pandora/advanced.vm?view=boletines", "poll_interval_hours": 24},
    {"source_id": "bop_huelva", "name": "BOP Huelva", "province": "Huelva", "ccaa": "andalucia", "group": "B", "url": "https://sede.diphuelva.es/servicios/bop", "poll_interval_hours": 24},
    {"source_id": "bop_cordoba", "name": "BOP Córdoba", "province": "Córdoba", "ccaa": "andalucia", "group": "B", "url": "https://www.dipucordoba.es/bop/", "poll_interval_hours": 24},
    {"source_id": "bop_jaen", "name": "BOP Jaén", "province": "Jaén", "ccaa": "andalucia", "group": "B", "url": "https://bop.dipujaen.es/", "poll_interval_hours": 24},
    {"source_id": "bop_asturias", "name": "BOP Asturias", "province": "Asturias", "ccaa": "asturias", "group": "B", "url": "https://sede.asturias.es/bopa", "poll_interval_hours": 24},
    {"source_id": "bop_cantabria", "name": "BOP Cantabria", "province": "Cantabria", "ccaa": "cantabria", "group": "B", "url": "https://boc.cantabria.es/", "poll_interval_hours": 24},
    {"source_id": "bop_pontevedra", "name": "BOP Pontevedra", "province": "Pontevedra", "ccaa": "galicia", "group": "B", "url": "https://boppo.depo.gal/", "poll_interval_hours": 24},
    {"source_id": "bop_coruna", "name": "BOP A Coruña", "province": "A Coruña", "ccaa": "galicia", "group": "B", "url": "https://bop.dicoruna.es/", "poll_interval_hours": 24},
    {"source_id": "bop_lugo", "name": "BOP Lugo", "province": "Lugo", "ccaa": "galicia", "group": "B", "url": "https://www.deputacionlugo.gal/boletin-oficial-da-provincia-de-lugo/bop", "poll_interval_hours": 24},
    {"source_id": "bop_ourense", "name": "BOP Ourense", "province": "Ourense", "ccaa": "galicia", "group": "D", "url": "https://bop.depourense.es/portal/consulta", "poll_interval_hours": 48},
    {"source_id": "bop_navarra", "name": "BOP Navarra", "province": "Navarra", "ccaa": "navarra", "group": "B", "url": "https://bon.navarra.es/", "poll_interval_hours": 24},
    {"source_id": "bop_araba", "name": "BOP Araba", "province": "Araba/Álava", "ccaa": "pais_vasco", "group": "B", "url": "https://www.araba.eus/botha/inicio/sgbo5001.aspx", "poll_interval_hours": 24},
    {"source_id": "bop_gipuzkoa", "name": "BOP Gipuzkoa", "province": "Gipuzkoa", "ccaa": "pais_vasco", "group": "B", "url": "https://egoitza.gipuzkoa.eus/es/bog", "poll_interval_hours": 24},
    {"source_id": "bop_avila", "name": "BOP Ávila", "province": "Ávila", "ccaa": "castilla_y_leon", "group": "B", "url": "https://www.diputacionavila.es/bop/", "poll_interval_hours": 24},
    {"source_id": "bop_palencia", "name": "BOP Palencia", "province": "Palencia", "ccaa": "castilla_y_leon", "group": "B", "url": "https://www.diputaciondepalencia.es/servicios/boletin-oficial-provincia", "poll_interval_hours": 24},
    {"source_id": "bop_segovia", "name": "BOP Segovia", "province": "Segovia", "ccaa": "castilla_y_leon", "group": "B", "url": "https://www.dipsegovia.es/bop", "poll_interval_hours": 24},
    {"source_id": "bop_soria", "name": "BOP Soria", "province": "Soria", "ccaa": "castilla_y_leon", "group": "B", "url": "https://bop.dipsoria.es/", "poll_interval_hours": 24},
    {"source_id": "bop_zamora", "name": "BOP Zamora", "province": "Zamora", "ccaa": "castilla_y_leon", "group": "B", "url": "https://www.diputaciondezamora.es/opencms/servicios/BOP/bop/index.html", "poll_interval_hours": 24},

    # Group C — Daily PDF (pages with discoverable .pdf links)
    {"source_id": "bop_leon", "name": "BOP León", "province": "León", "ccaa": "castilla_y_leon", "group": "C", "url": "https://bop.dipuleon.es/", "poll_interval_hours": 24},
    {"source_id": "bop_burgos", "name": "BOP Burgos", "province": "Burgos", "ccaa": "castilla_y_leon", "group": "C", "url": "https://bopbur.diputaciondeburgos.es/bopbur-ultimo", "poll_interval_hours": 24},
    {"source_id": "bop_salamanca", "name": "BOP Salamanca", "province": "Salamanca", "ccaa": "castilla_y_leon", "group": "C", "url": "https://www.lasalina.es/bop/", "poll_interval_hours": 24},
    {"source_id": "bop_caceres", "name": "BOP Cáceres", "province": "Cáceres", "ccaa": "extremadura", "group": "C", "url": "https://bop.dip-caceres.es/", "poll_interval_hours": 24},

    # Reclassified to Group B — Badajoz has Atom feed we treat as HTML-scrapeable
    {"source_id": "bop_badajoz", "name": "BOP Badajoz", "province": "Badajoz", "ccaa": "extremadura", "group": "B", "url": "https://www.dip-badajoz.es/bop/index.php", "poll_interval_hours": 24},

    # Reclassified to Group D — JS-heavy, no static PDF links
    {"source_id": "bop_las_palmas", "name": "BOP Las Palmas", "province": "Las Palmas", "ccaa": "canarias", "group": "D", "url": "http://www.boplaspalmas.net/nbop2", "poll_interval_hours": 48},
    {"source_id": "bop_tenerife", "name": "BOP Tenerife", "province": "Santa Cruz de Tenerife", "ccaa": "canarias", "group": "D", "url": "https://www.tenerife.es/portalcabtfe/es/gobierno-abierto/bop", "poll_interval_hours": 48},
    {"source_id": "bop_valladolid", "name": "BOP Valladolid", "province": "Valladolid", "ccaa": "castilla_y_leon", "group": "D", "url": "https://bop.sede.diputaciondevalladolid.es/", "poll_interval_hours": 48},

    # Duplicates — already covered by CCAA-level RSS/HTML watchers
    # bop_baleares: covered by boib_baleares (RSS)
    # bop_la_rioja: covered by bor_la_rioja_html (HTML)

    # Group D — Playwright fallback (JS-heavy / JSF sites)
    {"source_id": "bop_murcia", "name": "BOP Murcia", "province": "Murcia", "ccaa": "murcia", "group": "D", "url": "https://www.borm.es/borm/vista/busqueda/busquedaAnuncios.jsf", "poll_interval_hours": 48},
    {"source_id": "bop_toledo", "name": "BOP Toledo", "province": "Toledo", "ccaa": "castilla_la_mancha", "group": "D", "url": "https://bop.diputoledo.es/", "poll_interval_hours": 48},
    {"source_id": "bop_ciudad_real", "name": "BOP Ciudad Real", "province": "Ciudad Real", "ccaa": "castilla_la_mancha", "group": "D", "url": "https://bop.dipucr.es/", "poll_interval_hours": 48},
    {"source_id": "bop_albacete", "name": "BOP Albacete", "province": "Albacete", "ccaa": "castilla_la_mancha", "group": "D", "url": "https://bop.dipualba.es/", "poll_interval_hours": 48},
    {"source_id": "bop_cuenca", "name": "BOP Cuenca", "province": "Cuenca", "ccaa": "castilla_la_mancha", "group": "D", "url": "https://www.dipucuenca.es/boletin-oficial-de-la-provincia", "poll_interval_hours": 48},
    {"source_id": "bop_guadalajara", "name": "BOP Guadalajara", "province": "Guadalajara", "ccaa": "castilla_la_mancha", "group": "D", "url": "https://boletin.dguadalajara.es/boletin/index.php", "poll_interval_hours": 48},
]
