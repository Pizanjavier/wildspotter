-- Legal baseline: CCAA tourism decree rules + priority municipalities
-- Run inside the db container:
--   docker-compose exec -T db psql -U wildspotter -d wildspotter < db/migrations/003_legal_baseline.sql
--
-- This populates the existing legal_documents table with actionable rules
-- extracted from the 17 CCAA tourism decrees, plus a priority_municipalities
-- table for targeted historical BOP backfill.

BEGIN;

-- ============================================================
-- CCAA BASELINE RULES
-- Each row = one concrete restriction extracted from the decree.
-- A single decree may yield multiple rules (camping ban + pernocta
-- exception + seasonal fire restriction, etc.)
-- ============================================================

-- Helper: register a 'baseline' source for these curated entries
INSERT INTO legal_source_state (id, name, source_type, region, url, poll_interval_hours)
VALUES ('baseline_ccaa', 'CCAA Tourism Decree Baseline (curated)', 'api', 'national', NULL, 8760)
ON CONFLICT (id) DO NOTHING;

-- Andalucía — Decreto 26/2018
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Andalucía: acampada libre prohibida fuera de campamentos autorizados', 'camping_ban', 'andalucia', 'verified', 'active',
 'Decreto 26/2018, de 23 de enero',
 '{"summary": "Prohíbe la acampada fuera de establecimientos de campamentos de turismo debidamente autorizados. No distingue explícitamente entre acampada y pernocta en vehículo.", "key_articles": ["Art. 2", "Art. 3"], "pernocta_status": "ambiguous", "max_stay_hours": null, "penalty_range_eur": "750-3000"}',
 'baseline_andalucia_camping_ban'),
('baseline_ccaa', 'Andalucía: áreas de pernocta de autocaravanas requieren autorización municipal', 'overnight_ban', 'andalucia', 'verified', 'active',
 'Decreto 26/2018, de 23 de enero',
 '{"summary": "Las áreas habilitadas para pernocta de autocaravanas requieren autorización del ayuntamiento. No existe un derecho general a pernoctar en vía pública.", "key_articles": ["Art. 28-32"], "pernocta_status": "requires_authorization", "max_stay_hours": null}',
 'baseline_andalucia_pernocta');

-- Aragón — Decreto 35/2023
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Aragón: acampada libre prohibida; pernocta en autocaravana tolerada 48h', 'camping_ban', 'aragon', 'verified', 'active',
 'Decreto 35/2023, de 5 de abril',
 '{"summary": "Prohíbe la acampada libre. Distingue pernocta en autocaravana (tolerada hasta 48h en un mismo lugar, sin desplegar elementos externos) de acampada (prohibida). El vehículo debe estar en zona donde el estacionamiento esté permitido.", "key_articles": ["Art. 2", "Art. 70-72"], "pernocta_status": "tolerated_48h", "max_stay_hours": 48, "conditions": ["sin_elementos_externos", "estacionamiento_permitido"]}',
 'baseline_aragon_camping');

-- Asturias — Decreto 61/2022
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Asturias: acampada libre prohibida; pernocta autocaravana tolerada 72h', 'camping_ban', 'asturias', 'verified', 'active',
 'Decreto 61/2022, de 23 de septiembre',
 '{"summary": "Prohíbe la acampada libre. Regula áreas de acogida de autocaravanas en tránsito. Pernocta tolerada hasta 72h sin desplegar elementos de acampada. Áreas de pernocta requieren comunicación previa a Turismo.", "key_articles": ["Art. 2", "Art. 34-41"], "pernocta_status": "tolerated_72h", "max_stay_hours": 72, "conditions": ["sin_elementos_acampada", "estacionamiento_permitido"]}',
 'baseline_asturias_camping');

