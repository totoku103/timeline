import type { Viewport } from '../../types/viewport';
import { symlog, symlogInverse } from './symlog';
import { getZoomLevelForRange } from './precisionMapping';

const MIN_RANGE = 0.001;
const MAX_RANGE = 14_000_000_000;
const MIN_YEAR = -13_800_000_000;
const MAX_YEAR = 2100;

export class ViewportManager {
  private viewport: Viewport;
  private onViewportChange: (viewport: Viewport) => void;
  private dirty = false;

  constructor(width: number, height: number, onChange: (v: Viewport) => void) {
    this.onViewportChange = onChange;
    this.viewport = {
      fromYear: MIN_YEAR,
      toYear: MAX_YEAR,
      centerYear: 0,
      zoomLevel: 0,
      width,
      height,
    };
    this.recalculate();
  }

  zoom(delta: number, cursorX: number): void {
    const { fromYear, toYear, width } = this.viewport;

    const fromLog = symlog(fromYear);
    const toLog = symlog(toYear);
    const cursorRatio = cursorX / width;
    const cursorLog = fromLog + cursorRatio * (toLog - fromLog);

    // Zoom factor: positive delta zooms in (shrinks range)
    const factor = Math.pow(1.1, -delta);

    let newFromLog = cursorLog + (fromLog - cursorLog) * factor;
    let newToLog = cursorLog + (toLog - cursorLog) * factor;

    let newFrom = symlogInverse(newFromLog);
    let newTo = symlogInverse(newToLog);

    // Enforce range limits
    const range = newTo - newFrom;
    if (range < MIN_RANGE) {
      const center = symlogInverse(cursorLog);
      newFrom = center - MIN_RANGE / 2;
      newTo = center + MIN_RANGE / 2;
    } else if (range > MAX_RANGE) {
      newFrom = MIN_YEAR;
      newTo = MAX_YEAR;
    }

    // Clamp bounds
    newFrom = Math.max(MIN_YEAR, newFrom);
    newTo = Math.min(MAX_YEAR, newTo);

    this.viewport.fromYear = newFrom;
    this.viewport.toYear = newTo;
    this.recalculate();
    this.notifyChange();
  }

  pan(deltaX: number): void {
    const { fromYear, toYear, width } = this.viewport;

    const fromLog = symlog(fromYear);
    const toLog = symlog(toYear);
    const logRange = toLog - fromLog;

    // Convert pixel delta to log-space delta
    const logDelta = -(deltaX / width) * logRange;

    let newFromLog = fromLog + logDelta;
    let newToLog = toLog + logDelta;

    let newFrom = symlogInverse(newFromLog);
    let newTo = symlogInverse(newToLog);

    // Clamp to absolute bounds
    if (newFrom < MIN_YEAR) {
      const shift = MIN_YEAR - newFrom;
      newFrom = MIN_YEAR;
      newTo += shift;
    }
    if (newTo > MAX_YEAR) {
      const shift = newTo - MAX_YEAR;
      newTo = MAX_YEAR;
      newFrom -= shift;
    }

    newFrom = Math.max(MIN_YEAR, newFrom);
    newTo = Math.min(MAX_YEAR, newTo);

    this.viewport.fromYear = newFrom;
    this.viewport.toYear = newTo;
    this.recalculate();
    this.notifyChange();
  }

  setRange(fromYear: number, toYear: number): void {
    this.viewport.fromYear = Math.max(MIN_YEAR, fromYear);
    this.viewport.toYear = Math.min(MAX_YEAR, toYear);
    this.recalculate();
    this.notifyChange();
  }

  resize(width: number, height: number): void {
    this.viewport.width = width;
    this.viewport.height = height;
    this.notifyChange();
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  getYearRange(): number {
    return this.viewport.toYear - this.viewport.fromYear;
  }

  getCenterYear(): number {
    return this.viewport.centerYear;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  clearDirty(): void {
    this.dirty = false;
  }

  private recalculate(): void {
    const { fromYear, toYear } = this.viewport;
    this.viewport.centerYear = (fromYear + toYear) / 2;
    const config = getZoomLevelForRange(toYear - fromYear);
    this.viewport.zoomLevel = config.level;
  }

  private notifyChange(): void {
    this.dirty = true;
    this.onViewportChange(this.getViewport());
  }
}
