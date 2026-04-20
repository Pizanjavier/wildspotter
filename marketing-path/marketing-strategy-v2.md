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

### CONCEPTO F: "Spot Real" (Serie — 5 videos)

> **Archivos:** `src/SpotReal.tsx` — acepta props `spotId: 1|2|3|4|5`
> Cada spot es un video independiente de ~18 segundos.

**Formato:** Mapa Interactivo + datos reales

**Angulo psicologico:** Prueba de producto. Mostramos spots REALES con datos REALES del pipeline. El espectador ve coordenadas, scores, labels de landcover, datos legales — todo sacado directamente de la base de datos. Nada inventado.

**Audio:** Track instrumental nuevo (tipo "ambient documentary") + SFX sutil en reveal de score.

**Duracion:** ~18 segundos (540 frames @ 30fps) cada uno

**Storyboard generico (aplicable a los 5):**

| Segundo | Visual | Descripcion |
|---------|--------|-------------|
| 0-3 | Titulo de la zona en grande + icono de pin | Texto: "HUELVA BEACH" / "ACANTILADOS GALLEGOS" / etc. Fondo: tile CARTO de la zona, oscurecido 60% |
| 3-8 | Tile satelite PNOA real del spot, con zoom lento revelando detalles | La imagen PNOA real descargada del pipeline. Datos aparecen uno a uno: elevacion, pendiente, tipo de terreno |
| 8-13 | Checklist legal animado (4 items con checkmarks verdes) + landcover label | "Natura 2000: Libre", "P. Nacional: Libre", "Ley de Costas: Libre", "Catastro: Rustico publico" + "Uso del suelo: Laminas de agua" |
| 13-16 | Score badge grande animado (circulo con numero) | Score composite con color-coding (verde/cyan/amber). Sub-scores debajo: IA, Contexto, Terreno |
| 16-18 | Logo + "Datos reales. Spot real." + wildspotter.app | CTA minimalista |

**Los 5 spots con datos reales:**

**F1: Muelle del Vigia — Isla Cristina, Huelva**
- OSM ID: 4655415476 | Coords: 37.1428°N, 6.8592°W
- Tipo: Viewpoint adjacent | Elevacion: 0m | Pendiente: 0.2%
- Score: 63.7 | IA: 41.1 | Contexto: 82 | Terreno: 98
- Legal: 100% limpio | Catastro: rustico
- Contexto: playa cercana, viewpoint, agua, rio — scenic_value +35
- Landcover: (sin datos especificos)
- Tile muestra: oceano turquesa, playa arenosa, pinos en dunas, un pequeno muelle
- Geo-tag: #huelva #islacristina

**F2: Viewpoint — Acantilados cerca de Vigo**
- OSM ID: 2324068041 | Coords: 42.1501°N, 8.8481°W
- Tipo: Viewpoint adjacent | Elevacion: 20m | Pendiente: 33.6% (acantilado)
- Score: 59.9 | IA: 58 | Contexto: 100 | Terreno: 0 (pendiente extrema)
- Legal: 100% limpio | Catastro: rustico
- Contexto: playa + viewpoint cercanos, 0 edificios en 300m, privacidad perfecta
- Tile muestra: olas rompiendo en acantilados, bosque denso hasta el borde
- Nota: el score bajo por terreno (33% pendiente) es honesto — no es parking, es mirador. Usarlo como ejemplo de transparencia del sistema.
- Geo-tag: #galicia #vigo #riasbajas

**F3: Mirador de San Miguel — Huelva (pinar + playa)**
- OSM ID: 2254888334 | Coords: 37.2162°N, 7.0915°W
- Tipo: Viewpoint adjacent | Elevacion: 15m | Pendiente: 13%
- Score: 68.1 | IA: 62 | Contexto: 80 | Terreno: 0
- Legal: 100% limpio | Catastro: rustico publico
- Contexto: playa + viewpoint + agua + rio — scenic_value +35, penalty carretera terciaria -5
- Landcover: Estuarios — bonus salvaje +30
- Tile muestra: carretera entre pinar con playa visible al borde
- Geo-tag: #huelva #playasdeespana

