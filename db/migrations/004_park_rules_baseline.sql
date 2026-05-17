-- Park-specific overnight rules baseline
-- Run inside the db container:
--   docker-compose exec -T db psql -U wildspotter -d wildspotter < db/migrations/004_park_rules_baseline.sql
--
-- Seeds legal_documents with PRUG-sourced overnight rules for parks
-- that overlap with existing spots. Each park's rule is linked to
-- its actual geometry via affected_area so LegalSituation can show
-- park-specific verdicts instead of generic "consulta la regulación".

BEGIN;

-- Register a dedicated source for park PRUG baselines
INSERT INTO legal_source_state (id, name, source_type, region, url, poll_interval_hours)
VALUES ('baseline_parks', 'Park PRUG Overnight Rules (curated)', 'api', 'national', NULL, 8760)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PARQUES NACIONALES
-- ============================================================

-- Picos de Europa (93 spots) — Prohibited; bivouac above 1600m only
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Picos de Europa: acampada y pernocta en vehículo prohibidas dentro del parque',
  'overnight_ban', NULL, 'verified', 'active',
  'PRUG Picos de Europa (MITECO)',
  '[{"number": "PRUG", "title": "Pernocta prohibida en vehículo", "text_verbatim": "Acampada libre estrictamente prohibida en todo el parque. No existen zonas habilitadas para autocaravanas dentro de los límites del parque. Vivac permitido solo por encima de 1.600m, con montaje máximo 1h antes del ocaso y desmontaje 1h tras el amanecer. Prohibido en Reservas Integrales y a menos de 500m de refugios.", "legal_distinction": "acampada_prohibida_vivac_altitud", "max_stay_hours": null, "restrictions": ["sin_vehiculos_pernocta", "sin_zonas_autocaravana"], "exceptions": ["vivac_encima_1600m"]}]',
  'baseline_park_picos_europa',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Picos de Europa' AND odesignate = 'Parque Nacional')
);

-- Sierra de Guadarrama (50 spots) — Prohibited; vehicles explicitly named in Art. 38
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Sierra de Guadarrama: pernocta en vehículo expresamente prohibida (Art. 38)',
  'overnight_ban', 'madrid', 'verified', 'active',
  'Decreto 18/2020, de 11 de febrero (Comunidad de Madrid)',
  '[{"number": "Art. 38", "title": "Pernocta en vehículo = acampada libre", "text_verbatim": "El PRUG define acampada libre incluyendo expresamente caravanas, autocaravanas y vehículos de cualquier tipo. Dormir en un vehículo aparcado dentro del parque se clasifica como acampada libre y está prohibido. Restricción de acceso vehicular junio-septiembre (7:30-22:30 en zonas reguladas).", "legal_distinction": "vehiculo_incluido_en_acampada", "max_stay_hours": 0, "restrictions": ["vehiculos_incluidos_definicion_acampada", "restriccion_acceso_verano"], "exceptions": []}]',
  'baseline_park_guadarrama',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Sierra de Guadarrama' AND odesignate = 'Parque Nacional')
);

-- Sierra Nevada (47 spots) — Prohibited vehicles; bivouac above 1600m with notification
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Sierra Nevada: acampada prohibida; vivac encima de 1.600m con notificación previa',
  'overnight_ban', 'andalucia', 'verified', 'active',
  'Decreto 238/2011, de 12 de julio (Junta de Andalucía)',
  '[{"number": "PRUG Art. 5.3", "title": "Vivac con notificación previa", "text_verbatim": "Acampada libre completamente prohibida. Pernocta en autocaravana prohibida. Vivac permitido encima de 1.600m con notificación escrita previa al director del parque. Grupos >3 tiendas o >15 personas requieren autorización expresa. Prohibido en zonas forestales junio-octubre, a <500m de refugios/carreteras, a <1km de carreteras asfaltadas, a <50m de lagunas y arroyos.", "legal_distinction": "acampada_prohibida_vivac_altitud", "max_stay_hours": null, "restrictions": ["sin_vehiculos_pernocta", "notificacion_previa_obligatoria", "prohibido_zona_forestal_jun_oct"], "exceptions": ["vivac_encima_1600m_con_notificacion"]}]',
  'baseline_park_sierra_nevada',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Sierra Nevada' AND odesignate = 'Parque Nacional')
);

