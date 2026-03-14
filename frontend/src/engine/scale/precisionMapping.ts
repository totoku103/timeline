import type { PrecisionLevel } from '../../types/timeline';
import type { ZoomLevelConfig } from '../../types/viewport';

export const ZOOM_LEVELS: ZoomLevelConfig[] = [
  { level: 0, name: 'COSMIC', nameKo: '우주적', precisionLevel: 'BILLION_YEARS', minRange: 1_000_000_000, maxRange: 14_000_000_000 },
  { level: 1, name: 'GEOLOGICAL', nameKo: '지질학적', precisionLevel: 'HUNDRED_MILLION_YEARS', minRange: 100_000_000, maxRange: 1_000_000_000 },
  { level: 2, name: 'ERA', nameKo: '시대', precisionLevel: 'TEN_MILLION_YEARS', minRange: 10_000_000, maxRange: 100_000_000 },
  { level: 3, name: 'EPOCH', nameKo: '세', precisionLevel: 'MILLION_YEARS', minRange: 1_000_000, maxRange: 10_000_000 },
  { level: 4, name: 'PREHISTORIC', nameKo: '선사시대', precisionLevel: 'HUNDRED_THOUSAND_YEARS', minRange: 100_000, maxRange: 1_000_000 },
  { level: 5, name: 'ANCIENT', nameKo: '고대', precisionLevel: 'TEN_THOUSAND_YEARS', minRange: 10_000, maxRange: 100_000 },
  { level: 6, name: 'MILLENNIAL', nameKo: '천년', precisionLevel: 'MILLENNIUM', minRange: 1_000, maxRange: 10_000 },
  { level: 7, name: 'CENTURY', nameKo: '세기', precisionLevel: 'CENTURY', minRange: 100, maxRange: 1_000 },
  { level: 8, name: 'DECADE', nameKo: '연대', precisionLevel: 'DECADE', minRange: 10, maxRange: 100 },
  { level: 9, name: 'ANNUAL', nameKo: '연간', precisionLevel: 'YEAR', minRange: 1, maxRange: 10 },
  { level: 10, name: 'MONTHLY', nameKo: '월간', precisionLevel: 'MONTH', minRange: 1 / 12, maxRange: 1 },
  { level: 11, name: 'DAILY', nameKo: '일간', precisionLevel: 'DAY', minRange: 1 / 365, maxRange: 1 / 12 },
];

/**
 * 12 distinct category colors (hex numbers for PixiJS).
 */
export const CATEGORY_COLORS: Record<number, number> = {
  1: 0xe74c3c,  // red
  2: 0x3498db,  // blue
  3: 0x2ecc71,  // green
  4: 0xf39c12,  // orange
  5: 0x9b59b6,  // purple
  6: 0x1abc9c,  // teal
  7: 0xe67e22,  // dark orange
  8: 0xe91e63,  // pink
  9: 0x00bcd4,  // cyan
  10: 0x8bc34a, // light green
  11: 0xff9800, // amber
  12: 0x607d8b, // blue grey
};

const DEFAULT_COLOR = 0x95a5a6;

/**
 * Get the zoom level config that best matches the given year range.
 */
export function getZoomLevelForRange(yearRange: number): ZoomLevelConfig {
  const absRange = Math.abs(yearRange);

  for (const config of ZOOM_LEVELS) {
    if (absRange >= config.minRange && absRange <= config.maxRange) {
      return config;
    }
  }

  if (absRange > ZOOM_LEVELS[0].maxRange) return ZOOM_LEVELS[0];
  return ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
}

/**
 * Get precision level for a given zoom level number.
 */
export function getPrecisionForZoom(zoomLevel: number): PrecisionLevel {
  const config = getZoomLevelConfig(zoomLevel);
  return config.precisionLevel;
}

/**
 * Get zoom level config by level number, clamped to valid range.
 */
export function getZoomLevelConfig(level: number): ZoomLevelConfig {
  const clamped = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, Math.round(level)));
  return ZOOM_LEVELS[clamped];
}

/**
 * Get color for a category ID.
 */
export function getCategoryColor(categoryId: number): number {
  return CATEGORY_COLORS[categoryId] ?? DEFAULT_COLOR;
}