**F4: Embalse de Gredos**
- OSM ID: 1418367281 | Coords: 40.4252°N, 4.6160°W
- Tipo: Dead end (camino sin salida) | Superficie: dirt | Elevacion: 723m | Pendiente: 5.7%
- Score: 69.6 | IA: 60.5 | Contexto: 100 (PERFECTO) | Terreno: 43
- Legal: 100% limpio | Catastro: rustico
- Contexto: dead-end = +15 privacidad, 0 edificios, agua + rio + pico cercanos, sin carretera importante
- Landcover: Laminas de agua — bonus salvaje +17
- Tile muestra: playa de arena curvandose en agua verde oscura de embalse, rocas de granito
- Geo-tag: #gredos #sierradegredos #avila

**F5: Embalse de Amadorio — cerca de Alicante**
- OSM ID: 287775764 | Coords: 38.5433°N, 0.2614°W
- Tipo: Viewpoint adjacent | Elevacion: 109m | Pendiente: 26.5%
- Score: 72.3 | IA: 61 | Contexto: 91.4 | Terreno: 0
- Legal: 100% limpio | Catastro: registered (no privado)
- Contexto: viewpoint + agua + rio — scenic_value +31.4, 0 edificios, bonus salvaje +30
- Landcover: Laminas de agua
- Tile muestra: canal de agua turquesa impresionante con carretera al lado
- Geo-tag: #alicante #villajoyosa #embalsesdeespana

**Instrucciones para Remotion:**
- Fondo: negro puro `#000000`, NO el warm brown de V1.
- Datos en JetBrains Mono verde/cyan/amber segun score.
- Los tiles PNOA son el hero visual — descargarlos del pipeline y ponerlos en `public/images/spots/`.
- Tiles CARTO de cada zona como fondo de la primera escena — generar con el script de Python.
- Score badge: circulo de 200px con borde grueso (8px) del color del score, numero en JetBrains Mono 72px.
- Legal checklist: 4 filas con dot de color + label + "Libre" en verde o "Zona protegida" en rojo.
- Transiciones: cortes duros (no fades) para que se sienta como una interfaz de datos, no como un anuncio.

**Copy para posts (generico, adaptar nombre de zona y geo-tags):**
```
[Nombre del spot]. Score: [X]/100.

[Descripcion corta del tile satelite].

Elevacion: [X]m. Pendiente: [X]%.
Legal: [4 checks en verde].
Uso del suelo: [landcover label].

Estos datos no vienen de reviews. Vienen de satelite, terreno y fuentes oficiales.

Early access -> link en bio

#vanlife #vidaenfurgo #[geotag1] #[geotag2] #furgocamper #campinglibre #overlanding #espana #spotreal #wildspotter
```

---

### CONCEPTO G: "La Huida del Viernes"

> **Archivo:** `src/LaHuida.tsx`

**Formato:** Texto Nativo TikTok (footage full + texto estilo creator)

**Angulo psicologico:** Alivio de la paralisis por decision. Es viernes tarde, quieres salir de la ciudad, no tienes plan, no quieres acabar en un parking lleno. WildSpotter es tu atajo. Empatia directa con el momento de la semana.

**Audio:** Audio trending de TikTok (no embebido — el video se renderiza MUDO y se anade el audio trending directamente en TikTok al subir). Alternativa: narracion IA rapida.