-- Ordesa y Monte Perdido (40 spots) — Prohibited; sector-dependent altitude thresholds
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Ordesa y Monte Perdido: pernocta prohibida; vivac por sectores con altitud mínima',
  'overnight_ban', 'aragon', 'verified', 'active',
  'Decreto 16/2022, de 26 de enero (BOA)',
  '[{"number": "PRUG 2022", "title": "Vivac prohibido en sector Ordesa; restringido en otros sectores", "text_verbatim": "Desde febrero 2022, todo vivac y acampada prohibidos en el sector Ordesa (excepción: zona Refugio de Góriz con reserva previa, máx. 50 personas). Otros sectores: Añisclo encima de 1.650m, Escuaín encima de 1.800m, Pineta encima de 2.550m. Montaje máximo 1h antes del ocaso. Sin autocaravanas dentro del parque.", "legal_distinction": "acampada_prohibida_vivac_sectorial", "max_stay_hours": null, "restrictions": ["sector_ordesa_prohibicion_total", "sin_vehiculos_pernocta", "reserva_goriz_obligatoria"], "exceptions": ["vivac_anisclo_1650m", "vivac_escuain_1800m", "vivac_pineta_2550m"]}]',
  'baseline_park_ordesa',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Ordesa y Monte Perdido' AND odesignate = 'Parque Nacional')
);

-- Monfragüe (38 spots) — Prohibited
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Monfragüe: acampada y pernocta en vehículo prohibidas',
  'overnight_ban', 'extremadura', 'verified', 'active',
  'Ley 1/2007 (declaración) + Ley 6/2018 (Extremadura)',
  '[{"number": "PRUG", "title": "Pernocta prohibida", "text_verbatim": "Acampada libre y pernocta en vehículo prohibidas dentro del Parque Nacional. No existen áreas de autocaravanas dentro del parque. Zonas de dehesa con propiedad privada añaden riesgo legal adicional.", "legal_distinction": null, "max_stay_hours": 0, "restrictions": ["sin_vehiculos_pernocta", "propiedad_privada_dehesa"], "exceptions": []}]',
  'baseline_park_monfrague',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Monfragüe' AND odesignate = 'Parque Nacional')
);

-- Islas Atlánticas de Galicia (20 spots) — Vehicle access impossible
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Islas Atlánticas: acceso en vehículo imposible (parque insular)',
  'overnight_ban', 'galicia', 'verified', 'active',
  'Ley 15/2002, de 1 de julio',
  '[{"number": "Ley 15/2002", "title": "Parque insular sin acceso vehicular", "text_verbatim": "Islas accesibles solo por ferry desde Vigo, Cangas o Baiona. No hay acceso para vehículos a las islas. Pernocta solo en camping autorizado de Islas Cíes (reserva previa obligatoria). Cupo diario de visitantes (Cíes: 2.200 en temporada alta).", "legal_distinction": "sin_acceso_vehicular", "max_stay_hours": 0, "restrictions": ["sin_acceso_vehicular", "solo_ferry", "cupo_visitantes"], "exceptions": ["camping_autorizado_cies_con_reserva"]}]',
  'baseline_park_islas_atlanticas',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Islas Atlánticas de Galicia' AND odesignate = 'Parque Nacional')
);

-- Tablas de Daimiel (14 spots) — Restricted; 6 motorhome spaces with permit
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Tablas de Daimiel: pernocta autocaravana permitida en zona designada (6 plazas, con permiso)',
  'parking_ban', 'castilla_la_mancha', 'verified', 'active',
  'Permiso administrativo del Centro de Interpretación',
  '[{"number": "Admin", "title": "Zona designada autocaravanas (6 plazas)", "text_verbatim": "Acampada general prohibida dentro del parque. Excepción única: aparcamiento del Molino del Molemocho (~600m del Centro de Visitantes), máximo 6 autocaravanas por noche, superficie de grava, sin servicios. Permiso previo obligatorio llamando al Centro de Interpretación: 926 693 118. Máximo 1 noche.", "legal_distinction": "zona_designada_con_permiso", "max_stay_hours": 24, "restrictions": ["max_6_vehiculos", "permiso_previo_obligatorio", "max_1_noche"], "exceptions": ["molino_molemocho_con_permiso"]}]',
  'baseline_park_tablas_daimiel',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Tablas de Daimiel' AND odesignate = 'Parque Nacional')
);

