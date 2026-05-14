# WildSpotter — Estrategia de Contenido V3 (Semanas 5-6)

> Continuacion de `marketing-strategy-v2.md`. Basada en el audit de abril 2026 (`audit-social-april-2026.md`).
>
> **Cambio clave V3:** La estrategia pivota de "mostrar spots" a **"misterio como producto"**. No podemos revelar ubicaciones exactas (contradice el anti-masificacion) ni ir a spots para fotos (limitacion actual). Todo el contenido se construye sobre **datos ocultos, paisajes tipo y la tension entre mostrar y proteger**.
>
> **Reemplaza el plan V2 semana 4 (28 Abr — 4 May).** El contenido V2 de semana 3 (21-27 Abr) ya publicado se mantiene. Los conceptos V2 no publicados de semana 4 quedan deprioritizados — se pueden usar como relleno o reposts si es necesario.
>
> **Pipeline V4 (vigente):** 7 capas: Radar > Terreno > Legal > Satelite > Contexto > Uso del Suelo > Puntuacion. Formula: `Terreno x 10% + IA x 55% + Contexto x 15% + bonus_salvaje - penalizacion_suelo`.
>
> **Datos reales del pipeline:** 83.006 spots procesados en toda Espana. 393 con score >= 70. 41 con score >= 80. Media: 21.7.
>
> **Destino de todos los CTAs:** `wildspotter.app` — Gratis en iOS y Android.

---

## 1. Diagnostico del Audit (Abril 2026)

### Lo que funciona

- Contenido educativo legal (Natura 2000, multas) genera saves
- Tono confrontacional (gatekeeping) genera comentarios
- Datos reales del pipeline (83.006) generan autoridad
- Videos cinematicos (LasCoordenadas, ElPrimerCafe) se guardan

### Lo que hay que cambiar

