# WildSpotter — Estrategia de Video V2 (Semanas 3-4)

> Continuacion de `marketing-strategy.md`. Todas las definiciones, targets y KPIs del documento original siguen vigentes.
>
> **Problema con V1:** Los 5 conceptos (A-E) se sienten como "el mismo anuncio con distinto texto". Mismo template visual (fondo dimmed + overlay de texto + amber accent), mismo arco emocional (problema -> solucion -> CTA), mismos mensajes repetidos ("datos no opiniones", "spots que nadie ha compartido", "radar no reviews"). El feed se ve monotono.
>
> **Objetivo V2:** Romper la monotonia con **formatos visuales distintos**, **angulos narrativos nuevos**, y **audio variado** (narracion IA, audio trending, tracks instrumentales). Cada concepto debe sentirse como un video diferente, no como una variacion del mismo template.
>
> **Destino de todos los CTAs: `wildspotter.app`** (waitlist landing page)
>
> **Pipeline V4 (vigente):** 7 capas: Radar > Terreno > Legal > Satelite > Contexto > Uso del Suelo > Puntuacion. Formula: `Terreno x 10% + IA x 55% + Contexto x 15% + bonus_salvaje - penalizacion_suelo`.
>
> **Datos reales del pipeline:** 83.006 spots procesados en toda Espana. 393 con score >= 70. 41 con score >= 80. Media: 21.7 (la mayoria del territorio no es apto — eso es la gracia del filtro).

---

## 1. Que Cambia en V2

### Formatos visuales nuevos (no repetir el template V1)

V1 usaba un unico patron visual: `TransitionSeries` de escenas con video de fondo dimmed + texto animado encima. Todos los videos se ven igual en el feed.

V2 introduce **6 formatos distintos** que Remotion puede producir:

| Formato | Descripcion | Diferencia vs V1 |
|---------|-------------|-------------------|
| **Screen Recording** | Grabacion real de la app con overlay minimo | Sin Remotion chrome — parece nativo de TikTok |
| **Texto Nativo TikTok** | Footage a pantalla completa + texto estilo TikTok (grande, centrado, stroke negro) | Sin cards ni paneles slate — estilo creator |
| **Dato Hero** | Un solo numero/dato gigante como protagonista, minimalismo extremo | Fondo casi negro, tipografia masiva, sin footage |
| **Mapa Interactivo** | Tiles CARTO reales como hero + datos apareciendo encima | Mapa es el contenido, no un fondo |
| **Before/After Vertical** | Split top/bottom a pantalla completa con footage real | Sin dimming, footage al 100% de saturacion |
| **Cinematic Narrado** | Footage hero a pantalla completa + voz IA narrando, casi sin texto | Ritmo lento, cinematico, anti-TikTok |

### Audio: 3 fuentes distintas

| Tipo | Cuando usar | Notas |
|------|-------------|-------|
| **Narracion IA** | Videos cinematicos, educativos, slogan | Generar con ElevenLabs o similar. Voz masculina, castellano neutro, tono documental. Archivo en `public/audio/narration/` |
| **Audio trending TikTok** | Videos nativos, POV, controversia | Elegir audio trending del momento. No se embebe en Remotion — se sube mudo y se anade el audio en TikTok/IG directamente |
| **Track instrumental MP3** | Videos tech, datos, split-screen | Tracks nuevos de Mixkit/Pixabay, distintos a los de V1 |

### Pilares de contenido V2 (rotacion)

| Pilar | % | Diferencia vs V1 |
|-------|---|-------------------|
| **Spots reales** (showcase de datos reales + satelite) | 30% | NUEVO — V1 no mostraba spots reales, solo conceptos abstractos |
| **App en accion** (screen recordings) | 25% | NUEVO — V1 usaba mocks, no la app real |
| **Emocional / aspiracional** | 20% | V1 tenia 20% lifestyle pero siempre con el mismo template |
| **Controversia / engagement** | 15% | NUEVO — gatekeeping, debate, preguntas |
| **Tech / educativo** | 10% | Mantener pero con formato "Dato Hero", no repetir pipeline |

---

## 2. Conceptos Creativos V2

### CONCEPTO E: "Las Coordenadas Son Tuyas"

> **Slogan:** "Nosotros calculamos las coordenadas. La historia es tuya."
> **Archivo:** `src/LasCoordenadas.tsx`

**Formato:** Cinematic Narrado (footage hero + voz IA)

**Angulo psicologico:** Empoderamiento + libertad. No vendemos una app — vendemos la posibilidad de escribir tu propia historia. El espectador se imagina llegando a un sitio que nadie conoce. Es el video mas emocional de la serie.

**Audio:** Narracion IA en castellano + track instrumental suave de fondo. `marketing-path/public/audio/narration/LasCoordenadas-narration.mp3`

