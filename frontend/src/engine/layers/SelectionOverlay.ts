import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { RenderNode } from '../../types/render';
import type { TimelineEvent } from '../../types/timeline';

const TOOLTIP_BG = 0x1a1a2e;
const TOOLTIP_BORDER = 0x444466;
const TOOLTIP_PADDING = 12;
const TOOLTIP_MAX_WIDTH = 280;
const TOOLTIP_CORNER_RADIUS = 8;

const titleStyle = new TextStyle({
  fontFamily: 'sans-serif',
  fontSize: 13,
  fill: '#ffffff',
  fontWeight: 'bold',
  wordWrap: true,
  wordWrapWidth: TOOLTIP_MAX_WIDTH - TOOLTIP_PADDING * 2,
});

const metaStyle = new TextStyle({
  fontFamily: 'sans-serif',
  fontSize: 11,
  fill: '#8888aa',
  wordWrap: true,
  wordWrapWidth: TOOLTIP_MAX_WIDTH - TOOLTIP_PADDING * 2,
});

const descStyle = new TextStyle({
  fontFamily: 'sans-serif',
  fontSize: 11,
  fill: '#aaaacc',
  wordWrap: true,
  wordWrapWidth: TOOLTIP_MAX_WIDTH - TOOLTIP_PADDING * 2,
});

/**
 * Renders selection highlight and hover tooltip.
 */
export class SelectionOverlay {
  readonly container: Container;

  private tooltipContainer: Container;
  private bg: Graphics;
  private titleText: Text;
  private metaText: Text;
  private descText: Text;

  constructor() {
    this.container = new Container();
    this.tooltipContainer = new Container();
    this.tooltipContainer.visible = false;

    this.bg = new Graphics();
    this.titleText = new Text({ text: '', style: titleStyle });
    this.metaText = new Text({ text: '', style: metaStyle });
    this.descText = new Text({ text: '', style: descStyle });

    this.tooltipContainer.addChild(this.bg);
    this.tooltipContainer.addChild(this.titleText);
    this.tooltipContainer.addChild(this.metaText);
    this.tooltipContainer.addChild(this.descText);
    this.container.addChild(this.tooltipContainer);
  }

  showTooltip(_node: RenderNode, event: TimelineEvent, x: number, y: number): void {
    // Set text content
    this.titleText.text = event.title;

    const yearStr = this.formatYear(event.eventYear);
    const meta = [yearStr, event.categoryName];
    if (event.location) meta.push(event.location);
    this.metaText.text = meta.join(' · ');

    const descPreview = event.description.length > 120
      ? event.description.substring(0, 117) + '…'
      : event.description;
    this.descText.text = descPreview;

    // Layout text vertically
    this.titleText.x = TOOLTIP_PADDING;
    this.titleText.y = TOOLTIP_PADDING;

    this.metaText.x = TOOLTIP_PADDING;
    this.metaText.y = this.titleText.y + this.titleText.height + 4;

    this.descText.x = TOOLTIP_PADDING;
    this.descText.y = this.metaText.y + this.metaText.height + 8;

    // Calculate tooltip size
    const contentWidth = Math.max(
      this.titleText.width,
      this.metaText.width,
      this.descText.width,
    );
    const tooltipWidth = Math.min(TOOLTIP_MAX_WIDTH, contentWidth + TOOLTIP_PADDING * 2);
    const tooltipHeight = this.descText.y + this.descText.height + TOOLTIP_PADDING;

    // Draw background
    this.bg.clear();
    this.bg.roundRect(0, 0, tooltipWidth, tooltipHeight, TOOLTIP_CORNER_RADIUS);
    this.bg.fill({ color: TOOLTIP_BG, alpha: 0.95 });
    this.bg.stroke({ width: 1, color: TOOLTIP_BORDER });

    // Position tooltip near cursor/node, keeping within canvas
    let tx = x + 16;
    let ty = y - tooltipHeight - 8;

    // Keep within bounds (assume parent container tracks canvas size)
    if (ty < 4) ty = y + 20;
    // Right edge handled by parent clipping or adjusting
    this.tooltipContainer.x = tx;
    this.tooltipContainer.y = ty;
    this.tooltipContainer.visible = true;
  }

  hideTooltip(): void {
    this.tooltipContainer.visible = false;
  }

  /**
   * Adjust tooltip position to keep within canvas bounds.
   */
  constrainToCanvas(canvasWidth: number, canvasHeight: number): void {
    if (!this.tooltipContainer.visible) return;

    const bounds = this.tooltipContainer.getBounds();
    if (bounds.x + bounds.width > canvasWidth - 4) {
      this.tooltipContainer.x -= (bounds.x + bounds.width) - canvasWidth + 8;
    }
    if (bounds.y + bounds.height > canvasHeight - 4) {
      this.tooltipContainer.y -= (bounds.y + bounds.height) - canvasHeight + 8;
    }
    if (this.tooltipContainer.x < 4) this.tooltipContainer.x = 4;
    if (this.tooltipContainer.y < 4) this.tooltipContainer.y = 4;
  }

  destroy(): void {
    this.titleText.destroy();
    this.metaText.destroy();
    this.descText.destroy();
    this.bg.destroy();
    this.tooltipContainer.destroy();
    this.container.destroy();
  }

  private formatYear(year: number): string {
    const abs = Math.abs(year);
    if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)}B ${year < 0 ? 'BCE' : ''}`.trim();
    if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M ${year < 0 ? 'BCE' : ''}`.trim();
    if (abs >= 10_000) return `${(abs / 1_000).toFixed(1)}K ${year < 0 ? 'BCE' : ''}`.trim();
    if (year < 0) return `${abs} BCE`;
    return `${Math.round(year)}`;
  }
}