**Duracion:** ~20 segundos (600 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Texto (estilo TikTok — grande, centrado, stroke negro) |
|---------|--------|---------------------------------------------------------|
| 0-4 | `road_trip_sunset.mp4` a pantalla completa, sin dimming | "Viernes. 18:00." (3s) luego "Necesitas un plan." (1s) |
| 4-8 | Corte a screen recording de la app: mapa, boton de scan | "Abres WildSpotter." |
| 8-12 | Screen recording: radar escaneando, resultados apareciendo | "42 spots a menos de 2 horas." |
| 12-16 | Screen recording: detalle de un spot con score alto | "Plano. Legal. Con vistas." |
| 16-20 | Corte a `ai_Van_Arriving_Empty_Coastal_Spot.mp4` + logo | "Sabado por la manana." |

**Variaciones de hook (3):**
- **G1:** "Viernes. 18:00. Necesitas un plan." (generico)
- **G2:** "Viernes. 18:00. Saliendo de Madrid." (geo Madrid)
- **G3:** "Viernes. 18:00. Saliendo de Barcelona." (geo Barcelona)

**Diferencia visual vs V1:** El texto usa estilo nativo de TikTok (Inter Bold, blanco, stroke negro de 3px, centrado, sin sombra fancy). Sin paneles, sin cards, sin amber. Parece un video de un creator, no un anuncio de marca. Los screen recordings de la app real le dan autenticidad.

**Instrucciones para Remotion:**
- Footage a pantalla completa, CERO dimming en las escenas de video. Saturacion al 100%.
- Texto: Inter Bold 80px, blanco `#FFFFFF`, `WebkitTextStroke: '3px black'`, centrado vertical y horizontal.
- Sin paneles de fondo detras del texto. El texto flota directamente sobre el footage.
- Screen recordings de la app: renderizar a 1080x1920 (o capturar de Expo Web y cropear). Borde del telefono NO necesario — es contenido nativo, no un mock.
- Transiciones: cortes duros (no fades). Se siente como un TikTok editado rapido.
- Si se usa narracion IA en lugar de audio trending: voz rapida, casual, como un amigo hablando.

**Copy para post:**
```
Viernes 18:00. Quieres salir. No tienes plan.

Abres WildSpotter. 42 spots a menos de 2 horas.
Planos. Legales. Con vistas.

Sabado por la manana estas ahi. Solo.

Es un radar. No una guia.

Early access -> link en bio

#vanlife #viernes #escapada #vidaenfurgo #furgocamper #madrid #espana #campinglibre #spotsecreto #overlanding #vanlifespain #weekendvanlife
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

### CONCEPTO J: "Antes y Despues" (Before/After — Expectativa vs Realidad)

> **Archivo:** `src/AntesYDespues.tsx`

**Formato:** Before/After Vertical (split top/bottom, footage al 100%)

**Angulo psicologico:** Contraste emocional puro. No necesita texto elaborado. La imagen hace el trabajo. ARRIBA: la realidad del vanlifer promedio (parking lleno, multa, estres). ABAJO: la realidad del vanlifer con WildSpotter (soledad, naturaleza, libertad). Es el meme format adaptado a video.

**Audio:** Audio trending TikTok (tipo "oh no" o contraste sound). Se sube mudo, audio se anade en TikTok.

**Duracion:** ~12 segundos (360 frames @ 30fps) — corto, formato meme

**Storyboard:**

| Segundo | ARRIBA (mitad superior) | ABAJO (mitad inferior) | Texto central |
|---------|------------------------|----------------------|---------------|
| 0-4 | `ai_Van_trying_to_park_full_parking.mp4` — parking lleno de furgos | Negro (hidden) | "Park4night" en gris con tachado |
| 4-6 | Se mantiene arriba | Revela: `van_in_spot_calm.mp4` — furgo sola en bosque | Linea divisoria amber brilla |
| 6-10 | Se mantiene | Se mantiene | "WildSpotter" en blanco, debajo del divider |
| 10-12 | Se mantiene | Se mantiene | Logo pequeno centrado + wildspotter.app |

**Variaciones (3):**
- **J1:** Parking lleno vs furgo sola (clasico)
- **J2:** `police_writing_ticket.mp4` vs `coffee_camping.mp4` — multa vs cafe tranquilo
- **J3:** `rvs_parked_outdoors.mp4` (multitud) vs `ai_Stars_Timelapse_Van_Night.mp4` (estrellas)

**Diferencia visual vs V1:** Footage sin dimming. Saturacion completa. No hay overlay oscuro, no hay paneles. El contraste visual puro entre las dos mitades hace el trabajo. Es el formato mas rapido y directo — perfecto para engagement y compartidos.

**Instrucciones para Remotion:**
- Split: cada mitad ocupa exactamente 960px de alto (1920/2).
- Divider: 4px amber `#D97706` con `boxShadow: '0 0 20px #D97706'`.
- Footage arriba: `objectFit: 'cover'`, sin filtro.
- Footage abajo: `objectFit: 'cover'`, sin filtro. Comienza hidden (negro), revela con `clipPath` o `opacity` animation.
- Texto "Park4night": Inter 600, 40px, `#666666`, con `textDecoration: 'line-through'`.
- Texto "WildSpotter": Inter 700, 52px, blanco.
- Sin musica embebida — se sube mudo.

**Copy para post:**
```
Expectativa vs Realidad.

Una app te dice donde van todos.
La otra te dice donde no va nadie.

Early access -> link en bio

#vanlife #expectativavsrealidad #vidaenfurgo #furgocamper #espana #park4night #campinglibre #overlanding #vanlifespain #spotsecreto
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

### CONCEPTO L: "Desde el Spot" (Lifestyle puro)

> **Archivo:** `src/DesdeElSpot.tsx`

**Formato:** Cinematic Narrado (footage puro, sensorial, anti-data)

**Angulo psicologico:** Deseo aspiracional puro. Sin datos. Sin pipeline. Sin scores. Solo la sensacion de estar en un sitio perfecto, solo, con tu furgo. Es el video que el vanlifer guarda en favoritos y vuelve a ver cuando esta en la oficina un lunes. Crea deseo de la experiencia, no de la app.

**Audio:** Narracion IA susurrada/ASMR + sonidos ambiente (olas, pajaros, viento). Sin musica.

**Narracion IA (guion):**
```
"Agua turquesa a diez metros.
Ni un coche. Ni una persona.
Solo el sonido del viento.

¿Como llegue aqui?
No pregunte a nadie. Lo calcule."
```

**Duracion:** ~18 segundos (540 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Audio |
|---------|--------|-------|
| 0-5 | `ai_Spanish_Beach_VW_Van_Golden_Hour.mp4` — furgo en playa dorada, lento, sin texto | Sonido de olas. Narr: "Agua turquesa a diez metros." |
| 5-9 | `ai_Stars_Timelapse_Van_Night.mp4` — timelapse estrellas, sin texto | Grillos. Narr: "Ni un coche. Ni una persona. Solo el sonido del viento." |
| 9-13 | `ai_Couple_Morning_Coffee_Van.mp4` — pareja con cafe en la furgo | Sonido de cafe. Narr: "¿Como llegue aqui?" |
| 13-16 | Texto aparece: "No pregunte a nadie. Lo calcule." | Narr: "No pregunte a nadie. Lo calcule." |
| 16-18 | Logo minimo + wildspotter.app sobre negro con fade | Silencio |

**Variaciones (2):**
- **L1:** Playa + estrellas + cafe (costa)
- **L2:** `coffee_camping.mp4` + `drone_mountains.mp4` + `van_in_spot_calm_couple_dog_night.mp4` (montana)

**Diferencia visual vs V1:** Sin NINGUN dato en pantalla. Sin scores. Sin pipeline. Sin legal. Solo sensaciones. Es el polo opuesto al Concepto H (Dato Hero). Juntos crean rango: V2 tiene desde lo mas emocional hasta lo mas analitico.

**Instrucciones para Remotion:**
- Footage al 100%, sin dimming, sin overlay.
- El unico texto que aparece es la frase final: Inter 700, 64px, blanco, centrado.
- Narration audio a volumen 1.0.
- Sonidos ambiente como pista separada a volumen 0.3.
- Sin SFX. Sin musica instrumental.
- Ken Burns muy lento (1.0 -> 1.06 en toda la duracion del clip).
- Transiciones: fades largas de 30 frames — ultra-cinematico.

**Copy para post:**
```
Agua turquesa a diez metros.
Ni un coche. Ni una persona.
Solo el sonido del viento.

¿Como llegue aqui? No pregunte a nadie.

WildSpotter analiza terreno, satelite y datos legales de toda Espana. Tu solo llegas.

Early access -> link en bio

#vanlife #vidaenfurgo #libertad #playa #espana #furgocamper #campinglibre #overlanding #naturaleza #vanlifespain #momentosvanlife
```

---

### CONCEPTO M: "Screen Recording Real" (App Demo Nativo)

> **Archivo:** `src/ScreenRecording.tsx` — wrapper minimo alrededor de video capturado

**Formato:** Screen Recording (captura real de la app, overlay minimo)

**Angulo psicologico:** Prueba de producto definitiva. Nada de mocks ni recreaciones. El espectador VE la app real funcionando. Ve el mapa, ve el boton de scan, ve los resultados reales, ve un spot con score real. Es el video que convierte followers en waitlist signups.

**Audio:** Narracion IA explicando lo que pasa en pantalla + track suave de fondo.

**Duracion:** ~25 segundos (750 frames @ 30fps)

**Storyboard:**

| Segundo | Visual | Narration/Texto overlay |
|---------|--------|-----------------------|
| 0-3 | Texto sobre negro: "App real. Datos reales. Sin trucos." | Musica suave entra |
| 3-8 | Screen recording: mapa abierto, usuario navega a zona costera | Narr: "Esto es WildSpotter. Esto es lo que ves cuando abres la app." |
| 8-13 | Screen recording: pulsa "SCAN THIS AREA", radar animacion, resultados aparecen | Narr: "Escaneamos la zona. Terreno, satelite, legal, uso del suelo." |
| 13-18 | Screen recording: scroll por lista de spots, toca uno con score alto | Narr: "Cada spot con su score. Cada dato verificado." |
| 18-22 | Screen recording: detalle del spot — score, legal checklist, boton Navigate | Narr: "Legal en verde. Score 72. Un toque y tu GPS te lleva." |
| 22-25 | Logo + "Tu radar de spots." + wildspotter.app | Musica fade out |

**Variaciones (2):**
- **M1:** Escaneo de zona costera (Huelva/Alicante)
- **M2:** Escaneo de zona montana (Gredos)

**Diferencia visual vs V1:** Es contenido 100% capturado de la app real. Remotion solo anade el intro de 3s, el outro de 3s, y un overlay muy sutil de texto/narration. El 80% del video es screen recording puro.

**Instrucciones para Remotion:**
- El screen recording se captura en Chrome a 1080x1920 (o se cropea si se captura desktop).
- Remotion wrappea el video capturado: `<Sequence from={0}>` intro, `<Sequence from={90}>` screen recording video, `<Sequence from={...}>` outro.
- Overlay de texto: Inter 600, 36px, blanco con sombra sutil, posicionado en la zona segura inferior (250px desde abajo).
- No anadir borde de telefono — se siente mas autentico sin el mock frame.
- Narration audio synced con las acciones en pantalla.

**Nota para Javier:** Los screen recordings hay que capturarlos manualmente de la app real (Expo Web en Chrome). Grabar:
1. Navegacion por el mapa
2. Scan de una zona con spots reales
3. Scroll por resultados
4. Tap en un spot, ver detalle completo
5. Los spots de Huelva, Gredos y Alicante son buenos candidatos.

**Copy para post:**
```
App real. Datos reales. Sin trucos.

Esto es lo que ves cuando abres WildSpotter:
- Mapa de toda Espana
- Escaneo de cualquier zona
- Resultados con score, datos legales, uso del suelo
- Un toque y tu GPS te lleva

No hay reviews. No hay fotos de usuarios. Solo datos.

Early access -> link en bio

#vanlife #vidaenfurgo #app #furgocamper #espana #campinglibre #overlanding #demo #vanlifespain #wildspotter #appdemo
```

---

## 3. Calendario de Publicacion V2 (Semanas 3-4)

> **2 uploads por dia** = 28 publicaciones en 14 dias.
> Alternar TikTok-first y Reels-first para diversificar reach.
> Las publicaciones de manana (10:00) se suben la noche anterior programadas.

### Semana 3 (Lun 21 Abr — Dom 27 Abr)

| Dia | Manana (10:00) | Tarde (18:00) | Notas |
|-----|----------------|---------------|-------|
| Lun 21 | **E1 "Las Coordenadas Son Tuyas"** — TikTok | **F1 Spot Real: Huelva Beach** — Reels | Arranque V2 con el video mas emocional + primer spot real |
| Mar 22 | **G1 "La Huida del Viernes"** — Reels | **H1 "83.006 spots"** — TikTok | Empathy hook + dato impactante |
| Mie 23 | **I1 "El Ojo del Satelite" (Amadorio)** — TikTok | **J1 "Antes y Despues"** — Reels | Tech flex + formato meme |
| Jue 24 | **F2 Spot Real: Acantilados Galicia** — TikTok | **K1 "Gatekeeping"** — Reels | Spot real + debate |
| Vie 25 | **L1 "Desde el Spot" (costa)** — Reels | **G2 "Huida del Viernes" (Madrid)** — TikTok | Lifestyle puro + timing perfecto (viernes) |
| Sab 26 | **M1 Screen Recording (costa)** — TikTok | **F3 Spot Real: Pinar Huelva** — Reels | Demo real + tercer spot |
| Dom 27 | **E2 "Coordenadas" (var estrellas)** — Reels | **H2 "393 spots con score>70"** — TikTok | Repetir lo mejor de V2 con variacion |

### Semana 4 (Lun 28 Abr — Dom 4 May)

| Dia | Manana (10:00) | Tarde (18:00) | Notas |
|-----|----------------|---------------|-------|
| Lun 28 | **F4 Spot Real: Embalse Gredos** — TikTok | **I2 "Ojo Satelite" (Huelva pinar)** — Reels | Spot de montana + segunda IA |
| Mar 29 | **J2 "Antes/Despues" (multa vs cafe)** — Reels | **K2 "Gatekeeping" (var pregunta)** — TikTok | Split policia/cafe + debate |
| Mie 30 | **L2 "Desde el Spot" (montana)** — TikTok | **G3 "Huida" (Barcelona)** — Reels | Lifestyle montana + geo BCN |
| Jue 1 | **F5 Spot Real: Embalse Amadorio** — TikTok | **M2 Screen Recording (montana)** — Reels | Ultimo spot real + demo Gredos |
| Vie 2 | **E3 "Coordenadas" (var cafe)** — Reels | **J3 "Antes/Despues" (multitud vs estrellas)** — TikTok | Slogan var + split nocturno |
| Sab 3 | **H3 "7 capas de analisis"** — TikTok | **Repost del mejor video de semana 3** — Reels | Dato hero + repost estrategico |
| Dom 4 | **Compilacion: mejores momentos V1+V2** — TikTok+Reels | — | Recap si hay contenido suficiente, si no publicar variacion de lo que mejor funciono |

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

### Audio nuevo

| Track | Mood | Uso | Fuente |
|-------|------|-----|--------|
| Narration E (slogan) | Documental calido, lento | Concepto E | ElevenLabs / similar |
| Narration L (ASMR) | Susurro, intimo | Concepto L | ElevenLabs / similar |
| Narration M (explicativo) | Casual, claro | Concepto M | ElevenLabs / similar |
| Ambient sounds (olas, pajaros) | Natural, sin musica | Concepto L | Freesound.org |
| Instrumental ambient | Minimalista, documental | Conceptos F, I | Mixkit/Pixabay (track nuevo, NO reusar V1) |
| Instrumental tech | Electronico suave | Concepto I | Mixkit/Pixabay (track nuevo) |
| Impact SFX | Grave, cinematico | Concepto H (numero hero) | Freesound.org / Pixabay |

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
├── LasCoordenadas.tsx      # Concepto E
├── SpotReal.tsx            # Concepto F (prop: spotId 1-5)
├── LaHuida.tsx             # Concepto G
├── DatoHero.tsx            # Concepto H
├── OjoSatelite.tsx         # Concepto I
├── AntesYDespues.tsx       # Concepto J
├── Gatekeeping.tsx         # Concepto K
├── DesdeElSpot.tsx         # Concepto L
├── ScreenRecording.tsx     # Concepto M
└── Root.tsx                # Registrar todos los conceptos V2
```

### Registro en Root.tsx

Cada concepto necesita sus variaciones registradas como `Composition` dentro de un `Folder`. Seguir el patron existente (ver ParkingLleno, LaMulta, etc.). No crear archivos duplicados — usar props para variaciones.

---

*Estrategia V2 preparada el 2026-04-18. Cubre semanas 3-4 (21 Abr — 4 May 2026).*