-- Baleares — Ley 8/2012 + DL 3/2022
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Baleares: acampada y pernocta en vehículo estrictamente prohibidas', 'camping_ban', 'baleares', 'verified', 'active',
 'Ley 8/2012 + Decreto-ley 3/2022',
 '{"summary": "Prohíbe expresamente la acampada y la pernocta en vehículos de cualquier tipo fuera de establecimientos autorizados. Una de las normativas más restrictivas de España. Incluye autocaravanas, campers y furgonetas.", "key_articles": ["Art. 35-38"], "pernocta_status": "prohibited", "max_stay_hours": 0, "penalty_range_eur": "2001-20000", "notes": "Aplicación especialmente estricta en Mallorca e Ibiza"}',
 'baseline_baleares_camping');

-- Canarias — en tramitación (2025-2026)
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Canarias: regulación en tramitación; vacío legal parcial', 'camping_ban', 'canarias', 'verified', 'active',
 'Ley 7/1995 de Ordenación del Turismo + Reglamento en tramitación',
 '{"summary": "La Ley 7/1995 regula campamentos pero no menciona autocaravanas. Nuevo Reglamento de Alojamientos al Aire Libre en tramitación desde 2025. En la práctica, cada isla y municipio regula independientemente. Fuerteventura y Lanzarote son más restrictivos. Tenerife y Gran Canaria toleran pernocta dispersa.", "key_articles": [], "pernocta_status": "legal_vacuum", "max_stay_hours": null, "notes": "Pendiente del nuevo reglamento; aplicación municipal variable"}',
 'baseline_canarias_camping');

-- Cantabria — Ley 5/1999
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Cantabria: acampada libre prohibida; pernocta no regulada explícitamente', 'camping_ban', 'cantabria', 'verified', 'active',
 'Ley 5/1999, de 24 de marzo',
 '{"summary": "La Ley de Ordenación del Turismo prohíbe la acampada fuera de establecimientos autorizados. No menciona expresamente la pernocta en autocaravanas, dejando un vacío legal que los municipios costeros llenan con ordenanzas locales restrictivas (Santander, Castro-Urdiales, Laredo).", "key_articles": ["Art. 20-22"], "pernocta_status": "not_regulated", "max_stay_hours": null, "notes": "Municipios costeros regulan por ordenanza local"}',
 'baseline_cantabria_camping');

-- Castilla-La Mancha — Decreto 93/2006
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Castilla-La Mancha: acampada libre prohibida en suelo protegido', 'camping_ban', 'castilla_la_mancha', 'verified', 'active',
 'Decreto 93/2006, de 11 de julio',
 '{"summary": "Prohíbe la acampada en suelo protegido (parques naturales, ZEPA, LIC). Fuera de suelo protegido, la acampada libre no está expresamente prohibida a nivel autonómico. La pernocta en autocaravana se considera estacionamiento si no se despliegan elementos. Amplia tolerancia en zonas rurales del interior.", "key_articles": ["Art. 3", "Art. 5"], "pernocta_status": "tolerated", "max_stay_hours": null, "conditions": ["fuera_suelo_protegido", "sin_elementos_externos"]}',
 'baseline_castilla_la_mancha_camping');

-- Castilla y León — Decreto 168/1996
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Castilla y León: acampada libre prohibida; pernocta tolerada en zonas rurales', 'camping_ban', 'castilla_y_leon', 'verified', 'active',
 'Decreto 168/1996, de 27 de junio',
 '{"summary": "Prohíbe la acampada libre fuera de campamentos autorizados. Normativa antigua (1996) que no contempla autocaravanas. En la práctica, la pernocta en vehículo se considera estacionamiento y es ampliamente tolerada en zonas rurales. Algunas ciudades (Ávila, Segovia) tienen ordenanzas más restrictivas.", "key_articles": ["Art. 2-4"], "pernocta_status": "tolerated_de_facto", "max_stay_hours": null, "notes": "Normativa de 1996, anterior al boom de autocaravanas"}',
 'baseline_castilla_y_leon_camping');

