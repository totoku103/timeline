export type PrecisionLevel =
  | 'BILLION_YEARS'
  | 'HUNDRED_MILLION_YEARS'
  | 'TEN_MILLION_YEARS'
  | 'MILLION_YEARS'
  | 'HUNDRED_THOUSAND_YEARS'
  | 'TEN_THOUSAND_YEARS'
  | 'MILLENNIUM'
  | 'CENTURY'
  | 'DECADE'
  | 'YEAR'
  | 'MONTH'
  | 'DAY'
  | 'HOUR'
  | 'MINUTE'
  | 'SECOND';

export interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  categoryIds: number[];
  categoryNames: string[];
  eventYear: number;
  precisionLevel: PrecisionLevel;
  eventMonth: number | null;
  eventDay: number | null;
  eventType: 'POINT' | 'RANGE';
  endYear?: number;
  endMonth?: number;
  endDay?: number;
  sortOrder: number;
  eventLocalDateTime: string | null;
  eventUtcDateTime: string | null;
  timeZone: string | null;
  uncertaintyYears: number | null;
  location: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface TimelineRequest {
  title: string;
  description?: string;
  categoryIds: number[];
  eventYear: number;
  precisionLevel: PrecisionLevel;
  eventMonth?: number;
  eventDay?: number;
  eventType?: 'POINT' | 'RANGE';
  endYear?: number;
  endMonth?: number;
  endDay?: number;
  sortOrder?: number;
  eventLocalDateTime?: string;
  eventUtcDateTime?: string;
  timeZone?: string;
  uncertaintyYears?: number;
  location?: string;
  source?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SearchParams {
  fromYear?: number;
  toYear?: number;
  categoryId?: number;
  precisionLevel?: PrecisionLevel;
}