| Problema | Solucion V3 |
|----------|-------------|
| 35% del contenido es tech — demasiado para audiencia general | Bajar a 15%. Subir misterio/dato al 50% |
| Feed visual monotono (mismo template dark + amber overlay) | Introducir carousels educativos como formato nuevo |
| No hay CTA de "envia esto a un amigo" | Optimizar para DM shares (senal #1 de Instagram) |
| Copys largos con muchos datos | Copys cortos con hook + mystery + CTA pregunta |
| Falta interaccion en Stories | Anadir polls, quizzes y countdowns diarios |

### Mix de contenido V3

| Pilar | % | Descripcion |
|-------|---|-------------|
| **Misterio / dato tease** | 50% | Teasear datos sin revelar ubicacion. "Un spot con score 94 a 200m del mar. ¿Donde?" |
| **Emocion / aspiracional** | 25% | Lifestyle vanlife con footage de stock. El sueno, no el spot |
| **Educacion legal + pipeline** | 25% | Carousels educativos, zonas legales, como funciona el score |

---

## 2. Formatos V3

### Formato nuevo: Carousels educativos (Remotion Still)

Carousels de 5-9 slides renderizados como PNG con `npx remotion still`. Componente reusable: `src/CarouselSlide.tsx`. Temas disponibles: `legal` (rojo), `pipeline` (cyan), `scoring` (verde), `mystery` (amber).

**Carousels registrados en Root.tsx:**

| Carousel | ID prefix | Slides | Tema |
|----------|-----------|--------|------|
| 5 Zonas Donde NO Puedes Aparcar | `Carousel-Legal-*` | 6 | legal |
| 7 Capas de Analisis por Spot | `Carousel-Pipeline-*` | 9 | pipeline |
| Como Se Calcula Tu Score | `Carousel-Scoring-*` | 6 | scoring |
| Datos vs Reviews | `Carousel-Mystery-*` | 5 | mystery |

**Render:**
```bash
# Renderizar todas las slides de un carousel
for i in $(seq 1 6); do npx remotion still Carousel-Legal-$i --image-format=png out/carousel-legal-$i.png; done
for i in $(seq 1 9); do npx remotion still Carousel-Pipeline-$i --image-format=png out/carousel-pipeline-$i.png; done
for i in $(seq 1 6); do npx remotion still Carousel-Scoring-$i --image-format=png out/carousel-scoring-$i.png; done
for i in $(seq 1 5); do npx remotion still Carousel-Mystery-$i --image-format=png out/carousel-mystery-$i.png; done
```

**Por que carousels:**
- Instagram: 2x mas saves que Reels. Saves = segunda senal mas importante
- Deslizar = tiempo en post = senal de engagement
- Audio en carousels los distribuye al feed de Reels tambien

### Videos (reutilizacion de V1/V2 + nuevas variaciones)

Los mejores conceptos de V1-V2 se reutilizan en la plataforma opuesta o con copy nuevo:
- Repost de los videos con mejor engagement en la plataforma donde no se publicaron
- Nuevas variaciones de hook para conceptos que funcionaron

### Stories diarias

Formato de engagement puro. No growth, pero sube el ranking de tu contenido en el feed de seguidores.

| Tipo | Frecuencia | Objetivo |
|------|------------|----------|
| Poll vanlife | 3x/semana | "¿Costa o montana este fin de semana?" |
| Quiz legal | 2x/semana | "¿Puedes aparcar aqui? ✓/✗" con foto de stock |
| Countdown | 1x/semana | "Nuevo carousel manana" |
| Behind the scenes | 2x/semana | Screenshots de datos del pipeline (borrosos/parciales) |

---

## 3. Formula "Misterio Como Producto"

Cada post de tipo "misterio/dato" sigue esta estructura:

```
1. DATO CONCRETO — Un numero o metrica real del pipeline
2. TIPO DE PAISAJE — Costa, montana, bosque, embalse (sin ubicacion)
3. DETALLE QUE ENGANCHA — Un sub-score, una capa legal, un dato de contexto
4. RETENCION — "¿Donde crees que esta?" / "Solo el radar lo sabe"
5. CTA — Pregunta para comentarios + link en bio
```

**Ejemplo:**
```
Score: 91/100.
A 300m de una playa sin nombre.
0 edificios en 500m. Pendiente: 2.3%.
Vegetacion esclerofila. Zona NO protegida.

¿Donde crees que esta?

Gratis en iOS y Android -> link en bio
```

**Reglas del misterio:**
- NUNCA revelar coordenadas, nombre del municipio, ni provincia especifica
- SI mostrar: tipo de paisaje, scores, sub-scores, datos legales (verde/rojo), tipo de terreno
- Footage de stock del tipo de paisaje (costa generica, montana generica), nunca del spot real
- Datos borrosos/pixelados del mapa como imagen de fondo en Stories

---

## 4. Conceptos Creativos V3

### CONCEPTO M: "El Radar Encontro Algo" (mystery reveal)

**Formato:** Reel 15-20s + foto stock del tipo de paisaje
**Angulo:** Misterio puro. Solo datos, nunca la ubicacion. El espectador se pregunta "¿donde es?"

**Storyboard:**
| Seg | Visual | Texto |
|-----|--------|-------|
| 0-4 | Pantalla negra + numero animado | "Score: 91/100" |
| 4-8 | Footage stock de playa solitaria | "300m de una playa. 0 edificios. 2.3% pendiente." |
| 8-12 | Datos borrosos del mapa como fondo | "Vegetacion esclerofila. Zona no protegida." |
| 12-16 | Logo + "¿Donde crees que esta?" | CTA: Link en bio |

**Variaciones:**
- **M1:** Spot costero (playa, score alto)
- **M2:** Spot de montana (bosque, embalse)
- **M3:** Spot de interior (meseta, olivar limpio)

---

### CONCEPTO N: "Lo Que No Ves en Otras Apps" (comparison sin nombrar)

**Formato:** Carousel 5 slides (Remotion Still — tema mystery)
**Angulo:** Comparacion entre lo que ofrecen "las apps de reviews" vs datos reales. Sin nombrar competidores.

Ya registrado como `Carousel-Mystery-*` en Root.tsx.

---

### CONCEPTO O: "Quiz Legal" (engagement bait educativo)

**Formato:** Reel 12-15s tipo "respuesta rapida"
**Angulo:** "¿Puedes aparcar aqui?" con foto stock + reveal de la respuesta con datos legales.

**Storyboard:**
| Seg | Visual | Texto |
|-----|--------|-------|
| 0-3 | Foto stock de spot atractivo | "¿Puedes aparcar aqui?" |
| 3-5 | Pausa dramatica | Countdown 3-2-1 |
| 5-10 | Overlay rojo/verde segun respuesta | "Natura 2000. Multa de hasta 600€." o "Zona libre. Score: 78." |
| 10-13 | Logo + CTA | "WildSpotter te lo dice antes de llegar." |

**Variaciones:**
- **O1:** Spot en zona Natura 2000 (respuesta: NO)
- **O2:** Spot en zona libre con score alto (respuesta: SI)
- **O3:** Spot en Ley de Costas (respuesta: DEPENDE)

---

### CONCEPTO P: "7 Capas" (carousel educativo pipeline)

**Formato:** Carousel 9 slides (Remotion Still — tema pipeline)
**Angulo:** Educativo. Explica las 7 capas del pipeline V4 con datos reales.

Ya registrado como `Carousel-Pipeline-*` en Root.tsx.

---

### CONCEPTO Q: "La Puntuacion" (carousel scoring)

**Formato:** Carousel 6 slides (Remotion Still — tema scoring)
**Angulo:** Como se calcula el score. IA 55%, Contexto 15%, Terreno 10%, bonus/penalizaciones.

Ya registrado como `Carousel-Scoring-*` en Root.tsx.

---

### CONCEPTO R: "5 Zonas" (carousel legal)

**Formato:** Carousel 6 slides (Remotion Still — tema legal)
**Angulo:** Las 5 zonas donde NO puedes aparcar en Espana. Educativo, alto save rate.

Ya registrado como `Carousel-Legal-*` en Root.tsx.

---

## 5. Calendario de Publicacion V3 (Semanas 5-6)

> **Ritmo:** 1 post/dia (bajar de 2 para mejorar calidad y evitar supresion algoritmica).
> **Stories:** 2-3 diarias (polls, quizzes, behind-the-scenes).
> **Regla:** Carousels los miercoles (dia de mas saves). Videos los lunes y viernes (dias de mas reach en Reels).

### Semana 5 (Lun 27 Abr — Dom 3 May)

> Reemplaza el plan V2 semana 4. Los conceptos V2 no publicados (NB3, I2, PC3, K2, E3, reposts) quedan como reserva.

| Dia | Publicacion | Formato | Plataforma | Stories |
|-----|-------------|---------|------------|---------|
| Lun 27 | **R "5 Zonas Donde NO Puedes Aparcar"** | Carousel 6 slides | IG + TT | Poll: "¿Costa o montana?" |
| Mar 28 | **M1 "El Radar Encontro Algo" (costa)** | Reel 15s | IG + TT | Quiz: "¿Sabes que es Natura 2000?" |
| Mie 29 | **P "7 Capas de Analisis"** | Carousel 9 slides | IG + TT | Behind the scenes: captura borrosa del pipeline |
| Jue 30 | **O1 "¿Puedes Aparcar Aqui?" (Natura)** | Reel 12s | TT + IG | Countdown: "Manana nuevo dato" |
| Vie 1 | **M2 "El Radar Encontro Algo" (montana)** | Reel 15s | TT + IG | Poll: "¿Bosque o playa?" |
| Sab 2 | **Repost mejor video sem 3** | Reel | Plataforma opuesta | — |
| Dom 3 | **Q "Como Se Calcula Tu Score"** | Carousel 6 slides | IG + TT | Quiz: "¿Que pesa mas: terreno o IA?" |

### Semana 6 (Lun 4 May — Dom 10 May)

| Dia | Publicacion | Formato | Plataforma | Stories |
|-----|-------------|---------|------------|---------|
| Lun 4 | **M3 "El Radar Encontro Algo" (interior)** | Reel 15s | IG + TT | Poll: "¿Meseta o costa?" |
| Mar 5 | **N "Datos vs Reviews"** | Carousel 5 slides | IG + TT | Behind the scenes: sub-scores reales (borrosos) |
| Mie 6 | **O2 "¿Puedes Aparcar?" (zona libre)** | Reel 12s | TT + IG | Quiz: "¿Que es la Ley de Costas?" |
| Jue 7 | **E1 "Las Coordenadas" (repost)** | Reel 22s | Plataforma opuesta | Countdown: "Nuevo dato manana" |
| Vie 8 | **O3 "¿Puedes Aparcar?" (Ley de Costas)** | Reel 12s | TT + IG | Poll: "¿Alguna vez te han multado?" |
| Sab 9 | **K1 "Gatekeeping" (repost variacion)** | Reel 18s | Plataforma opuesta | — |
| Dom 10 | **Repost mejor carousel de sem 5** | Carousel | IG | Quiz: "¿Cuantas capas tiene el pipeline?" |

---

## 6. Tacticas de Engagement V3

### Optimizar para DM shares (senal #1 Instagram)

- Terminar copys con "Enviale esto a tu copiloto"
- Contenido "yo tambien" — situaciones que el vanlifer reconoce y comparte
- Quiz legal — "Mandale esto a tu amigo que aparca en cualquier sitio"

### Regla 5-3-1 (diaria, 15 min)

- 5 cuentas pequenas vanlife: comentar con valor (no "bonita foto")
- 3 cuentas medianas: responder stories, reaccionar
- 1 cuenta grande: comentario temprano en su ultimo post

### Respuesta a comentarios

- Responder TODOS en la primera hora post-publicacion
- "¿Donde es?" → "El radar te lo dice 😏 link en bio"
- Debates de gatekeeping → participar genuinamente, sin ponerse a la defensiva

---

## 7. KPIs V3 (Semanas 5-6)

| Metrica | Objetivo sem 5 | Objetivo sem 6 |
|---------|----------------|----------------|
| Seguidores IG | +50 | +80 |
| Engagement rate posts | >3% | >4% |
| Saves por carousel | >15 | >25 |
| DM shares por post | >5 | >10 |
| Comentarios por post | >8 | >12 |
| Profile visits / semana | >200 | >300 |

---

## 8. Assets Necesarios V3

### Carousels (Remotion Still — ya registrados)

Renderizar con `npx remotion still`:
- `Carousel-Legal-1` a `Carousel-Legal-6` (6 PNGs)
- `Carousel-Pipeline-1` a `Carousel-Pipeline-9` (9 PNGs)
- `Carousel-Scoring-1` a `Carousel-Scoring-6` (6 PNGs)
- `Carousel-Mystery-1` a `Carousel-Mystery-5` (5 PNGs)

### Videos nuevos (Concepto M, O)

Necesitan componentes Remotion nuevos:
- `src/ElRadarEncontro.tsx` — Concepto M (mystery reveal)
- `src/QuizLegal.tsx` — Concepto O (quiz legal)

Estos se producen cuando se priorice la produccion de video para semanas 5-6.

### Footage stock adicional

| Asset | Uso | Fuente |
|-------|-----|--------|
| Playa solitaria generica (NO spot real) | Concepto M1, O2 | Pexels |
| Montana/bosque generico espanol | Concepto M2 | Pexels |
| Meseta/interior Espana | Concepto M3 | Pexels |
| Spot atractivo para quiz (3 fotos distintas) | Concepto O1/O2/O3 | Pexels |

---

*Estrategia V3 creada el 2026-04-27. Cubre semanas 5-6 (27 Abr — 10 May 2026). Reemplaza plan V2 semana 4.*
