import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Viewport } from '../../types/viewport';
import { yearToScreen, screenToYear } from '../scale/symlog';

const LINE_COLOR = 0xe8c8a0;
const LINE_ALPHA = 0.7;
const DASH_LENGTH = 6;
const GAP_LENGTH = 4;
const LINE_WIDTH = 1.5;
const HIT_TOLERANCE = 6;
const LABEL_BG_COLOR = 0x2a2520;
const LABEL_TEXT_COLOR = '#e8c8a0';

const labelStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 11,
  fill: LABEL_TEXT_COLOR,
});

export class ReferenceLineLayer {
  readonly container: Container;
  private lineGraphics: Graphics;
  private label: Text;
  private labelBg: Graphics;
  private _year: number | null = null;
  private _visible = false;

  constructor() {
    this.container = new Container();
    this.lineGraphics = new Graphics();
    this.labelBg = new Graphics();
    this.label = new Text({ text: '', style: labelStyle });
    this.label.anchor.set(0.5, 1);
    this.container.addChild(this.lineGraphics);
    this.container.addChild(this.labelBg);
    this.container.addChild(this.label);
    this.container.visible = false;
  }

  get year(): number | null {
    return this._year;
  }

  setYear(year: number): void {
    this._year = year;
    this._visible = true;
    this.container.visible = true;
  }

  clear(): void {
    this._year = null;
    this._visible = false;
    this.container.visible = false;
  }

  isVisible(): boolean {
    return this._visible;
  }

  hitTest(screenX: number, viewport: Viewport): boolean {
    if (!this._visible || this._year === null) return false;
    const lineX = yearToScreen(this._year, viewport);
    return Math.abs(screenX - lineX) <= HIT_TOLERANCE;
  }

  screenToYear(screenX: number, viewport: Viewport): number {
    return screenToYear(screenX, viewport);
  }

  update(viewport: Viewport, canvasHeight: number): void {
    if (!this._visible || this._year === null) return;

    const x = yearToScreen(this._year, viewport);
    const axisY = 0;

    this.lineGraphics.clear();

    // 화면 밖이면 숨김
    if (x < -10 || x > viewport.width + 10) {
      this.container.visible = false;
      return;
    }
    this.container.visible = true;

    // 점선 그리기
    let y = axisY;
    while (y < canvasHeight) {
      const endY = Math.min(y + DASH_LENGTH, canvasHeight);
      this.lineGraphics.moveTo(x, y);
      this.lineGraphics.lineTo(x, endY);
      this.lineGraphics.stroke({ width: LINE_WIDTH, color: LINE_COLOR, alpha: LINE_ALPHA });
      y += DASH_LENGTH + GAP_LENGTH;
    }

    // 라벨
    const labelText = this.formatYear(this._year);
    this.label.text = labelText;
    this.label.x = x;
    this.label.y = 56;

    // 라벨 배경
    const lw = this.label.width + 8;
    const lh = this.label.height + 4;
    this.labelBg.clear();
    this.labelBg.roundRect(x - lw / 2, 56 - lh, lw, lh, 3);
    this.labelBg.fill({ color: LABEL_BG_COLOR, alpha: 0.9 });
  }

  private formatYear(year: number): string {
    const absYear = Math.abs(year);
    const isBCE = year < 0;

    if (absYear >= 1_000_000_000) return `${(absYear / 1e9).toFixed(1)}B${isBCE ? ' BCE' : ''}`;
    if (absYear >= 1_000_000) return `${(absYear / 1e6).toFixed(1)}M${isBCE ? ' BCE' : ''}`;
    if (absYear >= 10_000) return `${(absYear / 1e3).toFixed(1)}K${isBCE ? ' BCE' : ''}`;

    const wholeYear = Math.floor(absYear);
    const frac = absYear - wholeYear;
    if (frac > 0.01) {
      const month = Math.floor(frac * 12) + 1;
      return `${wholeYear}년 ${month}월`;
    }
    if (isBCE) return `${wholeYear} BCE`;
    return `${wholeYear}년`;
  }

  destroy(): void {
    this.lineGraphics.destroy();
    this.label.destroy();
    this.labelBg.destroy();
    this.container.destroy();
  }
}
