import { API_BASE_URL } from '@/constants/config';

/** Build an absolute URL for a satellite tile from its relative DB path */
export const buildSatelliteUrl = (relativePath: string): string => {
  const filename = relativePath.split('/').pop() ?? relativePath;
  return `${API_BASE_URL}/satellite/${filename}`;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const buildUrl = (
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string => {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
};

export const post = async <T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const url = buildUrl(path);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text);
  }

  const data: T = await response.json();
  return data;
};

export const get = async <T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> => {
  const url = buildUrl(path, params);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body);
  }

  const data: T = await response.json();
  return data;
};
