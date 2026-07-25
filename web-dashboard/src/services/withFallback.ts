import type { AxiosResponse } from 'axios';

export async function withFallback<T>(
  request: () => Promise<AxiosResponse<T>>,
  fallback: () => Promise<T>,
  retries = 1,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await request();
      return res.data;
    } catch {
      if (attempt < retries) continue;
      return fallback();
    }
  }
  return fallback();
}

export function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
