import type { TimelineEvent, TimelineRequest, SearchParams } from '../types/timeline';

const BASE_URL = '/api/timelines';

export async function getTimelines(): Promise<TimelineEvent[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('Failed to fetch timelines');
  return res.json();
}

export async function getTimeline(id: number): Promise<TimelineEvent> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch timeline ${id}`);
  return res.json();
}

export async function searchTimelines(params: SearchParams): Promise<TimelineEvent[]> {
  const query = new URLSearchParams();
  if (params.fromYear !== undefined) query.set('fromYear', String(params.fromYear));
  if (params.toYear !== undefined) query.set('toYear', String(params.toYear));
  if (params.categoryId !== undefined) query.set('categoryId', String(params.categoryId));
  if (params.precisionLevel !== undefined) query.set('precisionLevel', params.precisionLevel);

  const res = await fetch(`${BASE_URL}/search?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to search timelines');
  return res.json();
}

export async function createTimeline(data: TimelineRequest): Promise<TimelineEvent> {
  const payload = {
    ...data,
    eventType: data.eventType ?? 'POINT',
    endYear: data.endYear,
    endMonth: data.endMonth,
    endDay: data.endDay,
  };
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create timeline');
  return res.json();
}

export async function updateTimeline(id: number, data: TimelineRequest): Promise<TimelineEvent> {
  const payload = {
    ...data,
    eventType: data.eventType ?? 'POINT',
    endYear: data.endYear,
    endMonth: data.endMonth,
    endDay: data.endDay,
  };
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update timeline ${id}`);
  return res.json();
}

export async function deleteTimeline(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete timeline ${id}`);
}
