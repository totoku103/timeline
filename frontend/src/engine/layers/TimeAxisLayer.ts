import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Viewport } from '../../types/viewport';
import { yearToScreen, symlog, symlogInverse } from '../scale/symlog';
import { getZoomLevelForRange } from '../scale/precisionMapping';

const AXIS_COLOR = 0x444466;
const TICK_COLOR = 0x666688;
const MINOR_TICK_COLOR = 0x333355;
const LABEL_COLOR = '#ccccdd';
const AXIS_HEIGHT = 60;
const MAJOR_TICK_HEIGHT = 16;
const MINOR_TICK_HEIGHT = 8;

const labelStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 11,
  fill: LABEL_COLOR,
});

/**
 * Renders the horizontal time axis with ticks and labels.
 */
export class TimeAxisLayer {
  readonly container: Container;
  private axisLine: Graphics;
  private ticksGraphics: Graphics;
  private labels: Text[] = [];
  private labelPool: Text[] = [];

  constructor() {
    this.container = new Container();
    this.axisLine = new Graphics();
    this.ticksGraphics = new Graphics();
    this.container.addChild(this.axisLine);
    this.container.addChild(this.ticksGraphics);
  }

  update(viewport: Viewport, canvasWidth: number, _canvasHeight: number): void {
    const axisY = AXIS_HEIGHT;

    // Clear previous
    this.axisLine.clear();
    this.ticksGraphics.clear();
    this.recycleLabels();

    // Draw axis line at y=AXIS_HEIGHT
    this.axisLine.moveTo(0, axisY);
    this.axisLine.lineTo(canvasWidth, axisY);
    this.axisLine.stroke({ width: 1, color: AXIS_COLOR });

    // Calculate tick intervals
    const ticks = this.calculateTicks(viewport);
    let labelIdx = 0;

    for (const tick of ticks) {
      const x = yearToScreen(tick.year, viewport);
      if (x < -50 || x > canvasWidth + 50) continue;

      const tickHeight = tick.major ? MAJOR_TICK_HEIGHT : MINOR_TICK_HEIGHT;
      const tickColor = tick.major ? TICK_COLOR : MINOR_TICK_COLOR;

      // Tick goes upward from axis line (toward top of canvas)
      this.ticksGraphics.moveTo(x, axisY);
      this.ticksGraphics.lineTo(x, axisY - tickHeight);
      this.ticksGraphics.stroke({ width: tick.major ? 1.5 : 0.5, color: tickColor });

      if (tick.major && tick.label) {
        const text = this.getLabel(labelIdx++);
        text.text = tick.label;
        text.x = x;
        text.y = axisY - MAJOR_TICK_HEIGHT - 4;
        text.anchor.set(0.5, 1);
        text.visible = true;
      }
    }
  }

  destroy(): void {
    this.labels.forEach(l => l.destroy());
    this.labelPool.forEach(l => l.destroy());
    this.axisLine.destroy();
    this.ticksGraphics.destroy();
    this.container.destroy();
  }

  private calculateTicks(viewport: Viewport): Array<{ year: number; major: boolean; label: string | null }> {
    const yearRange = viewport.toYear - viewport.fromYear;
    const config = getZoomLevelForRange(yearRange);
    const interval = this.getTickInterval(config.level, yearRange);
    void (interval / 5); // minorInterval unused; minor steps computed per-gap below

    const ticks: Array<{ year: number; major: boolean; label: string | null }> = [];

    // Generate ticks in log space for uniform visual distribution
    const fromLog = symlog(viewport.fromYear);
    const toLog = symlog(viewport.toYear);
    const logRange = toLog - fromLog;

    // Target ~15-25 major ticks across the screen
    const targetMajorTicks = 20;
    const logStep = logRange / targetMajorTicks;

    if (logStep <= 0) return ticks;

    // Generate major ticks
    for (let i = 0; i <= targetMajorTicks + 1; i++) {
      const logVal = fromLog + i * logStep;
      const year = symlogInverse(logVal);
      const snappedYear = this.snapYear(year, interval);

      // Avoid duplicate snapped years
      if (ticks.length > 0) {
        const lastTick = ticks[ticks.length - 1];
        if (Math.abs(lastTick.year - snappedYear) < interval * 0.1) continue;
      }

      ticks.push({
        year: snappedYear,
        major: true,
        label: this.formatYear(snappedYear, config.level),
      });
    }

    // Add minor ticks between major ticks
    const majorTicks = [...ticks];
    for (let i = 0; i < majorTicks.length - 1; i++) {
      const from = majorTicks[i].year;
      const to = majorTicks[i + 1].year;
      const gap = to - from;
      const minorStep = gap / 5;

      for (let j = 1; j < 5; j++) {
        const minorYear = from + j * minorStep;
        ticks.push({ year: minorYear, major: false, label: null });
      }
    }

    return ticks;
  }

  private getTickInterval(_level: number, yearRange: number): number {
    if (yearRange > 10_000_000_000) return 1_000_000_000;
    if (yearRange > 1_000_000_000) return 100_000_000;
    if (yearRange > 100_000_000) return 10_000_000;
    if (yearRange > 10_000_000) return 1_000_000;
    if (yearRange > 1_000_000) return 100_000;
    if (yearRange > 100_000) return 10_000;
    if (yearRange > 10_000) return 1_000;
    if (yearRange > 1_000) return 100;
    if (yearRange > 100) return 10;
    if (yearRange > 10) return 1;
    if (yearRange > 1) return 1 / 12;
    return 1 / 365;
  }

  private snapYear(year: number, interval: number): number {
    if (interval >= 1) {
      return Math.round(year / interval) * interval;
    }
    return Math.round(year * 1000) / 1000;
  }

  private formatYear(year: number, zoomLevel: number): string {
    const absYear = Math.abs(year);
    const suffix = year < 0 ? ' BCE' : '';

    if (absYear >= 1_000_000_000) {
      const val = absYear / 1_000_000_000;
      return `${val.toFixed(1)}B${suffix}`;
    }
    if (absYear >= 1_000_000) {
      const val = absYear / 1_000_000;
      return `${val.toFixed(val >= 100 ? 0 : 1)}M${suffix}`;
    }
    if (absYear >= 10_000) {
      const val = absYear / 1_000;
      return `${val.toFixed(val >= 100 ? 0 : 1)}K${suffix}`;
    }
    if (zoomLevel >= 10) {
      // Monthly: show year and month
      const wholeYear = Math.floor(absYear);
      const monthFrac = (absYear - wholeYear) * 12;
      const month = Math.round(monthFrac) + 1;
      if (month >= 1 && month <= 12) {
        return `${wholeYear}년 ${month}월`;
      }
    }
    if (zoomLevel >= 9) {
      return `${Math.round(absYear)}년${suffix ? ' ' + suffix : ''}`;
    }

    return `${Math.round(absYear)}${suffix}`;
  }

  private getLabel(index: number): Text {
    if (index < this.labels.length) {
      return this.labels[index];
    }

    let text: Text;
    if (this.labelPool.length > 0) {
      text = this.labelPool.pop()!;
      text.visible = true;
    } else {
      text = new Text({ text: '', style: labelStyle });
      this.container.addChild(text);
    }

    this.labels.push(text);
    return text;
  }

  private recycleLabels(): void {
    for (const label of this.labels) {
      label.visible = false;
      this.labelPool.push(label);
    }
    this.labels = [];
  }
}
