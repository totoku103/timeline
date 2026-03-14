import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Viewport } from '../../types/viewport';
import { yearToScreen } from '../scale/symlog';
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
    let lastLabelX = -Infinity;
    const MIN_LABEL_GAP = 40; // 라벨 간 최소 픽셀 간격

    for (const tick of ticks) {
      const x = yearToScreen(tick.year, viewport);
      if (x < -50 || x > canvasWidth + 50) continue;

      const tickHeight = tick.major ? MAJOR_TICK_HEIGHT : MINOR_TICK_HEIGHT;
      const tickColor = tick.major ? TICK_COLOR : MINOR_TICK_COLOR;

      this.ticksGraphics.moveTo(x, axisY);
      this.ticksGraphics.lineTo(x, axisY - tickHeight);
      this.ticksGraphics.stroke({ width: tick.major ? 1.5 : 0.5, color: tickColor });

      // 라벨이 이전 라벨과 너무 가까우면 숨김
      if (tick.major && tick.label && (x - lastLabelX) >= MIN_LABEL_GAP) {
        const text = this.getLabel(labelIdx++);
        text.text = tick.label;
        text.x = x;
        text.y = axisY - MAJOR_TICK_HEIGHT - 4;
        text.anchor.set(0.5, 1);
        text.visible = true;
        lastLabelX = x;
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

    const ticks: Array<{ year: number; major: boolean; label: string | null }> = [];

    // interval 간격으로 major tick 생성 (symlog 위치는 yearToScreen이 처리)
    const startYear = Math.ceil(viewport.fromYear / interval) * interval;
    const endYear = viewport.toYear;

    for (let year = startYear; year <= endYear; year += interval) {
      ticks.push({
        year,
        major: true,
        label: this.formatYear(year, config.level),
      });
      // 너무 많은 tick 방지 (최대 50개)
      if (ticks.length > 50) break;
    }

    // 주요 tick 사이에 minor tick 5개 삽입
    const majorTicks = [...ticks];
    for (let i = 0; i < majorTicks.length - 1; i++) {
      const from = majorTicks[i].year;
      const to = majorTicks[i + 1].year;
      const minorStep = (to - from) / 5;

      for (let j = 1; j < 5; j++) {
        ticks.push({ year: from + j * minorStep, major: false, label: null });
      }
    }

    return ticks;
  }

  /**
   * 목표 15~25개 major tick이 되도록 "예쁜" 간격을 자동 선택.
   * 1, 2, 5, 10, 20, 50, 100, ... 계열에서 선택.
   */
  private getTickInterval(_level: number, yearRange: number): number {
    if (yearRange < 1) return 1 / 12;

    const TARGET_TICKS = 20;
    const rawInterval = yearRange / TARGET_TICKS;

    // "예쁜" 간격 후보: 1, 2, 5 × 10^n
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
    const candidates = [1, 2, 5, 10].map(m => m * magnitude);

    // 목표 tick 수에 가장 가까운 후보 선택
    let best = candidates[0];
    let bestDiff = Infinity;
    for (const c of candidates) {
      const ticks = yearRange / c;
      const diff = Math.abs(ticks - TARGET_TICKS);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = c;
      }
    }
    return Math.max(best, 1 / 12);
    return 1 / 365;
  }

  private formatYear(year: number, zoomLevel: number): string {
    const absYear = Math.abs(year);
    const isBCE = year < 0;
    const eraLabel = isBCE ? ' BCE' : '';

    // 0년 근처
    if (absYear < 1) return '0';

    if (absYear >= 1_000_000_000) {
      const val = absYear / 1_000_000_000;
      return `${val.toFixed(1)}B${eraLabel}`;
    }
    if (absYear >= 1_000_000) {
      const val = absYear / 1_000_000;
      return `${val.toFixed(val >= 100 ? 0 : 1)}M${eraLabel}`;
    }
    if (absYear >= 10_000) {
      const val = absYear / 1_000;
      return `${val.toFixed(val >= 100 ? 0 : 1)}K${eraLabel}`;
    }
    if (zoomLevel >= 10) {
      const wholeYear = Math.floor(absYear);
      const monthFrac = (absYear - wholeYear) * 12;
      const month = Math.round(monthFrac) + 1;
      if (month >= 1 && month <= 12) {
        return `${wholeYear}년 ${month}월`;
      }
    }

    // 일반 연도: "1800년", "500 BCE"
    const rounded = Math.round(absYear);
    if (isBCE) {
      return `${rounded} BCE`;
    }
    return `${rounded}년`;
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
