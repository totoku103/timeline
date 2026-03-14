import type { Viewport } from '../../types/viewport';

const DEFAULT_C = 1;

/**
 * Symmetric logarithmic transform.
 * Handles negative years (BCE) symmetrically around zero.
 * Formula: sign(x) * log1p(|x / C|)
 */
export function symlog(year: number, C: number = DEFAULT_C): number {
  return Math.sign(year) * Math.log1p(Math.abs(year / C));
}

/**
 * Inverse symmetric logarithmic transform.
 * Formula: sign(v) * C * (exp(|v|) - 1)
 */
export function symlogInverse(value: number, C: number = DEFAULT_C): number {
  return Math.sign(value) * C * (Math.exp(Math.abs(value)) - 1);
}

/**
 * Convert a year to a screen X coordinate within the given viewport.
 */
export function yearToScreen(year: number, viewport: Viewport): number {
  const fromLog = symlog(viewport.fromYear);
  const toLog = symlog(viewport.toYear);
  const yearLog = symlog(year);

  const logRange = toLog - fromLog;
  if (logRange === 0) return viewport.width / 2;

  const PADDING_LEFT = 40;
  const PADDING_RIGHT = 40;
  const usableWidth = viewport.width - PADDING_LEFT - PADDING_RIGHT;

  const ratio = (yearLog - fromLog) / logRange;
  return PADDING_LEFT + ratio * usableWidth;
}

/**
 * Convert a screen X coordinate to a year within the given viewport.
 */
export function screenToYear(screenX: number, viewport: Viewport): number {
  const fromLog = symlog(viewport.fromYear);
  const toLog = symlog(viewport.toYear);

  const PADDING_LEFT = 40;
  const PADDING_RIGHT = 40;
  const usableWidth = viewport.width - PADDING_LEFT - PADDING_RIGHT;

  const ratio = (screenX - PADDING_LEFT) / usableWidth;
  const logValue = fromLog + ratio * (toLog - fromLog);

  return symlogInverse(logValue);
}
