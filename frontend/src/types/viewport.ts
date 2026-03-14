import type { PrecisionLevel } from './timeline';

export interface Viewport {
  fromYear: number;
  toYear: number;
  centerYear: number;
  zoomLevel: number;
  width: number;
  height: number;
}

export interface ZoomLevelConfig {
  level: number;
  name: string;
  nameKo: string;
  precisionLevel: PrecisionLevel;
  minRange: number;
  maxRange: number;
}