-- Doñana (10 spots) — Prohibited
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Doñana: acampada y pernocta en vehículo prohibidas',
  'overnight_ban', 'andalucia', 'verified', 'active',
  'Real Decreto 1485/2004 (PRUG) + Decreto 26/2018 (Andalucía)',
  '[{"number": "PRUG", "title": "Pernocta prohibida", "text_verbatim": "Acampada libre y pernocta en vehículo prohibidas en todo el Parque Nacional. No existen áreas de autocaravanas internas. Acceso a zonas centrales solo con visita guiada autorizada. Extensas zonas de fincas privadas.", "legal_distinction": null, "max_stay_hours": 0, "restrictions": ["sin_vehiculos_pernocta", "acceso_guiado_zona_central", "propiedad_privada"], "exceptions": []}]',
  'baseline_park_donana',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Doñana' AND odesignate = 'Parque Nacional')
);

-- Sierra de las Nieves (10 spots) — Restricted; PRUG in formulation
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Sierra de las Nieves: PRUG en tramitación; se aplica normativa general andaluza',
  'overnight_ban', 'andalucia', 'verified', 'active',
  'Ley 9/2021 (declaración) + Decreto 26/2018 (Andalucía)',
  '[{"number": "Ley 9/2021", "title": "PRUG pendiente de aprobación", "text_verbatim": "Parque Nacional declarado en julio 2021. PRUG en fase de formulación (aprobado inicio de tramitación mayo 2025). Hasta su aprobación, se aplica la normativa general andaluza: acampada prohibida, vivac con notificación para grupos pequeños. La ausencia de PRUG crea ambigüedad práctica.", "legal_distinction": "prug_pendiente", "max_stay_hours": null, "restrictions": ["acampada_prohibida_normativa_andaluza", "prug_en_tramitacion"], "exceptions": ["vivac_con_notificacion_grupos_pequenos"]}]',
  'baseline_park_sierra_nieves',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Sierra de las Nieves' AND odesignate = 'Parque Nacional')
);

-- Aigüestortes i Estany de Sant Maurici (9 spots) — Prohibited; no vehicle access
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Aigüestortes: acampada prohibida; acceso vehicular prohibido al interior',
  'overnight_ban', 'cataluna', 'verified', 'active',
  'PRUG Aigüestortes (Generalitat de Catalunya)',
  '[{"number": "PRUG", "title": "Sin acceso vehicular al parque", "text_verbatim": "Toda acampada y vivac prohibidos en el parque y zona periférica de protección. No hay acceso para vehículos privados al interior; solo entrada a pie o taxi 4x4 oficial. Pernocta únicamente en refugios de montaña (reserva obligatoria).", "legal_distinction": "sin_acceso_vehicular", "max_stay_hours": 0, "restrictions": ["sin_acceso_vehicular", "sin_acampada_zona_periferica"], "exceptions": ["refugios_con_reserva"]}]',
  'baseline_park_aiguestortes',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Aigüestortes i Estany de Sant Maurici' AND odesignate = 'Parque Nacional')
);

-- Cabañeros (4 spots) — Prohibited; peripheral tolerance
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Cabañeros: acampada prohibida; tolerancia informal en zona periférica',
  'overnight_ban', 'castilla_la_mancha', 'verified', 'active',
  'Ley de Parques Nacionales + normativa CLM',
  '[{"number": "PRUG", "title": "Pernocta prohibida, tolerancia periférica", "text_verbatim": "Acampada y pernocta prohibidas dentro del Parque Nacional. Acceso vehicular permitido en horario de visita pero no de noche. Zona periférica (Las Becerras, junto al punto de información): tolerancia informal para 4-5 autocaravanas, no regulada formalmente.", "legal_distinction": null, "max_stay_hours": 0, "restrictions": ["sin_pernocta_interior", "acceso_horario_diurno"], "exceptions": ["tolerancia_informal_las_becerras"]}]',
  'baseline_park_cabaneros',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Cabañeros' AND odesignate = 'Parque Nacional')
);

