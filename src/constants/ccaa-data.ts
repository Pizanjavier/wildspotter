export type CcaaStatus =
  | 'prohibited'
  | 'tolerated'
  | 'permitted'
  | 'ambiguous'
  | 'no_decree';

export type CcaaEntry = {
  id: string;
  name: string;
  status: CcaaStatus;
  maxHours: number | null;
  decree: string | null;
  conditions: string | null;
};

export const CCAA_DATA: readonly CcaaEntry[] = [
  { id: 'andalucia', name: 'Andalucía', status: 'ambiguous', maxHours: null, decree: 'Decreto 26/2018', conditions: null },
  { id: 'aragon', name: 'Aragón', status: 'tolerated', maxHours: 48, decree: 'Decreto 35/2023', conditions: 'noExternalElements' },
  { id: 'asturias', name: 'Asturias', status: 'tolerated', maxHours: 72, decree: 'Decreto 61/2022', conditions: 'noExternalElements' },
  { id: 'baleares', name: 'Baleares', status: 'prohibited', maxHours: 0, decree: 'Ley 8/2012', conditions: null },
  { id: 'canarias', name: 'Canarias', status: 'prohibited', maxHours: 0, decree: 'Ley 7/1995', conditions: null },
  { id: 'cantabria', name: 'Cantabria', status: 'ambiguous', maxHours: null, decree: 'Ley 5/1999', conditions: null },
  { id: 'castilla_la_mancha', name: 'Castilla-La Mancha', status: 'ambiguous', maxHours: null, decree: 'Ley 8/1999', conditions: null },
  { id: 'castilla_y_leon', name: 'Castilla y León', status: 'tolerated', maxHours: 48, decree: 'Decreto 25/2001', conditions: 'noExternalElements' },
  { id: 'cataluna', name: 'Cataluña', status: 'tolerated', maxHours: 24, decree: 'Decret 159/2012', conditions: 'noExternalElements' },
  { id: 'extremadura', name: 'Extremadura', status: 'permitted', maxHours: 72, decree: 'Decreto 120/2015', conditions: 'noExternalElements' },
  { id: 'galicia', name: 'Galicia', status: 'tolerated', maxHours: 48, decree: 'Decreto 144/2013', conditions: 'noExternalElements' },
  { id: 'la_rioja', name: 'La Rioja', status: 'tolerated', maxHours: 48, decree: null, conditions: 'noExternalElements' },
  { id: 'madrid', name: 'Madrid', status: 'no_decree', maxHours: null, decree: null, conditions: null },
  { id: 'murcia', name: 'Murcia', status: 'tolerated', maxHours: 48, decree: 'Decreto 37/2019', conditions: 'noExternalElements' },
  { id: 'navarra', name: 'Navarra', status: 'tolerated', maxHours: 48, decree: 'DF 230/2011', conditions: 'noExternalElements' },
  { id: 'pais_vasco', name: 'País Vasco', status: 'no_decree', maxHours: null, decree: null, conditions: null },
  { id: 'valencia', name: 'Valencia', status: 'ambiguous', maxHours: null, decree: 'Ley 3/1998', conditions: null },
] as const;

export const STATUS_SORT_ORDER: Record<CcaaStatus, number> = {
  prohibited: 0,
  ambiguous: 1,
  no_decree: 2,
  tolerated: 3,
  permitted: 4,
};
