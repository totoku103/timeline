import type { Country } from '../types/timeline';

const BASE_URL = '/api/countries';

export async function getCountries(): Promise<Country[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('Failed to fetch countries');
  return res.json();
}