-- Cataluña — Decreto 159/2012
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Cataluña: acampada libre prohibida; pernocta tolerada 24h fuera de zonas sensibles', 'camping_ban', 'cataluna', 'verified', 'active',
 'Decreto 159/2012, de 20 de noviembre',
 '{"summary": "Prohíbe la acampada fuera de campamentos autorizados. Distingue pernocta (dormir en vehículo sin elementos externos) de acampada. Pernocta de facto tolerada hasta 24h en zonas no sensibles. Costa Brava y Barcelona metropolitana son más restrictivos por ordenanza municipal. Parques Naturales (Aiguamolls, Delta del Ebro, Montseny) tienen prohibiciones específicas.", "key_articles": ["Art. 2", "Art. 55-57"], "pernocta_status": "tolerated_24h", "max_stay_hours": 24, "conditions": ["sin_elementos_externos", "fuera_parques_naturales"]}',
 'baseline_cataluna_camping');

-- Extremadura — Decreto 170/1999
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Extremadura: acampada libre regulada; permitida con limitaciones', 'camping_ban', 'extremadura', 'verified', 'active',
 'Decreto 170/1999, de 19 de octubre',
 '{"summary": "Una de las normativas más permisivas. Regula la acampada libre permitiéndola fuera de campamentos bajo condiciones: máximo 3 tiendas o vehículos, máximo 10 personas, máximo 3 noches, a más de 500m de campamentos y núcleos urbanos, fuera de espacios protegidos. La pernocta en autocaravana sin elementos externos no se considera acampada.", "key_articles": ["Art. 30-33"], "pernocta_status": "permitted", "max_stay_hours": 72, "max_vehicles": 3, "max_persons": 10, "min_distance_urban_m": 500, "conditions": ["fuera_espacios_protegidos", "max_3_noches"]}',
 'baseline_extremadura_camping');

-- Galicia — Decreto 144/2013
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Galicia: acampada libre prohibida; pernocta tolerada con restricciones', 'camping_ban', 'galicia', 'verified', 'active',
 'Decreto 144/2013, de 5 de septiembre',
 '{"summary": "Prohíbe la acampada fuera de campamentos autorizados. Regula áreas de autocaravanas. Pernocta en vehículo tolerada hasta 48h sin desplegar elementos. Zonas costeras (Rías Baixas, Costa da Morte) con ordenanzas municipales más restrictivas en verano. Parques Naturales (Illas Atlánticas, Fragas do Eume) con prohibición total.", "key_articles": ["Art. 2-3", "Art. 42-45"], "pernocta_status": "tolerated_48h", "max_stay_hours": 48, "conditions": ["sin_elementos_acampada", "fuera_parques_naturales"]}',
 'baseline_galicia_camping');

-- La Rioja — Decreto 10/2017
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'La Rioja: acampada libre prohibida; pernocta tolerada', 'camping_ban', 'la_rioja', 'verified', 'active',
 'Decreto 10/2017, de 17 de marzo',
 '{"summary": "Reglamento General de Turismo prohíbe la acampada libre. La pernocta en autocaravana no está regulada explícitamente; se considera estacionamiento si no se despliegan elementos. Comunidad pequeña con baja presión turística de autocaravanas; aplicación laxa.", "key_articles": ["Art. 40-42"], "pernocta_status": "tolerated_de_facto", "max_stay_hours": null}',
 'baseline_la_rioja_camping');

-- Madrid — Decreto 184/1998
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Madrid: acampada libre prohibida; control municipal estricto', 'camping_ban', 'madrid', 'verified', 'active',
 'Decreto 184/1998 + Ley 1/1999 de Ordenación del Turismo',
 '{"summary": "Prohíbe la acampada fuera de establecimientos autorizados. La Sierra de Guadarrama (Parque Nacional) tiene prohibición expresa. Municipios con ordenanzas estrictas contra pernocta en vehículo: Madrid capital, Rascafría, Navacerrada, Cercedilla. Pernocta en zonas urbanas generalmente multada.", "key_articles": ["Art. 30-32"], "pernocta_status": "restricted", "max_stay_hours": null, "notes": "Sierra de Guadarrama: prohibición total. Zonas urbanas: ordenanzas locales estrictas"}',
 'baseline_madrid_camping');

