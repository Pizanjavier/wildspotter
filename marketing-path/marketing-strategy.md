# WildSpotter — Estrategia de Video Vertical (TikTok + Instagram Reels)

> Target: vanlifers y overlanders en Espana. Formato: 9:16, 1080x1920, 15-30s.

---

## 1. Posicionamiento Estrategico

### El problema que nadie dice en voz alta

La comunidad vanlife en Espana tiene un enemigo silencioso: **la masificacion**. Park4night, iOverlander y los grupos de Facebook han convertido cada spot publicado en un parking masificado. El vanlifer que comparte un rinconcito virgen en redes lo destruye en 48 horas.

WildSpotter no es otra app de spots compartidos. Es un **radar** que descubre sitios que nadie ha publicado, analizando datos geograficos brutos con IA. No hay reviews, no hay fotos de usuarios, no hay "me gusta". Solo datos, terreno y probabilidades.

### Diferenciacion brutal

| Park4night / iOverlander | WildSpotter |
|--------------------------|-------------|
| Spots compartidos por usuarios | Spots descubiertos por datos + IA |
| Masificados al publicarse | Nadie los ha compartido nunca |
| Reviews subjetivas ("muy bonito") | Score objetivo: terreno, legal, satelite, contexto |
| Spots de toda Europa, pocos en rural | Cobertura completa de Espana |
| Sin info legal real | Natura 2000, Parques Nacionales, Ley de Costas, Catastro |

### Pilares de contenido

| Pilar | % | Angulo |
|-------|---|--------|
| Pain point (masificacion, multas, "the knock") | 40% | Agitar el problema, posicionar la solucion |
| Demo de producto / pipeline tech | 30% | Mostrar el radar en accion, impresionar con la tecnologia |
| Lifestyle aspiracional | 20% | Spots reales descubiertos, atardeceres, soledad |
| Educativo (legal, terreno) | 10% | Autoridad — "sabias que aparcar en Natura 2000..." |

---

## 2. Conceptos Creativos

### CONCEPTO A: "El Parking Lleno" ✅ PRODUCIDO — `src/ParkingLleno.tsx`

> **Estado:** ✅ ACTUALIZADO con video footage continuo. Archivo: `src/ParkingLleno.tsx` + escenas en `src/scenes/`. 805 frames @ 30fps ≈ 26.8s.
> Render: `npx remotion render ParkingLleno out/parking-lleno.mp4`

**Angulo psicologico:** Frustration + contrast effect. Todo vanlifer ha vivido la experiencia de conducir horas hasta un spot "secreto" de Park4night y encontrarlo lleno de furgos. Sin espacio. Cansado. Anocheciendo. WildSpotter resuelve esto de raiz: sus spots vienen de datos, no de reviews, asi que nadie los ha masificado.

**Duracion:** ~27 segundos

**Storyboard (con footage continuo):**

| Segundo | Visual | Footage de fondo | Audio/Texto |
|---------|--------|-----------------|-------------|
| 0-4.3 | HOOK: Texto "El parking de Otras apps" + "Sin hueco. Anocheciendo." | `ai_Campervan_Gathering_in_Golden_Hour.mp4` — aerial de furgos en claro costero (35% dim) | Musica cinematica |
| 4.3-9.5 | Card mock "Playa Los Genoveses" con 4.8★ y 200 reviews. "Y no cabe ni un coche." | Mismo clip campervan gathering, zoom mas cerrado (75% dim) — continuidad visual | Musica + shake |
| 9.5-15.3 | Texto: "¿Y si los mejores spots no tuvieran reviews?" con linea amber | `drone_mountains.mp4` — montanas al amanecer (55% dim) — pivote a esperanza | Silencio + glow |
| 15.3-22.6 | Phone frame con WildSpotter: scan, radar, resultados, scores 91/84/78 | `road_trip_sunset.mp4` — conduccion al atardecer (85% dim) detras del phone | SFX: radar ping |
| 22.6-26.8 | "Descubierto por datos. No por reviews." Logo + CTA | `van_in_spot_calm.mp4` — furgo en bosque tranquilo (40% dim) — la recompensa | Musica calida |