**Narracion IA (guion completo):**
```
"Hay sitios que no aparecen en ninguna guia.
Playas sin nombre. Caminos que no llevan a ningun pueblo.
Rincones donde el unico ruido es el viento.

Nosotros calculamos las coordenadas.
La historia es tuya."
```

**Duracion:** ~22 segundos (660 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Footage | Audio |
|---------|--------|---------|-------|
| 0-5 | Pantalla completa, sin texto. Solo footage. | `ai_Van_Arriving_Empty_Coastal_Spot.mp4` — furgo llegando a un claro costero vacio | Narracion: "Hay sitios que no aparecen en ninguna guia." + musica suave |
| 5-10 | Sigue sin texto. Footage cambia. | `drone_mountains.mp4` — montanas al amanecer, lento | Narracion: "Playas sin nombre. Caminos que no llevan a ningun pueblo." |
| 10-14 | Sigue sin texto. | `ai_Stars_Timelapse_Van_Night.mp4` — timelapse estrellas con furgo | Narracion: "Rincones donde el unico ruido es el viento." |
| 14-18 | Aparece texto: "Nosotros calculamos las coordenadas." en blanco, tipografia grande | `ai_Spanish_Beach_VW_Van_Golden_Hour.mp4` — furgo en playa dorada | Narracion: "Nosotros calculamos las coordenadas." |
| 18-22 | Texto cambia a: "La historia es tuya." + logo WildSpotter pequeño abajo + wildspotter.app | `van_in_spot_calm_couple_dog_night.mp4` — pareja con perro, noche, luces | Narracion: "La historia es tuya." + musica fade out |

**Variaciones de hook (3):**
- **E1:** Empieza con `ai_Van_Arriving_Empty_Coastal_Spot.mp4` (costa)
- **E2:** Empieza con `ai_Stars_Timelapse_Van_Night.mp4` (noche/estrellas)
- **E3:** Empieza con `coffee_camping.mp4` (cafe en montanas)

**Diferencia visual vs V1:** Sin paneles slate, sin amber accent, sin cards. Solo footage al 100% de saturacion con tipografia blanca limpia. El video parece un trailer, no un anuncio.

**Copy para post:**
```
Nosotros calculamos las coordenadas.
La historia es tuya.

WildSpotter procesa terreno, satelite, datos legales y uso del suelo de toda Espana para descubrir spots que no estan en ninguna app.

Tu solo tienes que llegar.

Early access -> link en bio

#vanlife #vidaenfurgo #libertad #espana #furgocamper #overlanding #spotsecreto #campinglibre #vanlifespain #acampadalibre
```

**Instrucciones para Remotion:**
- NO usar `WARM_BG` ni `#0F0D0B`. El fondo es el footage.
- Tipografia: Inter 900 (Black) a 96px, `letterSpacing: -3`, blanco puro con `textShadow: '0 4px 30px rgba(0,0,0,0.8)'`.
- Transiciones: fades de 24 frames (mas lentas que V1) para ritmo cinematico.
- Ken Burns mas pronunciado: `scale(1.0)` a `scale(1.15)` en cada clip.
- El logo aparece al final, pequeno (180px), centrado abajo, con fade-in de 20 frames.
- Audio: `<Audio>` para narration MP3 a volumen 1.0 + music track a volumen 0.2.

---

### CONCEPTO F: "El Primer Café" (lifestyle ritual)

> **Archivo:** `src/ElPrimerCafe.tsx` — acepta props `hookVariant: 'PC1'|'PC2'|'PC3'`

**Formato:** Cinematic Narrado (footage puro, ritmo ultra-lento, sensorial)

**Angulo psicologico:** Deseo aspiracional puro. El momento mas sagrado del vanlifer: el primer cafe del dia, sin alarma, con la puerta de la furgo abierta a un paisaje. No vendemos la app — vendemos la manana perfecta. Es el video que se guarda en favoritos.

**Audio:** Track instrumental calido `morning-calm.mp3` a volumen bajo (0.35). Nada de SFX.

**Duracion:** ~15 segundos (450 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Texto |
|---------|--------|-------|
| 0-5 | Footage de cafe al aire libre / pareja con cafe en furgo | "6:47" centrado, grande, aparece con fade |
| 5-9.7 | Footage alternativo de cafe/van morning | "Sin alarma. Sin vecinos. Sin prisa." |
| 9.7-14 | Pareja en furgo con lago fuera | "Solo el café. Y lo que sea que hay ahí fuera." |
| 14-15 | Sunset timelapse + logo WildSpotter + CTA | wildspotter.app |

**Variaciones de hook (3):**
- **PC1:** Empieza con `couple-cofee-outside-caravan.mp4` (pareja + cafe exterior)
- **PC2:** Empieza con `ai_Couple_Morning_Coffee_Van.mp4` (cafe en furgo IA)
- **PC3:** Empieza con `coffee_camping.mp4` (cafe en montana)

**Diferencia visual vs V1 y otros V2:** Transiciones ultra-lentas (32 frames). Overlay calido (warm multiply). Sin texto grande tipo TikTok — tipografia elegante y suave. Ritmo ASMR: el video mas lento de la serie.

**Footage (todo sin usar o poco usado):**
- `couple-cofee-outside-caravan.mp4` (NUEVO, sin usar)
- `ai_Couple_Morning_Coffee_Van.mp4` (NUEVO, sin usar)
- `couple-inside-van-with-lake-outside.mp4` (NUEVO, sin usar)
- `ai_Campervan_Sunset_Time_Lapse_Video.mp4` (NUEVO, sin usar)

**Copy para post:**
```
6:47. Sin alarma. Sin vecinos. Sin prisa.

Solo el café. Y lo que sea que hay ahí fuera.

WildSpotter analiza terreno, satélite y datos legales de toda España para que tu mañana empiece así.

Early access -> link en bio

#vanlife #vidaenfurgo #cafe #mañanas #furgocamper #espana #campinglibre #overlanding #vanlifespain #momentosvanlife #libertad
```

---

### CONCEPTO G: "Tu Perro Lo Sabe" (dog angle)

> **Archivo:** `src/TuPerroLoSabe.tsx` — acepta props `hookVariant: 'P1'|'P2'`

**Formato:** Texto Nativo TikTok (footage full + texto estilo creator, cortes duros)

**Angulo psicologico:** Emocional/aspiracional via mascotas. Enorme sub-audiencia vanlife viaja con perro. El perro como brujula emocional: el no necesita WiFi ni reviews, solo espacio. Irresistible para la audiencia pet-lover.

**Audio:** Track instrumental `golden-fields.mp3`, upbeat pero suave.

**Duracion:** ~18 segundos (540 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Texto (stroke negro, centrado) |
|---------|--------|-------------------------------|
| 0-4.5 | Furgo llegando a clearing costero / aerial costa | "Él no necesita WiFi." |
| 4.5-9 | Interior furgo con lago fuera | "Solo necesita esto." |
| 9-14 | Pareja + perro de noche con luces | "Playas sin nombre. Caminos sin final. Noches sin ruido." |
| 14-18 | Furgo en costa + logo + CTA | "Tu perro lo sabe." + wildspotter.app |

**Variaciones de hook (2):**
- **P1:** Empieza con `ai_Van_Arriving_Empty_Coastal_Spot.mp4` (llegada a costa)
- **P2:** Empieza con `Aerial_Spanish_Mediterranean_coast.mp4` (aerial)

**Diferencia visual vs otros:** Cortes duros, energia playful. Texto TikTok nativo con stroke negro. Labels "Tú" / "Él" como tags. Apela a emocion pura sin datos tecnicos.

**Copy para post:**
```
Él no necesita WiFi. Solo necesita esto.

Playas sin nombre. Caminos sin final. Noches sin ruido.

Tu perro lo sabe. Tú también.

WildSpotter encuentra los spots donde nadie os va a molestar.

Early access -> link en bio

#vanlife #vidaenfurgo #perro #doglife #furgocamper #espana #campinglibre #overlanding #vanlifespain #perrosviajeros #libertad
```

---

### CONCEPTO H: "83.006 Spots Analizados"

> **Archivo:** `src/DatoHero.tsx` — acepta prop `variant: 'H1'|'H2'|'H3'`

**Formato:** Dato Hero (minimalismo extremo — un dato gigante)

**Angulo psicologico:** Autoridad a traves de escala. Un solo numero impactante ocupa toda la pantalla. El espectador para de hacer scroll porque el numero es tan grande que obliga a leerlo. Luego la contextualizacion lo hace memorable.

**Audio:** Track instrumental minimalista + SFX de "impacto" cuando aparece el numero.

**Duracion:** ~15 segundos (450 frames @ 30fps)

**Storyboard (variante H1 — "83.006"):**

| Segundo | Visual | Audio |
|---------|--------|-------|
| 0-1.5 | Pantalla negra completa. Nada. | Silencio |
| 1.5-5 | "83.006" aparece con animacion de counter (0 -> 83.006) en JetBrains Mono 160px, blanco, centrado | SFX: impacto grave al llegar al numero final. Musica entra suave. |
| 5-8 | Debajo del numero: "spots analizados en Espana" en Inter 48px, gris suave | Musica crece |
| 8-11 | El numero se reduce, aparece debajo: "393 con score > 70" + "41 con score > 80" | Musica |
| 11-15 | "Los mejores spots no los comparte nadie. Los calculamos." + logo + CTA | Musica fade out |

**Variaciones (3):**
- **H1:** "83.006" — total de spots analizados
- **H2:** "393" — spots con score > 70 en toda Espana. "De 83.006 candidatos, solo 393 pasan el filtro."
- **H3:** "7" — capas de analisis por spot. "Radar. Terreno. Satelite. Legal. Contexto. Uso del suelo. Score."

**Diferencia visual vs V1:** Sin footage. Sin video de fondo. Pantalla negra con tipografia masiva. Es el anti-V1: donde V1 tenia layers de video dimmed, este es puro dato. Destaca en el feed porque es visualmente opuesto a todo lo demas.

**Instrucciones para Remotion:**
- Fondo: negro puro `#000000`.
- Numero hero: JetBrains Mono 160px, `fontWeight: 700`, blanco puro.
- Counter animacion: `interpolate(frame, [startFrame, endFrame], [0, targetNumber])` con `Math.floor()`.
- Texto secundario: Inter 400, 48px, `#666666`.
- Unico color accent: el score badge en verde `#4ADE80` cuando aparece "393".
- Transiciones: no hay. Todo aparece y desaparece con `opacity` + `interpolate`.

**Copy para post:**
```
83.006 spots analizados.
Solo 393 pasan el filtro.

7 capas: radar, terreno, satelite, legal, contexto, uso del suelo, score.

No buscamos cantidad. Buscamos el spot donde no hay nadie.

Early access -> link en bio

#vanlife #bigdata #vidaenfurgo #furgocamper #espana #ia #overlanding #campinglibre #vanlifespain #datosreales
```

---

### CONCEPTO I: "El Ojo del Satelite"

> **Archivo:** `src/OjoSatelite.tsx`

**Formato:** Mapa Interactivo (tile PNOA como hero + datos de IA apareciendo)

**Angulo psicologico:** Fascinacion tecnologica. Mostrar COMO la IA ve un spot desde el satelite — las sub-puntuaciones reales que genera Claude Haiku al analizar la imagen PNOA. El espectador tech-savvy se queda hipnotizado. El espectador casual se queda por el "efecto CSI" de ver la IA descomponer una imagen.

**Audio:** Track electronico/tech + narracion IA o texto en pantalla.

**Duracion:** ~22 segundos (660 frames @ 30fps)

**Storyboard (usando el Embalse de Amadorio como ejemplo):**

| Segundo | Visual | Datos que aparecen |
|---------|--------|--------------------|
| 0-3 | Tile PNOA del spot a pantalla completa. Sin texto. Solo la imagen satelite. | Nada — el espectador ve la foto y se pregunta que es |
| 3-7 | Texto: "Esto es lo que ve nuestra IA." Aparece un overlay de scan (linea verde barriendo la imagen de arriba a abajo) | Linea de scan animada |
| 7-11 | Sub-scores aparecen uno a uno en el lateral izquierdo, como un terminal/consola | `surface_quality: 7/10` `vehicle_access: 6/10` `open_space: 8/10` `van_presence: 3/10` `obstruction_absence: 7/10` |
| 11-15 | Los sub-scores se comprimen, aparece el AI Score final en grande | "AI Score: 61/100" en circulo cyan. Debajo: "Modelo: Claude Haiku 4.5 | Fuente: IGN PNOA 25cm/px" |
| 15-18 | Zoom out del tile, aparece el mapa CARTO debajo mostrando la ubicacion | Pin amber en el mapa + nombre "Embalse de Amadorio" |
| 18-22 | Logo + "Cada spot analizado por IA. Ninguno por opinion." + CTA | wildspotter.app |

**Variaciones (2):**
- **I1:** Embalse de Amadorio (agua turquesa — visualmente impactante)
- **I2:** Mirador de San Miguel, Huelva (pinar + playa — contraste verde/arena)

**Diferencia visual vs V1:** La imagen satelite real ES el contenido principal. No hay footage de stock. La estetica es "terminal de datos / centro de control" con tipografia monospace en los sub-scores. Se siente como el interior de un sistema, no como un anuncio.

**Instrucciones para Remotion:**
- Tile PNOA descargada como imagen estatica (del pipeline). Usar `<Img>` con Ken Burns zoom lento.
- Sub-scores: JetBrains Mono 32px, verde `#4ADE80`, alineados a la izquierda con padding 60px, fondo semi-transparente negro `rgba(0,0,0,0.7)`.
- Linea de scan: `<div>` de 3px de alto, verde `#4ADE80`, opacity 0.6, animada con `interpolate` de `top: 0` a `top: 100%`.
- Score final: circulo de 180px con borde de 6px cyan.
- Texto "Claude Haiku 4.5" y "IGN PNOA 25cm/px": JetBrains Mono 20px, gris `#555555` — credibilidad tech.

**Copy para post:**
```
Asi ve nuestra IA un spot desde el satelite.

Fuente: ortofoto IGN PNOA a 25cm/pixel.
Modelo: Claude Haiku analizando superficie, acceso, espacio abierto, presencia de vehiculos y obstrucciones.

5 sub-puntuaciones. 1 veredicto.

Ningun humano ha opinado sobre este spot. Solo datos.

Early access -> link en bio

#vanlife #ia #satelite #vidaenfurgo #furgocamper #espana #overlanding #machinelearning #techvanlife #wildspotter
```

---

### CONCEPTO J: "No Lo Busqué. Lo Calculé." (pride/flex)

> **Archivo:** `src/NoLoBusque.tsx` — acepta props `hookVariant: 'NB1'|'NB2'|'NB3'`

**Formato:** Cinematic (footage hero + texto de confianza, fades de 24f)

**Angulo psicologico:** Orgullo del descubrimiento. El flex del vanlifer no es la furgo — es encontrar el spot. "No pregunté. No seguí a nadie. Lo calculé." Empoderamiento + inteligencia. El espectador quiere sentirse asi de listo.

**Audio:** Track instrumental `open-road.mp3` con momentum.

**Duracion:** ~18 segundos (540 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Texto |
|---------|--------|-------|
| 0-5.7 | Furgo por carretera / camino | "No pregunté en foros." → "No seguí a nadie." (staggered) |
| 5.7-10.8 | Furgo llegando a clearing costero | "No lo busqué." |
| 10.8-15.6 | Timelapse sunset en furgo | "Lo calculé." en amber #D97706 |
| 15.6-18 | Beach golden hour + logo + CTA | wildspotter.app |

**Variaciones de hook (3):**
- **NB1:** `ai_Spanish_Countryside_Van_Video.mp4` (campo espanol)
- **NB2:** `rv_mountain_road.mp4` (carretera de montana)
- **NB3:** `road_trip_sunset.mp4` (atardecer en carretera)

**Diferencia visual vs otros:** Tono confiado, no emocional. El texto "Lo calculé" en amber es el unico color accent. Ritmo medio — ni ASMR lento (Cafe) ni TikTok rapido (Perro). La frase final es un slogan memorable.

**Footage:**
- `ai_Spanish_Countryside_Van_Video.mp4` / `rv_mountain_road.mp4` / `road_trip_sunset.mp4` (hooks)
- `ai_Van_Arriving_Empty_Coastal_Spot.mp4` (llegada)
- `ai_Campervan_Sunset_Time_Lapse_Video.mp4` (sunset, NUEVO sin usar)
- `ai_Spanish_Beach_VW_Van_Golden_Hour.mp4` (payoff)

**Copy para post:**
```
No pregunté en foros. No seguí a nadie.

No lo busqué. Lo calculé.

WildSpotter analiza terreno, satélite, datos legales y uso del suelo. Tú solo llegas.

Early access -> link en bio

#vanlife #vidaenfurgo #libertad #furgocamper #espana #campinglibre #overlanding #vanlifespain #spotsecreto #nolocalcule
```

---

### CONCEPTO K: "El Debate del Gatekeeping"

> **Archivo:** `src/Gatekeeping.tsx`

**Formato:** Texto Nativo TikTok (confrontacional, busca comentarios)

**Angulo psicologico:** Controversia controlada. El "gatekeeping" de spots es el tema mas divisivo de la comunidad vanlife. Al tomar postura ("compartir es destruir"), generamos debate, comentarios, compartidos. TikTok recompensa engagement, no solo views. Este video existe para generar conversacion.

**Audio:** Audio trending TikTok (debate/controversial sound). Se sube mudo.

**Duracion:** ~18 segundos (540 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Texto |
|---------|--------|-------|
| 0-4 | `ai_Spanish_Countryside_Van_Video.mp4` — furgo en campo, ritmo lento | "Me acusan de gatekeeping." |
| 4-8 | `crowded_parking_aerial.mp4` — aerial de parking masificado | "Este spot tenia 3 reviews hace un ano. Hoy tiene 200." |
| 8-12 | `drone_forest.mp4` — naturaleza sin gente | "Compartir un spot es firmar su sentencia." |
| 12-16 | Pantalla con logo WildSpotter sobre negro | "WildSpotter no comparte spots. Cada usuario descubre los suyos." |
| 16-18 | Negro + "¿Gatekeeping o sentido comun?" + wildspotter.app | CTA pregunta para generar comentarios |

**Variaciones (2):**
- **K1:** "Me acusan de gatekeeping." (primera persona)
- **K2:** "¿Compartir spots es ayudar o destruir?" (pregunta abierta)

**Diferencia visual vs V1:** Tono confrontacional. V1 era educativo y aspiracional. Este video busca pelea (de la buena). Formato nativo con texto sobre footage, sin chrome de marca. La pregunta final esta disenada para explotar los comentarios.

**Instrucciones para Remotion:**
- Mismo estilo de texto que Concepto G (stroke negro, centrado).
- Cortes duros, no fades.
- Sin logo hasta la escena final.
- El texto "¿Gatekeeping o sentido comun?" debe aparecer con un delay de 1s despues del corte a negro — crear tension.
- Se sube mudo.

**Copy para post:**
```
Me acusan de gatekeeping. Y probablemente tengan razon.

Pero cada spot que se comparte con foto y ubicacion en una app de reviews tiene fecha de caducidad.

WildSpotter no comparte spots entre usuarios. Cada persona descubre los suyos con datos: terreno, satelite, legal, uso del suelo.

Tu spot. Tu descubrimiento. Tu historia.

¿Gatekeeping o sentido comun? Te leo.

#vanlife #gatekeeping #vidaenfurgo #debate #furgocamper #spotsecreto #campinglibre #espana #overlanding #comunidadvanlife
```

---

### CONCEPTO L: "Mientras Todos Buscan" (parallel timelines)

> **Archivo:** `src/MientrasTodosBuscan.tsx` — acepta props `hookVariant: 'MT1'|'MT2'`

**Formato:** Texto Nativo TikTok con crossfades alternantes (Ellos vs Tu)

**Angulo psicologico:** Dos realidades jugando en paralelo. "Ellos" (el vanlifer promedio) vs "Tu" (el usuario de WildSpotter). Sin nombrar competidores — solo contraste entre quien busca y quien ya llego. Genera superioridad aspiracional sin hostilidad.

**Audio:** Track instrumental `rising-tide.mp3` dramatico/building.

**Duracion:** ~20 segundos (600 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Texto |
|---------|--------|-------|
| 0-4 | RVs aparcados / furgos agrupadas | Label rojo "ELLOS" + "Buscando parking a las 21:00" |
| 4-8 | Pareja tomando cafe fuera de furgo | Label verde "TU" + "Ya llevas dos horas aquí" |
| 8-12 | Furgos en gathering | Label rojo "ELLOS" + "Leyendo reviews" |
| 12-16 | Timelapse estrellas con furgo | Label verde "TU" + "Mirando estrellas" |
| 16-20 | Furgo sola en bosque + logo | "La ventaja no es la furgo. Es el radar." + CTA |

**Variaciones (2):**
- **MT1:** `rvs_parked_outdoors.mp4` como footage "ellos" (real stock)
- **MT2:** `ai_Campervan_Gathering_in_Golden_Hour.mp4` como footage "ellos" (IA)

**Diferencia visual vs otros:** Ritmo rapido alternante (4s por escena). Labels con barra lateral de color (rojo/verde) identifican cada "bando". Crossfades de 12 frames — los mas rapidos de V2. Texto TikTok nativo con stroke negro. La alternancia crea tension visual.

**Footage (mayoria sin usar o poco usado):**
- `rvs_parked_outdoors.mp4` (apenas usado)
- `ai_Campervan_Gathering_in_Golden_Hour.mp4` (NUEVO, sin usar)
- `couple-cofee-outside-caravan.mp4` (compartido con El Primer Cafe pero en escena distinta)
- `ai_Stars_Timelapse_Van_Night.mp4` (usado en LasCoordenadas pero aqui es hero)
- `van_in_spot_calm.mp4` (payoff final)

**Copy para post:**
```
Ellos: buscando parking a las 21:00.
Tú: ya llevas dos horas aquí.

Ellos: leyendo reviews.
Tú: mirando estrellas.

La ventaja no es la furgo. Es el radar.

Early access -> link en bio

#vanlife #vidaenfurgo #furgocamper #espana #campinglibre #overlanding #vanlifespain #spotsecreto #radar #ellosytu
```

---

## 3. Calendario de Publicacion V2 (Semanas 3-4)

> **2 uploads por dia** = 28 publicaciones en 14 dias.
> Alternar TikTok-first y Reels-first para diversificar reach.
> Las publicaciones de manana (10:00) se suben la noche anterior programadas.

### Semana 3 (Lun 21 Abr — Dom 27 Abr)

| Dia | Manana (10:00) | Tarde (18:00) | Notas |
|-----|----------------|---------------|-------|
| Lun 21 | **E1 "Las Coordenadas Son Tuyas"** — TikTok | **PC1 "El Primer Café"** — Reels | Arranque V2 emocional + lifestyle ritual |
| Mar 22 | **NB1 "No Lo Busqué. Lo Calculé."** — Reels | **H1 "83.006 spots"** — TikTok | Pride/flex + dato impactante |
| Mie 23 | **I1 "El Ojo del Satelite" (Amadorio)** — TikTok | **MT1 "Mientras Todos Buscan"** — Reels | Tech flex + contraste ellos/tu |
| Jue 24 | **P1 "Tu Perro Lo Sabe"** — TikTok | **K1 "Gatekeeping"** — Reels | Dog angle + debate |
| Vie 25 | **PC2 "El Primer Café" (var IA)** — Reels | **NB2 "No Lo Busqué" (montana)** — TikTok | Cafe variacion + pride montana |
| Sab 26 | **MT2 "Mientras Todos Buscan" (var IA)** — TikTok | **E2 "Coordenadas" (var estrellas)** — Reels | Contraste variacion + slogan estrellas |
| Dom 27 | **P2 "Tu Perro Lo Sabe" (aerial)** — Reels | **H2 "393 spots con score>70"** — TikTok | Dog aerial + dato filtro |

### Semana 4 (Lun 28 Abr — Dom 4 May) — DEPRIORITIZADA, ver `marketing-strategy-v3.md`

> **Nota:** Esta semana ha sido reemplazada por el plan V3 basado en el audit de abril 2026. Los conceptos listados aqui quedan como reserva para reposts o dias sin contenido nuevo.

| Dia | Manana (10:00) | Tarde (18:00) | Notas |
|-----|----------------|---------------|-------|
| Lun 28 | **NB3 "No Lo Busqué" (sunset)** — TikTok | **I2 "Ojo Satelite" (Huelva pinar)** — Reels | Pride sunset + segunda IA |
| Mar 29 | **PC3 "El Primer Café" (montana)** — Reels | **K2 "Gatekeeping" (var pregunta)** — TikTok | Cafe montana + debate |
| Mie 30 | **E3 "Coordenadas" (var cafe)** — TikTok | **MT1 "Mientras Todos Buscan" (repost)** — Reels | Slogan var + repost si funciono |
| Jue 1 | **P1 "Tu Perro Lo Sabe" (repost)** — TikTok | **H3 "7 capas de analisis"** — Reels | Dog repost + dato hero capas |
| Vie 2 | **NB1 "No Lo Busqué" (repost)** — Reels | **PC1 "El Primer Café" (repost)** — TikTok | Mejores variaciones en plataforma opuesta |
| Sab 3 | **E1 "Coordenadas" (repost)** — TikTok | **Repost del mejor video de semana 3** — Reels | Repost estrategico |
| Dom 4 | **Compilacion: mejores momentos V1+V2** — TikTok+Reels | — | Recap si hay contenido suficiente |

---

## 4. Inventario de Assets Necesarios

### Footage nuevo a conseguir/generar

| Asset | Prioridad | Fuente sugerida | Uso |
|-------|-----------|-----------------|-----|
| Trafico en ciudad espanola (Madrid/Barcelona) | Alta | Pexels: "traffic spain" / "rush hour" | Concepto G (Huida del Viernes) |
| Furgo llegando a spot vacio al amanecer | Alta | AI video (Veo/Runway): "VW van arriving at empty coastal clearing dawn" | Concepto E, G |
| Timelapse estrellas con furgo | Media | Ya existe: `ai_Stars_Timelapse_Van_Night.mp4` | Concepto E, L, J3 |
| Pareja tomando cafe en furgo | Media | Ya existe: `ai_Couple_Morning_Coffee_Van.mp4` | Concepto L |
| Naturaleza destruida / basura en spot | Baja | Pexels: "littering nature" / "camping trash" | Concepto K (gatekeeping) - opcional |

### Tiles PNOA (descargar del pipeline)

Para cada uno de los 5 spots, descargar el tile satelite que el pipeline ya tiene cacheado:
1. `spots/4655415476_pnoa.jpg` — Muelle del Vigia
2. `spots/2324068041_pnoa.jpg` — Acantilados Vigo
3. `spots/2254888334_pnoa.jpg` — Mirador San Miguel
4. `spots/1418367281_pnoa.jpg` — Embalse Gredos
5. `spots/287775764_pnoa.jpg` — Embalse Amadorio

### Tiles CARTO (generar con Python)

Mapas de fondo para las 5 zonas:
1. Huelva costa (lat=37.14, lon=-6.86, z=13)
2. Vigo acantilados (lat=42.15, lon=-8.85, z=13)
3. Huelva pinar (lat=37.22, lon=-7.09, z=13)
4. Gredos embalse (lat=40.43, lon=-4.62, z=13)
5. Amadorio embalse (lat=38.54, lon=-0.26, z=13)

### Screen recordings (Javier captura)

1. **Flujo completo:** Abrir app -> navegar a zona costera -> pulsar Scan -> ver resultados -> tocar spot -> ver detalle
2. **Flujo montana:** Lo mismo pero en zona Gredos
3. **Formato:** 1080x1920 o cropeable a vertical. 20-30 segundos cada uno.

### Audio nuevo (descargado)

| Track | Mood | Uso | Fuente |
|-------|------|-----|--------|
| `morning-calm.mp3` | Calido, suave, ASMR | Concepto F (El Primer Cafe) | Mixkit 82 |
| `golden-fields.mp3` | Upbeat gentil, playful | Concepto G (Tu Perro Lo Sabe) | Mixkit 142 |
| `open-road.mp3` | Driving, confiado | Concepto J (No Lo Busque) | Mixkit 468 |
| `rising-tide.mp3` | Dramatico, building | Concepto L (Mientras Todos Buscan) | Mixkit 580 |
| Narration E (slogan) | Documental calido, lento | Concepto E | ElevenLabs / similar |

---

## 5. Resumen de Diferenciacion V1 vs V2

| Aspecto | V1 | V2 |
|---------|----|----|
| **Formatos** | 1 (footage dimmed + text overlay) | 6 formatos distintos |
| **Palette** | Warm brown `#0F0D0B` + amber siempre | Varía: negro puro, sin fondo, footage full |
| **Audio** | Solo tracks instrumentales | IA narration + trending audio + instrumentales |
| **Datos** | Inventados / genericos | 100% reales del pipeline (83.006 spots, scores reales) |
| **App** | Mocks/recreaciones | Screen recordings reales |
| **Angulos** | Miedo legal, masificacion, pipeline tech | Libertad, spots reales, debate, datos crudos, lifestyle |
| **Tono** | Educativo-comercial | Variado: emocional, confrontacional, minimalista, nativo |
| **Duracion** | 16-30s homogeneo | Variada: 12s (meme) a 25s (demo) |

---

## 6. Notas de Produccion para Sonnet

### Reglas que siguen vigentes de V1

1. **Footage continuo** — nunca frames planos (excepto Concepto H que es deliberadamente negro)
2. **Safe zones TikTok** — 150px arriba, 250px abajo, 100px derecha
3. **Tipografia minima** — 72px main, 48px secondary, 28px labels
4. **FPS:** 30 | **Resolucion:** 1080x1920 | **Codec:** H.264
5. **Registrar todo en Root.tsx** con el patron `Variant<Props>`
6. **Hook variants** via props, no duplicacion de archivos
7. **Ken Burns** en todo footage (1.0 -> 1.08-1.12)

### Reglas nuevas de V2

1. **Cada concepto tiene su propio formato visual** — no reusar el template TransitionSeries+dimmed de V1.
2. **Cortes duros** para conceptos nativos (G, J, K). Fades para cinematicos (E, L).
3. **Sin paneles slate `#1E293B`** en los conceptos nativos — el slate card es V1.
4. **Narration audio** se anade con `<Audio src={staticFile("audio/narration/concept-e.mp3")} />`.
5. **Videos que se suben mudos** (G, J, K): renderizar sin audio, el audio trending se anade en TikTok.
6. **Datos reales obligatorios** — scores, elevaciones, pendientes, labels de landcover: consultar la tabla de spots de este documento.
7. **Screen recordings** se embeben como `<Video src={staticFile("videos/screen-recording-coast.mp4")} />`.
8. **Nuevos tracks de musica**: descargar de Mixkit, no reusar los de V1 (background, tension, suspense, etc.).

### Estructura de archivos esperada

```
src/
├── LasCoordenadas.tsx      # Concepto E — cinematic narrado, slogan
├── ElPrimerCafe.tsx        # Concepto F — lifestyle ritual, ASMR lento
├── TuPerroLoSabe.tsx       # Concepto G — dog angle, TikTok nativo
├── DatoHero.tsx            # Concepto H — dato gigante, minimalismo
├── OjoSatelite.tsx         # Concepto I — satelite + IA, mapa interactivo
├── NoLoBusque.tsx          # Concepto J — pride/flex, cinematico
├── Gatekeeping.tsx         # Concepto K — controversia, debate
├── MientrasTodosBuscan.tsx # Concepto L — parallel timelines, ellos vs tu
└── Root.tsx                # Registrar todos los conceptos V2
```

### Registro en Root.tsx

Cada concepto necesita sus variaciones registradas como `Composition` dentro de un `Folder`. Seguir el patron existente (ver ParkingLleno, LaMulta, etc.). No crear archivos duplicados — usar props para variaciones.

---

*Estrategia V2 preparada el 2026-04-18. Cubre semanas 3-4 (21 Abr — 4 May 2026).*