-- Murcia — Decreto 37/2011
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Murcia: acampada libre prohibida; pernocta no regulada; La Manga y costa restrictivos', 'camping_ban', 'murcia', 'verified', 'active',
 'Decreto 37/2011, de 8 de abril + Ley 11/1997',
 '{"summary": "La Ley de Turismo prohíbe la acampada fuera de establecimientos autorizados. La pernocta en autocaravana no tiene regulación específica autonómica. Municipios costeros (Cartagena, Águilas, Mazarrón, La Manga) con ordenanzas restrictivas. Interior de Murcia (Sierra Espuña, Noroeste) más tolerante.", "key_articles": ["Ley 11/1997 Art. 17-19"], "pernocta_status": "not_regulated", "max_stay_hours": null, "notes": "Costa muy restrictiva; interior tolerante"}',
 'baseline_murcia_camping');

-- Navarra — Decreto Foral 230/2011
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Navarra: acampada libre prohibida; pernocta autocaravana tolerada 48h', 'camping_ban', 'navarra', 'verified', 'active',
 'Decreto Foral 230/2011, de 26 de octubre',
 '{"summary": "Prohíbe la acampada fuera de campamentos autorizados. Regula expresamente la pernocta en autocaravana: tolerada hasta 48h en un mismo lugar, sin desplegar elementos de acampada, en zonas donde el estacionamiento esté permitido. Bardenas Reales y Selva de Irati tienen restricciones específicas.", "key_articles": ["Art. 2-3", "Art. 25-28"], "pernocta_status": "tolerated_48h", "max_stay_hours": 48, "conditions": ["sin_elementos_acampada", "estacionamiento_permitido"]}',
 'baseline_navarra_camping');

-- País Vasco — Decreto 396/2013
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'País Vasco: acampada libre prohibida; áreas de pernocta reguladas', 'camping_ban', 'pais_vasco', 'verified', 'active',
 'Decreto 396/2013, de 17 de septiembre',
 '{"summary": "Prohíbe la acampada libre. Regula expresamente áreas de pernocta de autocaravanas como categoría turística propia. La pernocta en autocaravana fuera de estas áreas es tolerada si no se despliegan elementos. Los municipios costeros (San Sebastián, Zarautz, Mundaka) tienen ordenanzas restrictivas. Bizkaia y Gipuzkoa más estrictos que Álava.", "key_articles": ["Art. 2-4", "Art. 38-43"], "pernocta_status": "tolerated", "max_stay_hours": null, "conditions": ["sin_elementos_acampada", "areas_pernocta_autorizadas_preferentes"]}',
 'baseline_pais_vasco_camping');

-- Comunitat Valenciana — Decreto 165/2010
INSERT INTO legal_documents (source_id, title, restriction_type, affected_ccaa, confidence_tier, status, decree_ref, decree_articles, content_hash) VALUES
('baseline_ccaa', 'Valencia: acampada libre prohibida; pernocta autocaravana regulada en áreas específicas', 'camping_ban', 'valencia', 'verified', 'active',
 'Decreto 165/2010, de 8 de octubre',
 '{"summary": "Prohíbe la acampada fuera de campamentos autorizados. Primer decreto español en regular explícitamente las áreas de pernocta en tránsito para autocaravanas como categoría propia. Fuera de estas áreas, la pernocta sin elementos se considera estacionamiento. Costa (Benidorm, Gandía, Dénia, Peñíscola) con ordenanzas municipales restrictivas. Interior tolerante.", "key_articles": ["Art. 2", "Art. 60-68"], "pernocta_status": "regulated", "max_stay_hours": null, "conditions": ["areas_pernocta_transito_autorizadas", "sin_elementos_acampada"]}',
 'baseline_valencia_camping');


-- ============================================================
-- PRIORITY MUNICIPALITIES for historical BOP backfill
-- Focus: coastal vanlife hotspots + national park gateways
-- ============================================================

