import type { TimelineEvent } from '../../types/timeline';

/**
 * Simple interval-based spatial index using sorted array + binary search.
 */
export class SpatialIndex {
  private events: TimelineEvent[] = [];

  build(events: TimelineEvent[]): void {
    this.events = [...events].sort((a, b) => a.eventYear - b.eventYear);
  }

  /**
   * Query all events within the year range [fromYear, toYear].
   */
  query(fromYear: number, toYear: number): TimelineEvent[] {
    if (this.events.length === 0) return [];

    const startIdx = this.lowerBound(fromYear);
    const endIdx = this.upperBound(toYear);

    if (startIdx >= this.events.length || endIdx < 0 || startIdx > endIdx) {
      return [];
    }

    return this.events.slice(startIdx, endIdx + 1);
  }

  clear(): void {
    this.events = [];
  }

  /**
   * Find the first index where eventYear >= target.
   */
  private lowerBound(target: number): number {
    let lo = 0;
    let hi = this.events.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.events[mid].eventYear < target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    return lo;
  }

  /**
   * Find the last index where eventYear <= target.
   */
  private upperBound(target: number): number {
    let lo = 0;
    let hi = this.events.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.events[mid].eventYear <= target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    return lo - 1;
  }
}