-- Archipiélago de Cabrera (2 spots) — Vehicle access impossible
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Archipiélago de Cabrera: acceso en vehículo imposible (parque insular)',
  'overnight_ban', 'baleares', 'verified', 'active',
  'Real Decreto 277/1995, de 24 de febrero',
  '[{"number": "RD 277/1995", "title": "Parque insular sin acceso vehicular", "text_verbatim": "Archipiélago accesible solo en embarcación autorizada desde Colònia de Sant Jordi. Sin acceso terrestre para vehículos. Pernocta terrestre prohibida. Fondeo en puerto de Cabrera con permiso específico (máximo 1 noche julio-agosto, 2 noches septiembre, 7 noches octubre-marzo).", "legal_distinction": "sin_acceso_vehicular", "max_stay_hours": 0, "restrictions": ["sin_acceso_vehicular", "solo_embarcacion", "permiso_fondeo"], "exceptions": []}]',
  'baseline_park_cabrera',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name ILIKE '%Cabrera%' AND odesignate = 'Parque Nacional')
);

-- ============================================================
-- TOP PARQUES NATURALES
-- ============================================================

-- Sierras de Cazorla, Segura y Las Villas (810 spots) — Prohibited; practical tolerance
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Cazorla, Segura y Las Villas: acampada prohibida; tolerancia práctica en pistas remotas',
  'overnight_ban', 'andalucia', 'verified', 'active',
  'Decreto 26/2018 (Andalucía) + PRUG Cazorla',
  '[{"number": "PRUG", "title": "Prohibida con tolerancia variable", "text_verbatim": "Pernocta prohibida dentro del Parque Natural por normativa andaluza. En la práctica, la extensión del parque (>200.000 ha) y la escasa presencia de agentes hacen que la pernocta en pistas remotas sin elementos externos sea ampliamente tolerada. Zona del Río Borosa y accesos principales con mayor vigilancia en verano. Área de autocaravanas en Cazorla/La Iruela (fuera del parque) como alternativa legal.", "legal_distinction": "estacionamiento_vs_acampada", "max_stay_hours": null, "restrictions": ["acampada_prohibida_normativa_andaluza", "vigilancia_rio_borosa_verano"], "exceptions": ["tolerancia_practica_pistas_remotas"]}]',
  'baseline_park_cazorla',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Sierras de Cazorla, Segura y las Villas' AND odesignate = 'Parque Natural')
);

-- Bardenas Reales (270 spots) — Explicitly prohibited; vehicles must exit before sunset
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Bardenas Reales: pernocta y autocaravanas expresamente prohibidas; vehículos deben salir antes del ocaso',
  'overnight_ban', 'navarra', 'verified', 'active',
  'Ordenanza Reguladora de Bardenas Reales (BON nº 148, 25/06/2021)',
  '[{"number": "Art. 29", "title": "Prohibición expresa de autocaravanas", "text_verbatim": "Queda prohibida la acampada individual o colectiva, en tiendas de campaña o autocaravanas, así como la pernocta al aire libre. Los vehículos deben abandonar el parque 1 hora antes del ocaso (entrada desde las 8:00). Velocidad máxima 40 km/h. Caravanas de 5+ vehículos prohibidas.", "legal_distinction": null, "max_stay_hours": 0, "restrictions": ["autocaravanas_expresamente_prohibidas", "salida_obligatoria_antes_ocaso", "velocidad_max_40kmh"], "exceptions": []}]',
  'baseline_park_bardenas',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Bardenas Reales' AND odesignate = 'Parque Natural')
);