CREATE TABLE IF NOT EXISTS priority_municipalities (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR NOT NULL,
    provincia       VARCHAR NOT NULL,
    ccaa            VARCHAR NOT NULL,
    category        VARCHAR NOT NULL CHECK (category IN ('coastal_hotspot', 'park_gateway', 'island', 'mountain', 'inland_hotspot')),
    priority        INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
    backfill_status VARCHAR NOT NULL DEFAULT 'pending' CHECK (backfill_status IN ('pending', 'in_progress', 'done', 'no_data')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_priority_muni_status ON priority_municipalities (backfill_status, priority);

-- Priority 1 = known vanlife enforcement problems, high traffic
-- Priority 2 = popular but less enforcement
-- Priority 3 = moderate traffic, good to have

-- ANDALUCÍA (Mediterranean + Atlantic coast)
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('Tarifa', 'Cádiz', 'andalucia', 'coastal_hotspot', 1, 'Top vanlife destination; active enforcement; multiple ordenanzas'),
('Conil de la Frontera', 'Cádiz', 'andalucia', 'coastal_hotspot', 1, 'Heavy summer enforcement; camping ban signs'),
('Barbate', 'Cádiz', 'andalucia', 'coastal_hotspot', 1, 'Caños de Meca area; Parque Natural Breña y Marismas'),
('Zahara de los Atunes', 'Cádiz', 'andalucia', 'coastal_hotspot', 1, 'Playa de los Alemanes; enforcement increasing'),
('Bolonia', 'Cádiz', 'andalucia', 'coastal_hotspot', 1, 'Playa de Bolonia; Conjunto Arqueológico Baelo Claudia'),
('Nerja', 'Málaga', 'andalucia', 'coastal_hotspot', 2, 'Eastern Costa del Sol; Maro cliffs'),
('Mojácar', 'Almería', 'andalucia', 'coastal_hotspot', 2, 'Playa del Sombrerico; Cabo de Gata gateway'),
('Níjar', 'Almería', 'andalucia', 'park_gateway', 1, 'Cabo de Gata-Níjar Natural Park; Las Negras, San José'),
('Carboneras', 'Almería', 'andalucia', 'park_gateway', 1, 'Cabo de Gata north coast; Playa de los Muertos'),
('El Ejido', 'Almería', 'andalucia', 'coastal_hotspot', 3, 'Almerimar port area'),
('Salobreña', 'Granada', 'andalucia', 'coastal_hotspot', 2, 'Costa Tropical'),
('Aracena', 'Huelva', 'andalucia', 'park_gateway', 2, 'Sierra de Aracena y Picos de Aroche'),
('Cazorla', 'Jaén', 'andalucia', 'park_gateway', 1, 'Sierras de Cazorla, Segura y Las Villas Natural Park');

-- VALENCIA
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('Dénia', 'Alicante', 'valencia', 'coastal_hotspot', 1, 'Les Marines area; heavy enforcement'),
('Jávea/Xàbia', 'Alicante', 'valencia', 'coastal_hotspot', 1, 'Cabo de la Nao; Portitxol; active parking bans'),
('Calpe/Calp', 'Alicante', 'valencia', 'coastal_hotspot', 2, 'Peñón de Ifach; tourism pressure'),
('Altea', 'Alicante', 'valencia', 'coastal_hotspot', 2, 'Sierra de Bernia access'),
('Peñíscola', 'Castellón', 'valencia', 'coastal_hotspot', 1, 'Summer parking bans; high enforcement'),
('Oropesa del Mar', 'Castellón', 'valencia', 'coastal_hotspot', 2, 'Marina DOr area'),
('Cullera', 'Valencia', 'valencia', 'coastal_hotspot', 2, 'Faro de Cullera; Estany de Cullera');

-- CATALUÑA
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('Cadaqués', 'Girona', 'cataluna', 'coastal_hotspot', 1, 'Cap de Creus; parking muy limitado; ordenanza estricta'),
('Roses', 'Girona', 'cataluna', 'coastal_hotspot', 2, 'Aiguamolls del Empordà gateway'),
('Tossa de Mar', 'Girona', 'cataluna', 'coastal_hotspot', 2, 'Costa Brava; summer enforcement'),
('Begur', 'Girona', 'cataluna', 'coastal_hotspot', 1, 'Calas paradisíacas; parking muy restringido'),
('Palafrugell', 'Girona', 'cataluna', 'coastal_hotspot', 1, 'Calella, Llafranc, Tamariu; enforcement activa'),
('Sitges', 'Barcelona', 'cataluna', 'coastal_hotspot', 2, 'Garraf coast'),
('Espot', 'Lleida', 'cataluna', 'park_gateway', 1, 'Aigüestortes i Estany de Sant Maurici'),
('Vielha', 'Lleida', 'cataluna', 'mountain', 2, 'Val d''Aran');

-- GALICIA
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('Fisterra', 'A Coruña', 'galicia', 'coastal_hotspot', 1, 'Fin del Camino; Costa da Morte; popular overnight spot'),
('Carnota', 'A Coruña', 'galicia', 'coastal_hotspot', 2, 'Playa de Carnota; longest beach in Galicia'),
('Sanxenxo', 'Pontevedra', 'galicia', 'coastal_hotspot', 1, 'Rías Baixas hub; heavy summer enforcement'),
('O Grove', 'Pontevedra', 'galicia', 'coastal_hotspot', 2, 'A Lanzada beach; shellfish festivals'),
('Bueu', 'Pontevedra', 'galicia', 'island', 1, 'Illas Cíes ferry; Parque Nacional Illas Atlánticas'),
('Baiona', 'Pontevedra', 'galicia', 'coastal_hotspot', 2, 'Monte Real; ría de Vigo'),
('Viveiro', 'Lugo', 'galicia', 'coastal_hotspot', 2, 'Praia de Covas; Rías Altas'),
('Ribadeo', 'Lugo', 'galicia', 'coastal_hotspot', 1, 'Praia das Catedrais; control de acceso');

-- CANTABRIA + ASTURIAS
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('Laredo', 'Cantabria', 'cantabria', 'coastal_hotspot', 1, 'Playa de la Salvé; ordenanza contra pernocta'),
('Castro-Urdiales', 'Cantabria', 'cantabria', 'coastal_hotspot', 2, 'Costa oriental; presión urbanística'),
('San Vicente de la Barquera', 'Cantabria', 'cantabria', 'coastal_hotspot', 1, 'Picos de Europa gateway; surf spot'),
('Potes', 'Cantabria', 'cantabria', 'park_gateway', 1, 'Picos de Europa; parking muy limitado en verano'),
('Llanes', 'Asturias', 'asturias', 'coastal_hotspot', 1, 'Playas: Torimbia, Gulpiyuri, Ballota; enforcement'),
('Cudillero', 'Asturias', 'asturias', 'coastal_hotspot', 2, 'Puerto; Costa Verde'),
('Cangas de Onís', 'Asturias', 'asturias', 'park_gateway', 1, 'Picos de Europa; Lagos de Covadonga; parking regulado');

-- PAÍS VASCO
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('Mundaka', 'Bizkaia', 'pais_vasco', 'coastal_hotspot', 1, 'Reserva de la Biosfera de Urdaibai; surf; enforcement'),
('Zarautz', 'Gipuzkoa', 'pais_vasco', 'coastal_hotspot', 1, 'Playa larga; vanlife hub; multas activas'),
('Getaria', 'Gipuzkoa', 'pais_vasco', 'coastal_hotspot', 2, 'Gastronomía; costa de flysch'),
('Laguardia', 'Araba/Álava', 'pais_vasco', 'inland_hotspot', 2, 'Rioja Alavesa; enoturismo');

-- CANARIAS
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('La Oliva', 'Las Palmas', 'canarias', 'island', 1, 'Corralejo/El Cotillo; Fuerteventura north; heavy enforcement'),
('Pájara', 'Las Palmas', 'canarias', 'island', 1, 'Costa Calma/Jandía; Fuerteventura south'),
('Teguise', 'Las Palmas', 'canarias', 'island', 1, 'Famara; Lanzarote; control activo'),
('Yaiza', 'Las Palmas', 'canarias', 'island', 1, 'Papagayo; Lanzarote sur; multas frecuentes'),
('San Bartolomé de Tirajana', 'Las Palmas', 'canarias', 'island', 2, 'Maspalomas; Gran Canaria sur'),
('Adeje', 'Santa Cruz de Tenerife', 'canarias', 'island', 2, 'Tenerife sur; playa'),
('Granadilla de Abona', 'Santa Cruz de Tenerife', 'canarias', 'island', 2, 'El Médano; windsurf; vanlife popular'),
('Valle Gran Rey', 'Santa Cruz de Tenerife', 'canarias', 'island', 1, 'La Gomera; legendario entre vanlifers; enforcement creciente');

-- BALEARES
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('Alcúdia', 'Baleares', 'baleares', 'island', 1, 'Mallorca norte; enforcement muy estricta'),
('Artà', 'Baleares', 'baleares', 'island', 1, 'Cala Torta, Cala Mesquida; Mallorca este'),
('Sant Josep de sa Talaia', 'Baleares', 'baleares', 'island', 1, 'Ibiza; Cala d''Hort, Ses Salines; multas >2000€');

-- NAVARRA + ARAGÓN (mountain)
INSERT INTO priority_municipalities (nombre, provincia, ccaa, category, priority, notes) VALUES
('Isaba', 'Navarra', 'navarra', 'mountain', 2, 'Valle del Roncal; Selva de Irati gateway'),
('Ochagavía', 'Navarra', 'navarra', 'mountain', 2, 'Selva de Irati; pernocta popular'),
('Torla-Ordesa', 'Huesca', 'aragon', 'park_gateway', 1, 'Ordesa y Monte Perdido; parking regulado; lanzadera'),
('Benasque', 'Huesca', 'aragon', 'mountain', 1, 'Posets-Maladeta; Aneto; vanlife hub de montaña'),
('Aínsa', 'Huesca', 'aragon', 'mountain', 2, 'Sobrarbe; cañones y Sierra de Guara');

-- Transform decree_articles from summary format to frontend DecreeArticle[] array
UPDATE legal_documents
SET decree_articles = jsonb_build_array(jsonb_build_object(
  'number', COALESCE(decree_articles->>'key_articles', 'Art. s/n'),
  'title', CASE decree_articles->>'pernocta_status'
    WHEN 'prohibited' THEN 'Pernocta prohibida'
    WHEN 'ambiguous' THEN 'Pernocta: normativa ambigua'
    WHEN 'requires_authorization' THEN 'Pernocta requiere autorización'
    WHEN 'tolerated_48h' THEN 'Pernocta tolerada (48h)'
    WHEN 'tolerated_72h' THEN 'Pernocta tolerada (72h)'
    WHEN 'tolerated_24h' THEN 'Pernocta tolerada (24h)'
    WHEN 'permitted_conditions' THEN 'Pernocta/acampada permitida con condiciones'
    ELSE 'Normativa de acampada/pernocta'
  END,
  'text_verbatim', COALESCE(decree_articles->>'summary', ''),
  'legal_distinction', CASE
    WHEN decree_articles->>'pernocta_status' IN ('tolerated_48h','tolerated_72h','tolerated_24h','permitted_conditions')
    THEN 'estacionamiento_vs_acampada'
    ELSE null
  END,
  'max_stay_hours', (decree_articles->>'max_stay_hours')::int,
  'restrictions', COALESCE(decree_articles->'conditions', '[]'::jsonb),
  'exceptions', '[]'::jsonb
))
WHERE source_id = 'baseline_ccaa'
  AND decree_articles IS NOT NULL
  AND jsonb_typeof(decree_articles) = 'object';

COMMIT;
