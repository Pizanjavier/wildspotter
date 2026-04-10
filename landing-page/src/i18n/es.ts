export const es = {
  locale: 'es',
  nav: {
    skip: 'Saltar al contenido',
  },
  hero: {
    headline: 'Los mejores spots no están en ninguna app.',
    subtitle: 'Un radar que cruza datos oficiales para encontrar rincones salvajes en España. Sin reseñas. Sin multitudes. Sin sorpresas.',
    emailPlaceholder: 'tu@correo.com',
    cta: 'Avísame del lanzamiento',
    promise: 'La app será gratis para todos. Los primeros 500 en apuntarse bloquean además el precio premium Pioneer: 24,99 €/año, para siempre.',
    counterLabel: 'plazas Pioneer',
    microcopy: 'Sin spam. Doble confirmación. Puedes darte de baja cuando quieras.',
    thanks: 'Hecho. Revisa tu correo para confirmar.',
    successTitle: 'Revisa tu correo',
    successBody: 'Te hemos enviado un enlace a {email}. Haz clic para confirmar tu plaza Pioneer.',
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
    eyebrow: 'Precios al lanzamiento',
    title: 'La app es gratis. Pioneer bloquea el precio premium para siempre.',
    sub: 'Scout es gratis, con mapa, puntuaciones y toda la información legal. Explorer añade offline y vista satélite. Pioneer es el mismo Explorer, pero con el precio congelado de por vida para los primeros 500 de la lista.',
    scout: {
      label: 'Scout',
      price: '0',
      per: '€ para siempre',
      note: 'La app entera, gratis. Sin anuncios.',
      features: [
        'Mapa y radar con toda España',
        'Puntuación completa por spot',
        'Datos legales: Natura 2000, parques, costas, catastro',
        'Abrir en Google Maps / navegar',
      ],
    },
    explorer: {
      label: 'Explorer',
      price: '34,99',
      per: '€ / año',
      note: 'El precio estándar cuando salgamos a las stores.',
      features: [
        'Todo lo de Scout',
        'Guarda zonas para usar sin cobertura',
        'Vista previa satélite por spot',
        'Filtros avanzados (pendiente, tipo de suelo)',
      ],
    },
    pioneer: {
      label: 'Pioneer',
      badge: 'Primeros 500',
      price: '24,99',
      per: '€ / año',
      note: 'Mismo Explorer. Precio bloqueado de por vida. Solo para quienes dejen el email antes del lanzamiento.',
      features: [
        'Todo lo de Explorer',
        'Precio vitalicio, nunca sube',
        'Insignia Pioneer en tu perfil',
        'Acceso prioritario el día del lanzamiento',
      ],
      tagline: 'Ahorras 10 € cada año. Para siempre.',
    },
  },
  cta2: {
    title: 'El radar se enciende muy pronto.',
    sub: 'Déjanos tu correo. La app será gratis; los primeros 500 bloquean además el precio Pioneer.',
  },
  footer: {
    tag: 'WILDSPOTTER',
    sub: 'Un radar para furgoneteros. Hecho en España con cariño.',
    links: [
      { label: 'Privacidad', href: '/privacy' },
      { label: 'Contacto', href: 'mailto:hola@wildspotter.app' },
      { label: 'Instagram', href: 'https://instagram.com/wildspotter' },
      { label: 'TikTok', href: 'https://tiktok.com/@wildspotter' },
    ],
    copyright: '© 2026 WildSpotter',
  },
};

export type Dict = typeof es;
