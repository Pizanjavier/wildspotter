import { buildGeocodingUrl, geocode } from '@/services/geocoding';

describe('buildGeocodingUrl', () => {
  it('constructs the correct Nominatim URL with query parameters', () => {
    const url = buildGeocodingUrl('Madrid');
    expect(url).toContain('https://nominatim.openstreetmap.org/search');
    expect(url).toContain('q=Madrid');
    expect(url).toContain('format=json');
    expect(url).toContain('limit=5');
  });

  it('encodes special characters in the query', () => {
    const url = buildGeocodingUrl('Sierra de Grazalema');
    expect(url).toContain('q=Sierra+de+Grazalema');
  });

  it('includes all required parameters', () => {
    const url = buildGeocodingUrl('Barcelona');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('q')).toBe('Barcelona');
    expect(parsed.searchParams.get('format')).toBe('json');
    expect(parsed.searchParams.get('limit')).toBe('5');
  });
});

describe('geocode', () => {
  const mockResponse = [
    {
      display_name: 'Madrid, Community of Madrid, Spain',
      lat: '40.4167754',
      lon: '-3.7037902',
      boundingbox: ['40.3119774', '40.6437511', '-3.8889539', '-3.5179163'],
    },
    {
      display_name: 'Madrid, Iowa, United States',
      lat: '41.8775432',
      lon: '-93.8246684',
      boundingbox: ['41.8547', '41.9003', '-93.8542', '-93.7951'],
    },
  ];

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty array for empty query', async () => {
    const results = await geocode('');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns empty array for whitespace-only query', async () => {
    const results = await geocode('   ');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends request with correct User-Agent header', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await geocode('Madrid');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'WildSpotter/1.0',
        }),
      }),
    );
  });

  it('parses Nominatim response into GeocodingResult array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const results = await geocode('Madrid');

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      displayName: 'Madrid, Community of Madrid, Spain',
      lat: 40.4167754,
      lng: -3.7037902,
      boundingBox: [40.3119774, 40.6437511, -3.8889539, -3.5179163],
    });
  });

  it('handles response without bounding box', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            display_name: 'Some Place',
            lat: '10.0',
            lon: '20.0',
          },
        ]),
    });

    const results = await geocode('Some Place');

    expect(results[0].boundingBox).toBeUndefined();
  });

  it('throws on non-OK response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(geocode('Madrid')).rejects.toThrow(
      'Geocoding request failed: 429 Too Many Requests',
    );
  });
});