**Copy para el post (Castellano):**

> 2 horas de carretera. Llegas al spot "secreto" de Park4night.
> 15 furgos. Sin hueco. Anocheciendo.
>
> Los spots compartidos mueren cuando se publican.
>
> WildSpotter no tiene reviews ni fotos de usuarios. Es un radar que analiza terreno, satelite e info legal para descubrir spots que NADIE ha compartido.
>
> Datos, no opiniones.
>
> #vanlife #furgocamper #vidaenfurgo #espana #park4night #campinglibre #acampadalibre #overlanding #furgonetacamper #spotsecreto

**Hashtag strategy:** Mix de alto volumen (#vanlife 28M, #furgocamper 500K) con nicho espanol (#vidaenfurgo, #acampadalibre, #campinglibre). Incluir #park4night como tag "competidor" para captar busquedas de frustracion.

---

### MICRO-CLIP: "Sabias que es Natura 2000?" ✅ PRODUCIDO — `src/Natura2000Clip.tsx`

> **Estado:** ✅ ACTUALIZADO con video footage continuo. Archivo: `src/Natura2000Clip.tsx`. 482 frames @ 30fps ≈ 16.1s.
> Render: `npx remotion render Natura2000Clip out/natura2000-clip.mp4`

**Angulo psicologico:** Educativo + autoridad. Muchos vanlifers no saben que estan aparcando dentro de una zona Natura 2000. Este micro-clip revela el peligro y posiciona WildSpotter como la herramienta que lo sabe antes que tu.

**Duracion:** ~16 segundos (ampliado para transiciones mas largas)

**Storyboard (con footage continuo):**

| Segundo | Visual | Footage de fondo | Audio/Texto |
|---------|--------|-----------------|-------------|
| 0-4 | Mapa Delta del Ebro con zoom + pin amber | `Aerial_Spanish_Mediterranean_coast.mp4` — naturaleza bonita, full con 25% dark overlay | Musica tension suave |
| 4-8.7 | Zona roja Natura 2000 expandiendose + warning + "600€" | Mismo clip costero, mas oscuro (75% dim) — tension | SFX: radar ping |
| 8.7-12.3 | "Estas en una zona protegida." + respuesta WildSpotter | `police_car.mp4` dimmed (82%) — miedo | Musica tension |
| 12.3-16 | Logo WildSpotter + "Tu radar sabe lo que tu no" | `van_in_spot_calm.mp4` loop (80% dim) — solucion sutil | Musica fade out 3s |

**Copy para el post (Castellano):**

> Natura 2000 es la mayor red de espacios protegidos de Europa. En Espana cubre mas del 27% del territorio: playas, humedales, sierras, costas...
>
> Y si, puedes estar aparcando dentro sin saberlo. Multas de hasta 600€.
>
> WildSpotter cruza cada spot con datos oficiales de Natura 2000, Parques Nacionales, Ley de Costas y Catastro. Antes de que aparques.
>
> Tu radar sabe lo que tu no.
>
> #vanlife #natura2000 #vidaenfurgo #deltaebro #furgocamper #campinglibre #multacamping #acampadalibre #overlanding #espana #zonasprotegidas

**Hashtag strategy:** Educativo con geo-targeting (#deltaebro). #natura2000 y #multacamping captan busquedas de vanlifers preocupados por multas. #zonasprotegidas como hashtag de nicho para SEO.

---

### CONCEPTO B: "87 Spots y Tu No Conoces Ninguno" ✅ PRODUCIDO — `src/OchentaYSiete.tsx`

> **Estado:** ✅ ACTUALIZADO con video footage continuo. Archivo: `src/OchentaYSiete.tsx` + escenas en `src/scenes-87/`. 900 frames @ 30fps = 30.0s.
> Render: `npx remotion render OchentaYSiete out/ochenta-y-siete.mp4`

**Angulo psicologico:** Curiosity gap + social proof invertido. El espectador se siente excluido de algo que existe pero no conoce. Mimetic desire: "si hay 87, yo quiero acceso."

**Duracion:** ~29 segundos

**Storyboard (con footage continuo):**

| Segundo | Visual | Footage de fondo | Audio/Texto |
|---------|--------|-----------------|-------------|
| 0-4.7 | HOOK: "87 spots en esta zona" + counter animado + spot markers | Mapa oscuro (sin video — el mapa con dots animados ES el contenido visual) | Beat grave |
| 4.7-9.7 | "Planos. Legales. Con vistas al mar." con barras amber | `drone_mountains.mp4` (80% dim) — scenic backdrop | Beat drop suave |
| 9.7-14 | "Y no estan en ninguna app de reviews." | `road_trip_sunset.mp4` dimmed (82%) — atmosfera moody | Silencio + beat |
| 14-20.2 | Phone demo: scan, radar rings, resultados 92/85/78 | `rv_mountain_road.mp4` (85% dim) — driving sutil | SFX: radar ping |
| 20.2-26.7 | Pipeline 5 capas + score 92 en circulo verde | `coffee_camping.mp4` (90% dim) — datos son el foco | Musica crece |
| 26.7-30 | Split ARRIBA/ABAJO: crowded vs solo. "Elige." Logo + CTA | ARRIBA: `ai_Campervan_Gathering_in_Golden_Hour.mp4`, ABAJO: `van_in_spot_calm.mp4` | Drop final |

**Copy para el post (Castellano):**

> 87 spots en la costa murciana.
> Planos. Con vistas al mar. Legales.
> Y no los encontraras en ninguna app de reviews.
>
> WildSpotter es un radar. No una guia de viaje.
> Analiza terreno, satelite e info legal para descubrir lo que nadie ha compartido.
>
> Porque los mejores spots mueren cuando se publican.
>
> #vanlife #vidaenfurgo #costacalida #murcia #furgocamper #spotsecreto #campinglibre #overlanding #acampadalibre #espana

**Hashtag strategy:** Geo-targeting (#costacalida, #murcia) para algoritmo local + #spotsecreto como hashtag propio para comunidad.

---

### CONCEPTO C: "La Multa de 600 euros" ✅ PRODUCIDO — `src/LaMulta.tsx`

> **Estado:** ✅ ACTUALIZADO con video footage continuo. Archivo: `src/LaMulta.tsx`. 766 frames @ 30fps ≈ 25.5s.
> Render: `npx remotion render LaMulta out/la-multa.mp4`

**Angulo psicologico:** Fear + authority positioning. Las multas por acampar en zonas protegidas son reales (hasta 600 euros en Parque Natural, hasta 6.000 euros en Parque Nacional). Pocos vanlifers saben que estan dentro de Natura 2000. WildSpotter lo sabe.

**Duracion:** ~26 segundos (ampliado para transiciones)

**Storyboard (con footage continuo):**

| Segundo | Visual | Footage de fondo | Audio/Texto |
|---------|--------|-----------------|-------------|
| 0-4.7 | HOOK: "600€" slam rojo + "Por dormir en tu furgo." | `police_car.mp4` (75% dim) — miedo a traves de imagen | Musica suspense |
| 4.7-9.7 | Mapa Natura 2000 oficial + "27% del territorio" | `drone_forest.mp4` detras del mapa (85% dim) — naturaleza protegida | Musica tension |
| 9.7-14 | "Podrias estar aparcando en zona protegida sin saberlo" | `police_writing_ticket.mp4` (85% dim) — autoridad | Beat |
| 14-20 | Checklist legal: Natura 2000, Parques, Ley de Costas, Catastro | `Aerial_Spanish_Mediterranean_coast.mp4` (90% dim) — cards son el foco | Musica calma |
| 20-25.5 | "Cada spot con su informe legal" + Logo + CTA | `van_in_spot_calm_couple_dog_night.mp4` loop (78% dim) — payoff humano calido | Musica fade out 3s |

**Copy para el post (Castellano):**

> 600€ de multa. Por dormir en tu furgo.
>
> El 27% del territorio español es zona protegida. Y la mayoría de vanlifers no lo sabe hasta que llega la denuncia.
>
> WildSpotter cruza cada spot con 4 fuentes oficiales:
>
> 🔴 Red Natura 2000 — la mayor red de espacios protegidos de Europa. Cubre playas, humedales, sierras y costas. Multas de hasta 600€.
>
> 🟠 Parques Nacionales y Naturales — límites oficiales de parques donde la acampada libre está prohibida. Multas de hasta 6.000€ en Parque Nacional.
>
> 🔵 Ley de Costas — los primeros 100 metros desde la línea de costa son dominio público marítimo-terrestre. Aparcar o pernoctar ahí es sancionable.
>
> 🟢 Catastro — identifica si el terreno es monte público (generalmente permitido) o parcela privada (riesgo de denuncia del propietario).
>
> Todo esto lo comprobamos con datos del MITECO, el Catastro y el IGN. Sin opiniones. Sin reviews. Solo datos oficiales.
>
> Cada spot viene con su informe legal. Antes de que aparques.
>
> #vanlife #multacamping #natura2000 #vidaenfurgo #furgocamper #campinglibre #leydecostas #espana #acampadalibre #overlanding #parquenacional #zonasprotegidas #catastro

**Hashtag strategy:** Educativo + miedo. #multacamping y #leydecostas captaran busquedas de vanlifers que ya han tenido problemas o quieren evitarlos. #parquenacional y #zonasprotegidas amplian el alcance educativo.

---

### CONCEPTO D (Bonus): "El Pipeline" — Tech Flex

**Angulo psicologico:** Authority + curiosity. Mostrar la sofisticacion del pipeline (radar > terreno > satelite > legal > contexto > score) posiciona WildSpotter como algo serio, no otra app amateur. Para el segmento tech-savvy de la comunidad.

**Duracion:** 15 segundos (formato ultra-rapido)

**Storyboard (con footage continuo):**

| Segundo | Visual | Footage de fondo | Audio/Texto |
|---------|--------|-----------------|-------------|
| 0-2 | HOOK: "Como encuentra WildSpotter tus spots?" | `road_trip_sunset.mp4` (60% dim) — conduccion epica | Beat electronico |
| 2-4 | "1. RADAR" + animacion scan OpenStreetMap | Mismo clip (70% dim) | Ritmo rapido |
| 4-6 | "2. TERRENO" + pendiente visualizada | `drone_mountains.mp4` (65% dim) — terreno real | |
| 6-8 | "3. OJO SATELITE" + overlay IA | `drone_forest.mp4` (60% dim) — vista aerea real | |
| 8-10 | "4. LEGAL" + zona Natura 2000 | `drone_forest.mp4` mas oscuro (75% dim) | |
| 10-12 | "5. CONTEXTO" + scoring visual | `coffee_camping.mp4` (70% dim) — contexto real | |
| 12-15 | Score 92 + "Solo datos. Cero opiniones." Logo. | `van_in_spot_calm.mp4` (50% dim) — payoff | Drop |

**Copy para el post (Castellano):**

> 6 capas de analisis. 0 opiniones humanas.
>
> Radar > Terreno > Satelite > Legal > Contexto > Score.
>
> Asi es como WildSpotter descubre spots que no existen en ninguna app.
> Procesamos toda Espana. Datos brutos. IA. Sin reviews.
>
> #vanlife #ia #machinelearning #gis #vidaenfurgo #furgocamper #techvanlife #openstreetmap #espana

---

## 3. Calendario de Publicacion (Lanzamiento — Semanas 1-4)

### Semana 1: Agitar el Problema

| Dia | Plataforma | Contenido | Objetivo |
|-----|-----------|-----------|----------|
| Lunes | TikTok + Reels | **Concepto A "El Parking Lleno"** ✅ | Viralidad por frustracion compartida |
| Miercoles | TikTok | **Micro-clip Natura 2000** ✅ — `src/Natura2000Clip.tsx` | Autoridad |
| Viernes | Reels | **Concepto C "La Multa de 600 euros"** ✅ | Fear educativo |

### Semana 2: Revelar la Solucion

| Dia | Plataforma | Contenido | Objetivo |
|-----|-----------|-----------|----------|
| Lunes | TikTok + Reels | **Concepto B "87 Spots"** ✅ | Curiosity + desire |
| Miercoles | TikTok | BTS: "Asi se ve el backend de WildSpotter" (pantalla pipeline dashboard) | Tech credibilidad |
| Viernes | Reels | Repurpose Concepto A con variacion de hook ("Cabo de Gata. 12 furgos. Sin hueco.") | Algoritmo recompensa variaciones |

### Semana 3: Demostrar el Producto

| Dia | Plataforma | Contenido | Objetivo |
|-----|-----------|-----------|----------|
| Lunes | TikTok + Reels | **Concepto D "El Pipeline"** | Diferenciacion tech |
| Miercoles | TikTok | Screen recording real: escaneo de una zona costera, resultados reales | Proof of product |
| Viernes | Reels | "Top 3 errores al buscar spot" (gancho educativo, solucion = WildSpotter) | Engagement |

### Semana 4: Social Proof + Escalada

| Dia | Plataforma | Contenido | Objetivo |
|-----|-----------|-----------|----------|
| Lunes | TikTok + Reels | "Primer escaneo en [zona]. X spots encontrados." (resultado real) | Proof |
| Miercoles | TikTok | Respuesta a comentarios / duets con videos vanlife populares | Comunidad |
| Viernes | Reels | Compilacion: mejores spots descubiertos (visual aspiracional) | Desire |

---

## 4. Especificaciones Tecnicas

### Video

- **Formato:** 9:16 vertical, 1080x1920px
- **Duracion:** 15-30 segundos (sweet spot TikTok/Reels)
- **FPS:** 30
- **Codec:** H.264
- **Audio:** Si — musica + SFX siempre. TikTok penaliza videos sin audio.

### Texto en pantalla

- **Font datos/scores:** JetBrains Mono (coherencia con la app)
- **Font titulos/hooks:** Inter Bold o similar impactante
- **Color texto:** Blanco (#FFFFFF) con sombra sutil para legibilidad
- **Color accent:** Amber (#D97706) para highlights, CTAs
- **Safe zone:** Margen 150px arriba (username TikTok), 250px abajo (CTA/descripcion), 100px derecha (botones)

### Transiciones

- **Fades largas (16-20 frames)** entre todas las escenas — crossfade de footage a footage se siente cinematografico
- **Nunca usar slide o wipe** — se sienten a PowerPoint
- Zoom ligero (105-112%) tipo Ken Burns sobre footage de fondo para energia
- Transiciones de app: usar screen recordings reales del scan animandose

### Music & Audio Pipeline

Todo el audio (musica + SFX) se embebe directamente en el render de Remotion. Los videos se suben a TikTok/Reels con audio completo, listos para publicar sin edicion adicional.

#### Fuentes de musica (royalty-free, sin atribucion necesaria)

- **Pixabay Music** (pixabay.com/music) — gratis, licencia comercial, sin atribucion
- **Uppbeat** (uppbeat.io) — free tier con credito, buena calidad
- **Mixkit** (mixkit.co) — gratis, licencia comercial

#### Musica por concepto

| Concepto | Mood | Busqueda sugerida |
|----------|------|-------------------|
| A "El Parking Lleno" | Ironica/comica al inicio, calida al final | "quirky comedy" -> transicion a "warm acoustic" |
| B "87 Spots" | Tension minimalista, build-up epico | "dark cinematic minimal" -> "epic reveal" |
| C "La Multa" | Tension documental, resolucion calma | "suspense documentary" -> "calm resolution" |
| D "El Pipeline" | Electronica rapida, tech | "fast tech" o "electronic countdown" |

#### SFX (embebidos en Remotion)

| Sonido | Uso | Fuente |
|--------|-----|--------|
| Pulso radar / ping | Scan button, resultados apareciendo | Pixabay / Freesound.org |
| Whoosh / swoosh | Transiciones entre pantallas | Pixabay |
| Score reveal (ding positivo) | Score badge apareciendo | Pixabay |
| Stamp / sello | Concepto C — multa oficial | Freesound.org |
| UI click suave | Interacciones con la app | Pixabay |

#### Workflow de audio en Remotion

1. Descargar tracks y SFX a `public/audio/music/` y `public/audio/sfx/`
2. Usar `<Audio>` component de Remotion con `startFrom` y `volume` para timing preciso
3. Musica de fondo a ~30% volumen, SFX a 80-100%
4. Fade out musica en los ultimos 2 segundos
5. Exportar video con audio embebido — listo para subir directamente

---

## 5. Principios Psicologicos Aplicados

| Principio | Aplicacion |
|-----------|------------|
| **Frustration + contrast** | "El Parking Lleno" — dolor real y cotidiano vs. la alternativa tranquila |
| **Curiosity gap** | "87 spots y no conoces ninguno" — informacion incompleta crea tension |
| **In-group identity** | Lenguaje de la tribu vanlife: "la furgo", "el knock", "spot salvaje" |
| **Authority bias** | Pipeline de 6 capas, datos oficiales (Natura 2000, Catastro), IA |
| **Scarcity framing** | "Los mejores spots mueren cuando se publican" — urgencia de acceso |
| **Contrast effect** | Parking masificado vs. spot solitario — antes/despues visual |
| **Social proof invertido** | No usamos "10.000 usuarios". Usamos "spots que nadie conoce" — exclusividad |

---

## 6. Metricas de Exito

### KPIs por video

| Metrica | Target |
|---------|--------|
| Hook retention (3s) | >70% |
| Watch-through rate | >40% |
| Engagement rate | >8% |
| Saves | >2% (indica intencion real) |
| Profile visits | >5% |
| Link clicks (bio) | >1% |

### KPIs de campana (4 semanas)

| Metrica | Target |
|---------|--------|
| Seguidores nuevos | 2.000-5.000 |
| Waitlist signups | 500+ |
| Video >10K views | Al menos 2 |
| Video >100K views | Al menos 1 (viral) |

---

## 7. Estrategia de Video Footage

### Regla fundamental: Video continuo, nunca frames estaticos

Cada segundo de video debe tener footage real de fondo. Mezclar "escenas con video" y "escenas con fondo solido" produce efecto PowerPoint. La combinacion de footage real + overlays de texto animado + demos de app es el nivel de produccion objetivo.

### Fuentes de footage (por prioridad)

| Prioridad | Fuente | Mejor para | Coste |
|-----------|--------|------------|-------|
| 1 | **Pexels** (pexels.com) | Vanlife, naturaleza, parkings, driving | Gratis, sin atribucion |
| 2 | **AI Video Generators** (Runway Gen-3, Kling, Sora) | Shots demasiado especificos para stock | Variable |
| 3 | **Capturas de la app real** | Demos de escaneo, resultados, configuracion | Gratis (Chrome automation) |
| 4 | **CARTO map tiles** | Fondos de mapa dentro de phone frames | Gratis |

### Inventario actual de footage (`public/videos/`)

| Archivo | Duracion | Resolucion | Contenido |
|---------|----------|------------|-----------|
| `crowded_parking_aerial.mp4` | 23.9s | 1080p | Aerial de parking lleno |
| `drone_mountains.mp4` | 10s | 4K | Paisaje montanoso al amanecer |
| `road_trip_sunset.mp4` | 33.5s | 4K | Conduccion scenic al atardecer |
| `van_in_spot_calm.mp4` | 9.5s | 4K | Furgo aparcada en bosque tranquilo |
| `drone_forest.mp4` | 25.7s | 1080p | Aerial de bosque denso |
| `police_car.mp4` | 46.3s | 1080p | Coche de policia |
| `rv_mountain_road.mp4` | 16s | 720p | Autocaravana en carretera de montana |
| `rvs_parked_outdoors.mp4` | 14.2s | 1080p | Autocaravanas en naturaleza |
| `coffee_camping.mp4` | 24s | 1080p | Cafe en campamento con montanas |
| `Aerial_Spanish_Mediterranean_coast.mp4` | 59.8s | 1080p | Aerial costa mediterranea |
| `police_writing_ticket.mp4` | 13.3s | 4K | Policia escribiendo multa |
| `van_in_spot_calm_couple_dog_night.mp4` | 11.6s | 1080p | Pareja + perro + furgo, noche |
| `ai_Campervan_Gathering_in_Golden_Hour.mp4` | 8s | 720p | Aerial: VW vans apinadas en claro costero (Veo AI) |
| `ai_Spanish_Beach_VW_Van_Golden_Hour.mp4` | 8s | 720p | VW van en playa espanola (Veo AI) |
| `ai_Spanish_Countryside_Van_Video.mp4` | 8s | 720p | Van en campo espanol (Veo AI) |
| `ai_Campervan_Sunset_Time_Lapse_Video.mp4` | 8s | 720p | Time-lapse atardecer campervan (Veo AI) |

### Footage necesario por video

#### Todos los videos — ✅ COMPLETADOS con video footage continuo

Los 4 videos tienen footage real en todas las escenas. Ver la seccion de storyboards arriba para el desglose por escena.

### Mejores candidatos para generacion con IA

Estos shots son demasiado especificos para stock — ideales para Runway Gen-3, Kling 1.6 o Sora:

1. **"Drone pullback desde una VW van sola en una playa espanola al atardecer, revelando panoramica costera"** — shot payoff hero, reutilizable en varios videos
2. **"Van conduciendo por un camino de tierra estrecho entre campo espanol, polvo detras, oceano visible al frente"** — shot "viaje al spot"
3. **"POV primera persona: faros iluminando un claro en el bosque al anochecer — spot de camping perfecto"** — atmosferico y unico
4. **"Time-lapse de atardecer detras de una campervan, luces de guirnalda encendiendose mientras aparecen estrellas"** — footage de marca/CTA

### Arco narrativo a traves del footage

Cada video debe contar una historia emocional solo con las imagenes de fondo, antes de leer el texto:

```
PROBLEMA (footage estresante/agobiante)
  → ai_Campervan_Gathering_in_Golden_Hour.mp4, police_car.mp4
  
PIVOTE (naturaleza, esperanza)
  → drone_mountains.mp4, drone_forest.mp4
  
SOLUCION (demo de app)
  → road_trip_sunset.mp4 sutil, rv_mountain_road.mp4
  
RECOMPENSA (furgo sola en la naturaleza)
  → van_in_spot_calm.mp4, coffee_camping.mp4
```

---

## 8. Proximos Pasos

1. ~~**Aprobar conceptos**~~ ✅ Los 4 conceptos producidos
2. ~~**Producir en Remotion**~~ ✅ 4 composiciones renderizables
3. ~~**Descargar footage adicional**~~ ✅ Todos los clips necesarios descargados o generados con Veo AI
4. ~~**Rework con video footage**~~ ✅ Los 4 videos tienen footage continuo en todas las escenas
5. ~~**AI video generation**~~ ✅ `ai_Campervan_Gathering_in_Golden_Hour.mp4` generado con Veo — reemplaza el aerial de parking generico
6. **Grabar capturas reales de la app** — Screen recordings del scan, resultados, config para escenas demo
7. **Render final y publicar** — Semana 1 arranca con los videos listos

---

*Estrategia preparada el 2026-03-31. Actualizada el 2026-04-02 con estrategia de video footage y rework completo de los 4 videos.*