-- Serra de Tramuntana (265 spots) — Prohibited; Lluc monastery exception
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Serra de Tramuntana: acampada prohibida; pernocta tolerada solo en Lluc',
  'overnight_ban', 'baleares', 'verified', 'active',
  'Normativa Balear de espacios naturales + ordenanzas municipales',
  '[{"number": "Normativa", "title": "Prohibida excepto Lluc", "text_verbatim": "Acampada libre prohibida en toda Mallorca y en el Parque Natural. Pernocta en autocaravana con elementos externos = acampada (sancionable por Seprona/Ibanat). Excepción: Monasterio de Lluc, pernocta vehicular con permiso de los guardianes (~10€/día). Áreas recreativas de Es Pixarells y Marjanor (cerca de Lluc) con tolerancia. Aplicación estricta en verano.", "legal_distinction": "acampada_vs_estacionamiento", "max_stay_hours": null, "restrictions": ["acampada_prohibida_toda_mallorca", "aplicacion_estricta_verano"], "exceptions": ["monasterio_lluc_con_permiso"]}]',
  'baseline_park_tramuntana',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Serra de Tramuntana' AND odesignate ILIKE '%natural%' LIMIT 1)
);

-- Zona Volcànica de la Garrotxa (189 spots) — Restricted; 2 designated overnight areas
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Garrotxa: pernocta prohibida excepto en 2 zonas designadas (Santa Margarida y Santa Pau)',
  'parking_ban', 'cataluna', 'verified', 'active',
  'PRUG Garrotxa (Generalitat de Catalunya) + Decreto 75/2020',
  '[{"number": "PRUG", "title": "2 zonas designadas para pernocta", "text_verbatim": "Pernocta prohibida en todo el parque excepto en dos puntos: 1) Parking Volcán Santa Margarida (asfaltado, 5€/día, con mesas y baños), 2) Área de Santa Pau (gratuita, sin servicios). Fageda den Jordà: solo uso diurno (4€/hora). Sadernes: pernocta prohibida con señalización. Cataluña Decreto 75/2020: máximo 48h en áreas privadas de tránsito.", "legal_distinction": "zonas_designadas", "max_stay_hours": 48, "restrictions": ["pernocta_solo_zonas_designadas", "fageda_solo_diurno"], "exceptions": ["parking_santa_margarida", "area_santa_pau"]}]',
  'baseline_park_garrotxa',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Zona Volcànica de la Garrotxa' AND odesignate = 'Parque Natural')
);

-- Cap de Creus (187 spots) — Prohibited in high season; low season with permit
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  seasonal, season_start_month, season_end_month
) VALUES (
  'baseline_parks',
  'Cap de Creus: autocaravanas prohibidas 24h en temporada alta (junio-septiembre)',
  'parking_ban', 'cataluna', 'verified', 'active',
  'Ordenanza municipal de Cadaqués + regulación Parc Natural',
  '[{"number": "Ordenanza", "title": "Prohibición temporal con cámaras", "text_verbatim": "Temporada alta (11 junio - 30 septiembre): autocaravanas prohibidas 24h dentro del parque. Todos los vehículos restringidos 9:30-20:00. Multas de 200€, vigilancia con cámaras. Temporada baja: pernocta posible con autorización escrita previa de la Policía Local de Cadaqués (policialocal@cadaques.cat, 972 159 343).", "legal_distinction": "prohibicion_temporal", "max_stay_hours": 0, "restrictions": ["autocaravanas_prohibidas_temp_alta", "camaras_vigilancia", "multa_200eur"], "exceptions": ["temp_baja_con_autorizacion_policia"]}]',
  'baseline_park_cap_creus',
  true, 6, 9
);
-- Cap de Creus geometry from the park polygon
UPDATE legal_documents SET affected_area = (
  SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Cap de Creus' AND odesignate = 'Parque Natural'
) WHERE content_hash = 'baseline_park_cap_creus';

-- Sierra de Grazalema (162 spots) — Prohibited; bivouac with authorization only
INSERT INTO legal_documents (
  source_id, title, restriction_type, affected_ccaa, confidence_tier, status,
  decree_ref, decree_articles, content_hash,
  affected_area
) VALUES (
  'baseline_parks',
  'Sierra de Grazalema: acampada prohibida; vivac solo con autorización formal',
  'overnight_ban', 'andalucia', 'verified', 'active',
  'Decreto 26/2018 (Andalucía) + Programa de Uso Público Grazalema',
  '[{"number": "Uso Público", "title": "Vivac con autorización formal (15 días hábiles)", "text_verbatim": "Acampada libre prohibida. Vivac/acampada nocturna permitida solo con autorización formal de la delegación territorial de Medio Ambiente de Cádiz, solicitada con 15 días hábiles de antelación. Debe vincularse a actividad de travesía. A >2km de cualquier pueblo o camping. No existe excepción por grupos pequeños (a diferencia de Sierra Nevada).", "legal_distinction": "autorizacion_formal_obligatoria", "max_stay_hours": null, "restrictions": ["autorizacion_15_dias_habiles", "vinculado_a_travesia", "distancia_2km_nucleos"], "exceptions": []}]',
  'baseline_park_grazalema',
  (SELECT ST_Union(ST_Transform(geom, 4326)) FROM national_parks WHERE site_name = 'Sierra de Grazalema' AND odesignate = 'Parque Natural')
);

