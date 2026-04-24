export const es = {
  locale: 'es',
  nav: {
    skip: 'Saltar al contenido',
  },
  beta: {
    banner: '¿Eres usuario de Android? Ayúdanos a testear la Beta y llévate Premium de por vida.',
    cta: 'Saber más',
    slots: 'Quedan {count} de 20 plazas',
    modalTitle: 'Premium de por Vida',
    modalDesc: 'Necesitamos 20 testers en Android durante 14 días para poder lanzar.',
    step1: 'Únete al',
    step1Link: 'Grupo de Google',
    step2: 'Descarga la Beta en:',
    step2Link: 'Play Store',
    step3: 'Usa la app y mantenla instalada 14 días.',
    close: 'Cerrar',
  },
  hero: {
    headline: 'Los mejores spots no están en ninguna app.',
    subtitle: 'Un radar que cruza datos oficiales para encontrar rincones salvajes en España. Sin reseñas. Sin multitudes. Sin sorpresas.',
    emailPlaceholder: 'tu@correo.com',
    cta: 'Avísame del lanzamiento',
    promise: 'La app será gratis para todos. Apúntate a la lista de espera para ser de los primeros en probarla.',
    counterLabel: 'en la lista de espera',
    microcopy: 'Sin spam. Doble confirmación. Puedes darte de baja cuando quieras.',
    thanks: 'Hecho. Revisa tu correo para confirmar.',
    successTitle: 'Revisa tu correo',
    successBody: 'Te hemos enviado un enlace a {email}. Haz clic para confirmar tu plaza en la lista.',
    successSpam: '¿No lo ves? Mira en spam o promociones. El remitente es hola@wildspotter.app.',
    errorGeneric: 'Algo falló. Prueba otra vez.',
    errorEmail: 'Correo inválido.',
    errorDup: 'Ya estás dentro.',
  },
  problem: {
    title: 'El spot «secreto» ya no existe.',
    stats: [
      { big: '27 %', label: 'de España está bajo Red Natura 2000. Y hay más zonas protegidas que tampoco verás en otras apps.' },
      { big: 'Hasta 600 €', label: 'de sanción por dormir donde no debes. Sin aviso, sin excusa.' },
      { big: '4', label: 'fuentes oficiales que cruzamos en cada spot: MITECO, IGN, Catastro y OpenStreetMap.' },
    ],
  },
  pipeline: {
    title: 'Seis filtros. Un solo spot.',
    stages: [
      { n: '01', k: 'Radar', d: 'Caminos sin salida, parkings de tierra y claros accesibles en furgo.' },
      { n: '02', k: 'Terreno', d: 'Pendiente y altitud calculadas con datos topográficos a 30 m.' },
      { n: '03', k: 'Legal', d: 'Natura 2000, Parques Nacionales, Ley de Costas y Catastro cruzados uno a uno.' },
      { n: '04', k: 'Satélite', d: 'Imagen PNOA del IGN analizada por IA visual. Suelo, vegetación y furgos visibles.' },
      { n: '05', k: 'Contexto', d: 'Ruido de carretera, privacidad, vistas y distancia a pueblos.' },
      { n: '06', k: 'Puntuación', d: 'Nota final de 0 a 100. Tú eliges desde dónde mirar.' },
    ],
  },
  legal: {
    title: 'Datos oficiales. Cero opiniones.',
    sub: 'No leemos reseñas. Cruzamos las mismas fuentes que usa la administración española.',
    sources: ['MITECO', 'IGN', 'Catastro', 'OpenStreetMap'],
    attribution: 'Fuente: © Ministerio para la Transición Ecológica y el Reto Demográfico.',
  },
  offer: {
    eyebrow: 'Próximamente',
    title: 'Gratis para todos. Premium en camino.',
    sub: 'WildSpotter será gratis con todas las funciones principales: mapa, radar, puntuaciones y datos legales. Estamos preparando funciones premium como modo offline y vista satélite. Más detalles pronto.',
    highlights: [
      { label: 'Gratis para siempre', desc: 'Mapa completo, radar, puntuaciones y toda la información legal de cada spot. Sin anuncios.' },
      { label: 'Premium', desc: 'Funciones avanzadas como modo offline, vista satélite y filtros extra. Próximamente.' },
      { label: 'Datos oficiales', desc: 'Natura 2000, Parques Nacionales, Ley de Costas y Catastro cruzados en cada spot.' },
      { label: 'Sin opiniones', desc: 'Spots descubiertos por datos y análisis de satélite. Cero reseñas, cero masificación.' },
    ],
  },
  cta2: {
    title: 'El radar se enciende muy pronto.',
    sub: 'Déjanos tu correo y sé de los primeros en probar WildSpotter cuando lance.',
  },
  footer: {
    tag: 'WILDSPOTTER',
    sub: 'Un radar para furgoneteros. Hecho en España con cariño.',
    links: [
      { label: 'Privacidad', href: '/privacy' },
      { label: 'Contacto', href: 'mailto:hola@wildspotter.app' },
      { label: 'Instagram', href: 'https://instagram.com/wildspotter.app' },
      { label: 'TikTok', href: 'https://tiktok.com/@wildspotter.app' },
    ],
    copyright: '© 2026 WildSpotter',
  },
};

export type Dict = typeof es;
