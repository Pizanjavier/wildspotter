const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'WildSpotter/1.0';
const MAX_RESULTS = 5;

export type GeocodingResult = {
  displayName: string;
  lat: number;
  lng: number;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
};

type NominatimResponse = ReadonlyArray<{
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
}>;

export const buildGeocodingUrl = (query: string): string => {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: String(MAX_RESULTS),
  });
  return `${NOMINATIM_BASE_URL}?${params.toString()}`;
};

const parseResult = (item: NominatimResponse[number]): GeocodingResult => {
  const result: GeocodingResult = {
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  };

  if (item.boundingbox && item.boundingbox.length === 4) {
    result.boundingBox = [
      parseFloat(item.boundingbox[0]),
      parseFloat(item.boundingbox[1]),
      parseFloat(item.boundingbox[2]),
      parseFloat(item.boundingbox[3]),
    ];
  }

  return result;
};

export const geocode = async (
  query: string,
): Promise<GeocodingResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const url = buildGeocodingUrl(trimmed);

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Geocoding request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data: NominatimResponse = await response.json();

  return data.map(parseResult);
};
