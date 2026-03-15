import { Container, Graphics } from 'pixi.js';
import type { TimelineEvent, Category } from '../../types/timeline';
import type { Viewport } from '../../types/viewport';
import type { CategoryRowConfig } from '../data/NodeTransformer';
import { symlog, symlogInverse } from '../scale/symlog';
import { getCategoryColor } from '../scale/precisionMapping';

const MINIMAP_WIDTH = 240;
const MINIMAP_HEIGHT = 60;
const MINIMAP_MARGIN = 12;
const PADDING = 4;
const BG_COLOR = 0x1a1816;
const BG_ALPHA = 0.85;
const BORDER_COLOR = 0x3d3630;
const VIEWPORT_COLOR = 0xc4927a;
const VIEWPORT_ALPHA = 0.3;
const VIEWPORT_BORDER_ALPHA = 0.8;

export class MinimapLayer {
  readonly container: Container;
  private bg: Graphics;
  private nodesGraphics: Graphics;
  private viewportIndicator: Graphics;
  private clipMask: Graphics;
  private allEvents: TimelineEvent[] = [];
  private categoryRowMap = new Map<number, number>();
  private rowCount = 1;
  private rowConfigs: CategoryRowConfig[] = [];
  private dataMinYear = -13_800_000_000;
  private dataMaxYear = 2100;

  constructor() {
    this.container = new Container();
    this.bg = new Graphics();
    this.nodesGraphics = new Graphics();
    this.viewportIndicator = new Graphics();
    this.clipMask = new Graphics();
    this.nodesGraphics.mask = this.clipMask;
    this.container.addChild(this.bg);
    this.container.addChild(this.nodesGraphics);
    this.container.addChild(this.clipMask);
    this.container.addChild(this.viewportIndicator);
  }

  setEvents(events: TimelineEvent[]): void {
    this.allEvents = events;
    if (events.length > 0) {
      this.dataMinYear = events[0].eventYear;
      this.dataMaxYear = events[events.length - 1].eventYear;
      const range = this.dataMaxYear - this.dataMinYear;
      this.dataMinYear -= range * 0.02;
      this.dataMaxYear += range * 0.02;
    }
  }

  setCategories(categories: Category[]): void {
    this.categoryRowMap.clear();
    for (let i = 0; i < categories.length; i++) {
      this.categoryRowMap.set(categories[i].id, i);
    }
    this.rowCount = Math.max(1, categories.length);
  }

  setRowConfigs(configs: CategoryRowConfig[]): void {
    this.rowConfigs = configs;
  }

