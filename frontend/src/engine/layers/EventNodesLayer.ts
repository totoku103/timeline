import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { RenderNode } from '../../types/render';

const NODE_RADIUS = 12;
const HOVER_RADIUS = 16;
const RANGE_BAR_HEIGHT = 20;
const LABEL_MAX_WIDTH = 120;

const labelStyle = new TextStyle({
  fontFamily: 'sans-serif',
  fontSize: 10,
  fill: '#cccccc',
  wordWrap: true,
  wordWrapWidth: LABEL_MAX_WIDTH,
});

const hoverLabelStyle = new TextStyle({
  fontFamily: 'sans-serif',
  fontSize: 12,
  fill: '#ffffff',
  fontWeight: 'bold',
  wordWrap: true,
  wordWrapWidth: 200,
});

/**
 * Renders event nodes (circles for point events, range bars for range events) on the timeline.
 * Stem lines have been removed — y-coordinates are injected externally via CategoryLaneLayer.
 */
export class EventNodesLayer {
  readonly container: Container;

  private nodeGraphics: Graphics;
  private labelContainer: Container;
  private labels: Text[] = [];
  private labelPool: Text[] = [];

  private hoveredId: number | null = null;
  private selectedId: number | null = null;
  private currentNodes: RenderNode[] = [];

  constructor() {
    this.container = new Container();
    this.nodeGraphics = new Graphics();
    this.labelContainer = new Container();

    this.container.addChild(this.nodeGraphics);
    this.container.addChild(this.labelContainer);
  }

  update(nodes: RenderNode[]): void {
    this.currentNodes = nodes;
    this.render();
  }

  setHoveredNode(id: number | null): void {
    if (this.hoveredId === id) return;
    this.hoveredId = id;
    this.render();
  }

  setSelectedNode(id: number | null): void {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.render();
  }

  destroy(): void {
    this.labels.forEach(l => l.destroy());
    this.labelPool.forEach(l => l.destroy());
    this.nodeGraphics.destroy();
    this.labelContainer.destroy();
    this.container.destroy();
  }

  private render(): void {
    this.nodeGraphics.clear();
    this.recycleLabels();

    let labelIdx = 0;

    for (const node of this.currentNodes) {
      if (!node.visible) continue;

      const isHovered = node.id === this.hoveredId;
      const isSelected = node.id === this.selectedId;

      if (node.type === 'range' && node.endX != null) {
        // Range bar: 둥근 직사각형
        const barWidth = Math.max(node.endX - node.x, 4);

        // Glow for hovered
        if (isHovered) {
          this.nodeGraphics.roundRect(
            node.x - 2,
            node.y - RANGE_BAR_HEIGHT / 2 - 4,
            barWidth + 4,
            RANGE_BAR_HEIGHT + 8,
            6,
          );
          this.nodeGraphics.fill({ color: node.color, alpha: 0.2 });
        }

        // Range bar fill
        this.nodeGraphics.roundRect(node.x, node.y - RANGE_BAR_HEIGHT / 2, barWidth, RANGE_BAR_HEIGHT, 4);
        this.nodeGraphics.fill({ color: node.color, alpha: isHovered ? 0.9 : 0.7 });

        // Border on hover or selected
        if (isHovered || isSelected) {
          this.nodeGraphics.roundRect(node.x, node.y - RANGE_BAR_HEIGHT / 2, barWidth, RANGE_BAR_HEIGHT, 4);
          this.nodeGraphics.stroke({ width: 2, color: isSelected ? 0xffffff : node.color });
        }

        // Label above bar
        const text = this.getLabel(labelIdx++);
        text.text = isHovered ? node.label : this.truncateLabel(node.label, 15);
        text.style = isHovered ? hoverLabelStyle : labelStyle;
        text.x = node.x + barWidth / 2;
        text.y = node.y - RANGE_BAR_HEIGHT / 2 - 4;
        text.anchor.set(0.5, 1);
        text.visible = true;
      } else {
        // Point event: circle
        const radius = isHovered ? HOVER_RADIUS : NODE_RADIUS;

        // Glow for hovered
        if (isHovered) {
          this.nodeGraphics.circle(node.x, node.y, radius + 6);
          this.nodeGraphics.fill({ color: node.color, alpha: 0.2 });
        }

        // Uncertainty bar (point events only)
        if (node.width > NODE_RADIUS * 2) {
          const barHeight = 4;
          this.nodeGraphics.rect(
            node.x - node.width / 2,
            node.y - barHeight / 2,
            node.width,
            barHeight,
          );
          this.nodeGraphics.fill({ color: node.color, alpha: 0.4 });
        }

        // Circle fill
        this.nodeGraphics.circle(node.x, node.y, radius);
        this.nodeGraphics.fill({ color: node.color, alpha: isHovered ? 1 : 0.85 });

        // Selection border
        if (isSelected) {
          this.nodeGraphics.circle(node.x, node.y, radius + 3);
          this.nodeGraphics.stroke({ width: 2, color: 0xffffff });
        }

        // Label above circle
        const text = this.getLabel(labelIdx++);
        text.text = isHovered ? node.label : this.truncateLabel(node.label, 15);
        text.style = isHovered ? hoverLabelStyle : labelStyle;
        text.x = node.x;
        text.y = node.y - radius - 14;
        text.anchor.set(0.5, 1);
        text.visible = true;
      }
    }
  }

  private truncateLabel(label: string, maxLen: number): string {
    if (label.length <= maxLen) return label;
    return label.substring(0, maxLen - 1) + '…';
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
      this.labelContainer.addChild(text);
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