-- ============================================================
-- SOURCE URLs — official links for user access to full normative
-- ============================================================

UPDATE legal_documents SET source_url = 'https://www.miteco.gob.es/es/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/picos-europa/guia-visitante/normas-recomendaciones.html'
WHERE content_hash = 'baseline_park_picos_europa';

UPDATE legal_documents SET source_url = 'https://www.parquenacionalsierraguadarrama.es/normativa'
WHERE content_hash = 'baseline_park_guadarrama';

UPDATE legal_documents SET source_url = 'https://www.juntadeandalucia.es/medioambiente/portal/web/venta_del_llano/detalle-buscador-702/-/asset/0NV3b0l8SnXH'
WHERE content_hash = 'baseline_park_sierra_nevada';

UPDATE legal_documents SET source_url = 'https://www.aragon.es/documents/20127/3427740/ORDESA_PRUG_202202.pdf'
WHERE content_hash = 'baseline_park_ordesa';

UPDATE legal_documents SET source_url = 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-2873'
WHERE content_hash = 'baseline_park_monfrague';

UPDATE legal_documents SET source_url = 'https://www.boe.es/buscar/doc.php?id=BOE-A-2002-13203'
WHERE content_hash = 'baseline_park_islas_atlanticas';

UPDATE legal_documents SET source_url = 'https://www.lastablasdedaimiel.com/informacion-practica/'
WHERE content_hash = 'baseline_park_tablas_daimiel';

UPDATE legal_documents SET source_url = 'https://www.boe.es/buscar/doc.php?id=BOE-A-2004-18834'
WHERE content_hash = 'baseline_park_donana';

UPDATE legal_documents SET source_url = 'https://www.boe.es/buscar/doc.php?id=BOE-A-2021-10958'
WHERE content_hash = 'baseline_park_sierra_nieves';

UPDATE legal_documents SET source_url = 'https://parcsnaturals.gencat.cat/ca/aiguestortes'
WHERE content_hash = 'baseline_park_aiguestortes';

UPDATE legal_documents SET source_url = 'https://www.miteco.gob.es/es/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/cabaneros.html'
WHERE content_hash = 'baseline_park_cabaneros';

UPDATE legal_documents SET source_url = 'https://www.boe.es/buscar/doc.php?id=BOE-A-1995-7056'
WHERE content_hash = 'baseline_park_cabrera';

UPDATE legal_documents SET source_url = 'https://www.juntadeandalucia.es/medioambiente/portal/web/venta_del_llano/detalle-buscador-702/-/asset/0NV3b0l8SnXH'
WHERE content_hash = 'baseline_park_cazorla';

UPDATE legal_documents SET source_url = 'https://bardenasreales.es/turismo/normativa-de-uso-turistico/'
WHERE content_hash = 'baseline_park_bardenas';

UPDATE legal_documents SET source_url = 'https://www.caib.es/sites/espaisnaturalsprotegits/ca/serra_de_tramuntana/'
WHERE content_hash = 'baseline_park_tramuntana';

UPDATE legal_documents SET source_url = 'https://parcsnaturals.gencat.cat/ca/garrotxa'
WHERE content_hash = 'baseline_park_garrotxa';

UPDATE legal_documents SET source_url = 'https://parcsnaturals.gencat.cat/ca/cap-creus'
WHERE content_hash = 'baseline_park_cap_creus';

UPDATE legal_documents SET source_url = 'https://www.juntadeandalucia.es/medioambiente/portal/web/venta_del_llano/detalle-buscador-702/-/asset/0NV3b0l8SnXH'
WHERE content_hash = 'baseline_park_grazalema';

COMMIT;