  update(viewport: Viewport): void {
    const x = MINIMAP_MARGIN;
    const y = viewport.height - MINIMAP_HEIGHT - MINIMAP_MARGIN;
    const innerW = MINIMAP_WIDTH - PADDING * 2;
    const innerH = MINIMAP_HEIGHT - PADDING * 2;

    this.container.x = 0;
    this.container.y = 0;

    // Background
    this.bg.clear();
    this.bg.roundRect(x, y, MINIMAP_WIDTH, MINIMAP_HEIGHT, 4);
    this.bg.fill({ color: BG_COLOR, alpha: BG_ALPHA });
    this.bg.roundRect(x, y, MINIMAP_WIDTH, MINIMAP_HEIGHT, 4);
    this.bg.stroke({ width: 1, color: BORDER_COLOR });

    // Clip mask
    this.clipMask.clear();
    this.clipMask.roundRect(x, y, MINIMAP_WIDTH, MINIMAP_HEIGHT, 4);
    this.clipMask.fill({ color: 0xffffff });

    // Draw events
    this.nodesGraphics.clear();
    const minLog = symlog(this.dataMinYear);
    const maxLog = symlog(this.dataMaxYear);
    const logRange = maxLog - minLog;
    if (logRange === 0) return;

    // Row별 높이를 subLaneCount에 비례하여 배분
    const totalLanes = this.rowConfigs.length > 0
      ? this.rowConfigs.reduce((sum, rc) => sum + rc.subLaneCount, 0)
      : this.rowCount;
    const rowTops: number[] = [];
    const rowHeights: number[] = [];
    let accY = 0;
    for (let i = 0; i < this.rowCount; i++) {
      const lanes = this.rowConfigs[i]?.subLaneCount ?? 1;
      const h = (lanes / totalLanes) * innerH;
      rowTops.push(accY);
      rowHeights.push(h);
      accY += h;
    }

    for (const event of this.allEvents) {
      const yearLog = symlog(event.eventYear);
      const ratio = (yearLog - minLog) / logRange;
      const dotX = x + PADDING + ratio * innerW;

      const catId = event.categoryIds.length > 0 ? event.categoryIds[0] : -1;
      const color = catId >= 0 ? getCategoryColor(catId) : 0x8c857c;
      const rowIdx = this.categoryRowMap.get(catId) ?? 0;
      const rTop = y + PADDING + (rowTops[rowIdx] ?? 0);
      const rH = rowHeights[rowIdx] ?? innerH / this.rowCount;

      // event.id 기반 해시로 Row 내 y 위치 분산
      const subRatio = ((event.id * 2654435761) >>> 0) / 0xffffffff;
      const dotY = rTop + subRatio * rH;

      if (event.eventType === 'RANGE' && event.endYear != null) {
        const endLog = symlog(event.endYear);
        const endRatio = (endLog - minLog) / logRange;
        const barEndX = x + PADDING + endRatio * innerW;
        const barWidth = Math.max(1, barEndX - dotX);
        this.nodesGraphics.rect(dotX, dotY - 0.75, barWidth, 1.5);
        this.nodesGraphics.fill({ color, alpha: 0.6 });
      } else {
        this.nodesGraphics.circle(dotX, dotY, 1);
        this.nodesGraphics.fill({ color, alpha: 0.7 });
      }
    }

    // Viewport indicator
    this.viewportIndicator.clear();
    const vpFromLog = symlog(viewport.fromYear);
    const vpToLog = symlog(viewport.toYear);
    const vpLeftRatio = Math.max(0, (vpFromLog - minLog) / logRange);
    const vpRightRatio = Math.min(1, (vpToLog - minLog) / logRange);
    const vpX = x + PADDING + vpLeftRatio * innerW;
    const vpW = Math.max(2, (vpRightRatio - vpLeftRatio) * innerW);

    this.viewportIndicator.rect(vpX, y + 1, vpW, MINIMAP_HEIGHT - 2);
    this.viewportIndicator.fill({ color: VIEWPORT_COLOR, alpha: VIEWPORT_ALPHA });
    this.viewportIndicator.rect(vpX, y + 1, vpW, MINIMAP_HEIGHT - 2);
    this.viewportIndicator.stroke({ width: 1, color: VIEWPORT_COLOR, alpha: VIEWPORT_BORDER_ALPHA });
  }

  hitTest(screenX: number, screenY: number, canvasHeight: number): number | null {
    const mx = MINIMAP_MARGIN;
    const my = canvasHeight - MINIMAP_HEIGHT - MINIMAP_MARGIN;

    if (
      screenX >= mx && screenX <= mx + MINIMAP_WIDTH &&
      screenY >= my && screenY <= my + MINIMAP_HEIGHT
    ) {
      const ratio = (screenX - mx - PADDING) / (MINIMAP_WIDTH - PADDING * 2);
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const minLog = symlog(this.dataMinYear);
      const maxLog = symlog(this.dataMaxYear);
      const yearLog = minLog + clampedRatio * (maxLog - minLog);
      return symlogInverse(yearLog);
    }
    return null;
  }

  destroy(): void {
    this.bg.destroy();
    this.nodesGraphics.destroy();
    this.viewportIndicator.destroy();
    this.clipMask.destroy();
    this.container.destroy();
  }
}
