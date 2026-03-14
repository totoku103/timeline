import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CategoryRowConfig } from '../data/NodeTransformer';
import { getCategoryColor } from '../scale/precisionMapping';

export const AXIS_HEIGHT = 60;
export const ROW_PADDING = 8;
export const SUB_LANE_HEIGHT = 50;
export const LANE_HEADER_WIDTH = 120;

export interface CategoryRowLayout {
  categoryId: number;
  categoryName: string;
  rowIndex: number;
  subLaneCount: number;
  y: number;
  height: number;
}

const headerStyle = new TextStyle({
  fontFamily: 'sans-serif',
  fontSize: 12,
  fill: '#aaaacc',
  fontWeight: 'bold',
});

const EVEN_BG_COLOR = 0x0e0e24;
const ODD_BG_COLOR = 0x0a0a1a;
const DIVIDER_COLOR = 0x222244;
const STRIPE_WIDTH = 4;

export class CategoryLaneLayer {
  readonly container: Container;
  private bgGraphics: Graphics;
  private headerGraphics: Graphics;
  private headerLabels: Text[] = [];
  private labelPool: Text[] = [];
  private layouts: CategoryRowLayout[] = [];

  constructor() {
    this.container = new Container();
    this.bgGraphics = new Graphics();
    this.headerGraphics = new Graphics();
    this.container.addChild(this.bgGraphics);
    this.container.addChild(this.headerGraphics);
  }

  update(rowConfigs: CategoryRowConfig[], canvasWidth: number): void {
    this.bgGraphics.clear();
    this.headerGraphics.clear();
    this.recycleLabels();

    // 1. 각 Row의 y, height 계산
    const layouts: CategoryRowLayout[] = [];
    let currentY = AXIS_HEIGHT;

    for (const config of rowConfigs) {
      const height = config.subLaneCount * SUB_LANE_HEIGHT + ROW_PADDING * 2;
      layouts.push({
        categoryId: config.categoryId,
        categoryName: config.categoryName,
        rowIndex: config.rowIndex,
        subLaneCount: config.subLaneCount,
        y: currentY,
        height,
      });
      currentY += height;
    }

    this.layouts = layouts;

    // 2. 교대 배경색 + 헤더 + 구분선
    let labelIdx = 0;
    for (const layout of layouts) {
      const bgColor = layout.rowIndex % 2 === 0 ? EVEN_BG_COLOR : ODD_BG_COLOR;

      // 배경
      this.bgGraphics.rect(0, layout.y, canvasWidth, layout.height);
      this.bgGraphics.fill({ color: bgColor });

      // 헤더 배경 (어둡게)
      this.headerGraphics.rect(0, layout.y, LANE_HEADER_WIDTH, layout.height);
      this.headerGraphics.fill({ color: bgColor });

      // 카테고리 색상 스트라이프 (세로 4px 바)
      const stripeColor = getCategoryColor(layout.categoryId);
      this.headerGraphics.rect(0, layout.y, STRIPE_WIDTH, layout.height);
      this.headerGraphics.fill({ color: stripeColor, alpha: 0.9 });

      // Row 구분선 (하단)
      this.bgGraphics.moveTo(0, layout.y + layout.height);
      this.bgGraphics.lineTo(canvasWidth, layout.y + layout.height);
      this.bgGraphics.stroke({ width: 1, color: DIVIDER_COLOR });

      // 카테고리 이름 텍스트
      const text = this.getLabel(labelIdx++);
      text.text = layout.categoryName;
      text.x = STRIPE_WIDTH + 8;
      text.y = layout.y + layout.height / 2;
      text.anchor.set(0, 0.5);
      text.visible = true;
    }
  }

  /**
   * RenderNode의 categoryRow와 subLane으로 실제 y좌표 계산
   */
  getNodeY(categoryRow: number, subLane: number): number {
    const layout = this.layouts[categoryRow];
    if (!layout) return AXIS_HEIGHT + SUB_LANE_HEIGHT / 2;
    return layout.y + ROW_PADDING + subLane * SUB_LANE_HEIGHT + SUB_LANE_HEIGHT / 2;
  }

  /**
   * 전체 콘텐츠 높이 (스크롤 계산용)
   */
  getTotalHeight(): number {
    if (this.layouts.length === 0) return AXIS_HEIGHT;
    const last = this.layouts[this.layouts.length - 1];
    return last.y + last.height;
  }

  getLayouts(): CategoryRowLayout[] {
    return this.layouts;
  }

  destroy(): void {
    this.headerLabels.forEach(l => l.destroy());
    this.labelPool.forEach(l => l.destroy());
    this.bgGraphics.destroy();
    this.headerGraphics.destroy();
    this.container.destroy();
  }

  private getLabel(index: number): Text {
    if (index < this.headerLabels.length) {
      return this.headerLabels[index];
    }

    let text: Text;
    if (this.labelPool.length > 0) {
      text = this.labelPool.pop()!;
      text.visible = true;
    } else {
      text = new Text({ text: '', style: headerStyle });
      this.container.addChild(text);
    }

    this.headerLabels.push(text);
    return text;
  }

  private recycleLabels(): void {
    for (const label of this.headerLabels) {
      label.visible = false;
      this.labelPool.push(label);
    }
    this.headerLabels = [];
  }
}
