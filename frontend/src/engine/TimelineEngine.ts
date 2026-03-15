import { Application, FederatedPointerEvent, Graphics, Container } from 'pixi.js';
import type { TimelineEvent, Category } from '../types/timeline';
import type { Viewport } from '../types/viewport';
import type { RenderNode } from '../types/render';
import { ViewportManager } from './scale/ViewportManager';
import { PanZoomHandler } from './interaction/PanZoomHandler';
import { SpatialIndex } from './data/SpatialIndex';
import { transformNodes, type CategoryRowConfig } from './data/NodeTransformer';
import { TimeAxisLayer } from './layers/TimeAxisLayer';
import { EventNodesLayer } from './layers/EventNodesLayer';
import { SelectionOverlay } from './layers/SelectionOverlay';
import { CategoryLaneLayer } from './layers/CategoryLaneLayer';
import { MinimapLayer } from './layers/MinimapLayer';
import { ReferenceLineLayer } from './layers/ReferenceLineLayer';

const BG_COLOR = 0x141210;
const HIT_RADIUS = 20;
const RANGE_BAR_HEIGHT = 20;

export class TimelineEngine {
  private app: Application;
  private viewportManager!: ViewportManager;
  private panZoomHandler!: PanZoomHandler;
  private spatialIndex: SpatialIndex;
  private scrollContainer: Container;   // 세로 스크롤 가능 콘텐츠
  private scrollMask: Graphics;         // 시간축 아래 영역만 보이게 클리핑
  private timeAxisBg: Graphics;         // 시간축 배경 (스크롤 콘텐츠 가림)
  private categoryLaneLayer: CategoryLaneLayer;
  private timeAxisLayer: TimeAxisLayer;
  private eventNodesLayer: EventNodesLayer;
  private selectionOverlay: SelectionOverlay;
  private minimapLayer: MinimapLayer;
  private referenceLineLayer: ReferenceLineLayer;

  private categories: Category[] = [];
  private visibleNodes: RenderNode[] = [];
  private visibleEvents: TimelineEvent[] = [];
  private rowConfigs: CategoryRowConfig[] = [];
  private hoveredNodeId: number | null = null;
  private selectedNodeId: number | null = null;
  private initialized = false;
  private scrollY = 0;
  private maxScrollY = 0;
  private isDraggingRefLine = false;

  // Public callbacks
  onEventClick: ((event: TimelineEvent) => void) | null = null;
  onEventHover: ((event: TimelineEvent | null) => void) | null = null;
  onViewportChange: ((viewport: Viewport) => void) | null = null;

  constructor() {
    this.app = new Application();
    this.spatialIndex = new SpatialIndex();
    this.scrollContainer = new Container();
    this.scrollMask = new Graphics();
    this.timeAxisBg = new Graphics();
    this.categoryLaneLayer = new CategoryLaneLayer();
    this.timeAxisLayer = new TimeAxisLayer();
    this.eventNodesLayer = new EventNodesLayer();
    this.selectionOverlay = new SelectionOverlay();
    this.minimapLayer = new MinimapLayer();
    this.referenceLineLayer = new ReferenceLineLayer();
  }

  async init(container: HTMLElement): Promise<void> {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    await this.app.init({
      width,
      height,
      background: BG_COLOR,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });

    // Clear any existing canvas from prior mounts (React StrictMode)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(this.app.canvas);

    // Make canvas interactive
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // 스크롤 가능 콘텐츠: 시간축 아래 영역에만 표시되도록 마스크 적용
    this.scrollMask.rect(0, 60, width, height - 60).fill({ color: 0xffffff });
    this.scrollContainer.mask = this.scrollMask;
    this.scrollContainer.addChild(this.categoryLaneLayer.container);
    this.scrollContainer.addChild(this.eventNodesLayer.container);
    this.scrollContainer.addChild(this.selectionOverlay.container);

    // 레이어 순서 (bottom → top):
    // 1. scrollContainer (태그 + 이벤트 + 툴팁, 마스크로 클리핑)
    // 2. scrollMask
    // 3. timeAxisBg (시간축 배경, 스크롤 콘텐츠 가림)
    // 4. timeAxisLayer (시간축 라벨/틱)
    this.app.stage.addChild(this.scrollContainer);
    this.app.stage.addChild(this.scrollMask);
    this.app.stage.addChild(this.timeAxisBg);
    this.app.stage.addChild(this.timeAxisLayer.container);
    this.app.stage.addChild(this.referenceLineLayer.container);
    this.app.stage.addChild(this.minimapLayer.container);

    // Create viewport manager
    this.viewportManager = new ViewportManager(width, height, (vp) => {
      this.onViewportChange?.(vp);
    });

    // Create pan handler
    this.panZoomHandler = new PanZoomHandler(this.app.canvas as HTMLElement, this.viewportManager);
    this.panZoomHandler.onVerticalScroll = (deltaY: number) => {
      this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + deltaY));
      this.applyScrollY();
    };
    this.panZoomHandler.attach();

    // Set up interaction events
    this.app.stage.on('pointermove', this.onPointerMove, this);
    this.app.stage.on('pointerdown', this.onPointerDown, this);
    this.app.stage.on('pointerup', this.onPointerUp, this);
    (this.app.canvas as HTMLElement).addEventListener('dblclick', this.onDoubleClick);

    // Set up render loop
    this.app.ticker.add(this.onTick, this);

    // Cursor style
    (this.app.canvas as HTMLElement).style.cursor = 'grab';

    this.initialized = true;

    // Initial render
    this.updateLayers();
  }

  setEvents(events: TimelineEvent[]): void {
    this.spatialIndex.build(events);
    this.minimapLayer.setEvents(this.spatialIndex.getAll());
    this.updateVisibleData();
    this.updateLayers();
  }

  setCategories(categories: Category[]): void {
    this.categories = categories;
    this.minimapLayer.setCategories(categories);
    this.updateVisibleData();
    this.updateLayers();
  }

  setViewport(viewport: Viewport): void {
    this.viewportManager.setRange(viewport.fromYear, viewport.toYear);
  }

  /** 키보드 탐색 훅 등 외부에서 ViewportManager에 직접 접근할 때 사용 */
  getViewportManager(): ViewportManager {
    return this.viewportManager;
  }

  resize(width: number, height: number): void {
    if (!this.initialized) return;
    this.app.renderer.resize(width, height);
    this.viewportManager.resize(width, height);
    // 마스크 갱신
    this.scrollMask.clear();
    this.scrollMask.rect(0, 60, width, height - 60).fill({ color: 0xffffff });
    this.updateLayers();
  }

  destroy(): void {
    if (!this.initialized) return;

    this.panZoomHandler.detach();
    this.app.ticker.remove(this.onTick, this);
    this.app.stage.off('pointermove', this.onPointerMove, this);
    this.app.stage.off('pointerdown', this.onPointerDown, this);
    this.app.stage.off('pointerup', this.onPointerUp, this);
    (this.app.canvas as HTMLElement).removeEventListener('dblclick', this.onDoubleClick);

    this.categoryLaneLayer.destroy();
    this.timeAxisLayer.destroy();
    this.eventNodesLayer.destroy();
    this.selectionOverlay.destroy();
    this.referenceLineLayer.destroy();
    this.minimapLayer.destroy();
    this.spatialIndex.clear();

    // Explicitly release WebGL context before destroying
    try {
      const canvas = this.app.canvas as HTMLCanvasElement;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    } catch (_) { /* ignore */ }

    this.app.destroy(true, { children: true });
    this.initialized = false;
  }

  private onTick = (): void => {
    if (!this.viewportManager.isDirty()) return;
    this.viewportManager.clearDirty();
    this.updateVisibleData();
    this.updateLayers();
  };

  private updateVisibleData(): void {
    const vp = this.viewportManager.getViewport();
    // Add margin to query range for partially visible nodes
    const range = vp.toYear - vp.fromYear;
    const margin = range * 0.05;
    this.visibleEvents = this.spatialIndex.query(vp.fromYear - margin, vp.toYear + margin);
    const result = transformNodes(this.visibleEvents, vp, this.categories);
    this.visibleNodes = result.nodes;
    this.rowConfigs = result.rowConfigs;
  }

  private updateLayers(): void {
    if (!this.initialized) return;
    const vp = this.viewportManager.getViewport();

    // 1. CategoryLaneLayer: 행 배경/헤더 렌더링
    this.categoryLaneLayer.update(this.rowConfigs, vp.width);

    // 2. 각 노드에 실제 y좌표 할당 (CategoryLaneLayer 기반)
    for (const node of this.visibleNodes) {
      node.y = this.categoryLaneLayer.getNodeY(node.categoryRow, node.subLane);
    }

    // 3. 시간축 배경 (스크롤 콘텐츠가 시간축 위로 올라오지 않게)
    this.timeAxisBg.clear();
    this.timeAxisBg.rect(0, 0, vp.width, 60).fill({ color: BG_COLOR });

    // 4. 시간축 (상단 고정)
    this.timeAxisLayer.update(vp, vp.width, vp.height);

    // 4. 이벤트 노드
    this.eventNodesLayer.update(this.visibleNodes);

    // 5. 세로 스크롤 범위 계산 및 적용
    const totalHeight = this.categoryLaneLayer.getTotalHeight();
    this.maxScrollY = Math.max(0, totalHeight - vp.height);
    this.scrollY = Math.min(this.scrollY, this.maxScrollY);
    this.applyScrollY();

    // 6. 기준선
    this.referenceLineLayer.update(vp, Math.max(vp.height, totalHeight));

    // 7. 미니맵
    this.minimapLayer.setRowConfigs(this.rowConfigs);
    this.minimapLayer.update(vp);
  }

  /** 세로 스크롤 오프셋 적용 — scrollContainer 전체를 이동 */
  private applyScrollY(): void {
    this.scrollContainer.y = -this.scrollY;
  }

  private onPointerMove(e: FederatedPointerEvent): void {
    const pos = e.global;

    // 기준선 드래그 중
    if (this.isDraggingRefLine) {
      const vp = this.viewportManager.getViewport();
      const year = this.referenceLineLayer.screenToYear(pos.x, vp);
      this.referenceLineLayer.setYear(year);
      this.referenceLineLayer.update(vp, Math.max(vp.height, this.categoryLaneLayer.getTotalHeight()));
      (this.app.canvas as HTMLElement).style.cursor = 'col-resize';
      return;
    }

    // 기준선 호버 감지
    const vp = this.viewportManager.getViewport();
    if (this.referenceLineLayer.isVisible() && this.referenceLineLayer.hitTest(pos.x, vp)) {
      (this.app.canvas as HTMLElement).style.cursor = 'col-resize';
      // 다른 호버 상태 초기화
      if (this.hoveredNodeId !== null) {
        this.hoveredNodeId = null;
        this.eventNodesLayer.setHoveredNode(null);
        this.selectionOverlay.hideTooltip();
        this.onEventHover?.(null);
      }
      return;
    }

    const hitNode = this.findNodeAt(pos.x, pos.y + this.scrollY);

    if (hitNode) {
      if (this.hoveredNodeId !== hitNode.id) {
        this.hoveredNodeId = hitNode.id;
        this.eventNodesLayer.setHoveredNode(hitNode.id);

        const event = this.findEventById(hitNode.id);
        if (event) {
          this.selectionOverlay.showTooltip(hitNode, event, pos.x, pos.y);
          this.selectionOverlay.constrainToCanvas(vp.width, vp.height);
          this.onEventHover?.(event);
        }
      }
      (this.app.canvas as HTMLElement).style.cursor = 'pointer';
    } else {
      if (this.hoveredNodeId !== null) {
        this.hoveredNodeId = null;
        this.eventNodesLayer.setHoveredNode(null);
        this.selectionOverlay.hideTooltip();
        this.onEventHover?.(null);
      }
      (this.app.canvas as HTMLElement).style.cursor = 'grab';
    }
  }

  private onPointerDown(e: FederatedPointerEvent): void {
    const pos = e.global;

    // 미니맵 클릭 처리
    const vp = this.viewportManager.getViewport();
    const minimapYear = this.minimapLayer.hitTest(pos.x, pos.y, vp.height);
    if (minimapYear !== null) {
      this.viewportManager.jumpToYear(minimapYear);
      return;
    }

    // 기준선 드래그 시작
    if (this.referenceLineLayer.isVisible() && this.referenceLineLayer.hitTest(pos.x, vp)) {
      this.isDraggingRefLine = true;
      this.panZoomHandler.panLocked = true;
      (this.app.canvas as HTMLElement).style.cursor = 'col-resize';
      return;
    }

    const hitNode = this.findNodeAt(pos.x, pos.y + this.scrollY);

    if (hitNode) {
      this.selectedNodeId = hitNode.id;
      this.eventNodesLayer.setSelectedNode(hitNode.id);

      const event = this.findEventById(hitNode.id);
      if (event) {
        this.centerOnNode(hitNode, event);
        this.onEventClick?.(event);
      }
    } else {
      if (this.selectedNodeId !== null) {
        this.selectedNodeId = null;
        this.eventNodesLayer.setSelectedNode(null);
      }
    }
  }

  private findNodeAt(x: number, y: number): RenderNode | null {
    // Search in reverse (top-most first)
    for (let i = this.visibleNodes.length - 1; i >= 0; i--) {
      const node = this.visibleNodes[i];
      if (!node.visible) continue;

      if (node.type === 'range' && node.endX != null) {
        // Range event: rectangular hit test
        if (x >= node.x && x <= node.endX && Math.abs(y - node.y) <= RANGE_BAR_HEIGHT / 2) {
          return node;
        }
      } else {
        // Point event: circular hit test
        const dx = x - node.x;
        const dy = y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= HIT_RADIUS) {
          return node;
        }
      }
    }
    return null;
  }

  private centerOnNode(node: RenderNode, event: TimelineEvent): void {
    // 가로: 이벤트 연도를 화면 중앙으로
    let preciseYear = event.eventYear;
    if (event.eventMonth != null && event.eventMonth >= 1) {
      preciseYear += (event.eventMonth - 1) * 30.44 / 365;
      if (event.eventDay != null && event.eventDay >= 1) {
        preciseYear += (event.eventDay - 1) / 365;
      }
    }
    if (event.eventType === 'RANGE' && event.endYear != null) {
      let preciseEnd = event.endYear;
      if (event.endMonth != null && event.endMonth >= 1) {
        preciseEnd += (event.endMonth - 1) * 30.44 / 365;
        if (event.endDay != null && event.endDay >= 1) {
          preciseEnd += (event.endDay - 1) / 365;
        }
      }
      preciseYear = (preciseYear + preciseEnd) / 2;
    }
    this.viewportManager.jumpToYear(preciseYear);

    // 세로: 노드의 y가 화면 중앙에 오도록 스크롤
    const vp = this.viewportManager.getViewport();
    const visibleHeight = vp.height - 60; // 시간축 높이 제외
    const targetScrollY = node.y - visibleHeight / 2;
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, targetScrollY));
    this.applyScrollY();
  }

  private onPointerUp(_e: FederatedPointerEvent): void {
    if (this.isDraggingRefLine) {
      this.isDraggingRefLine = false;
      this.panZoomHandler.panLocked = false;
      (this.app.canvas as HTMLElement).style.cursor = 'grab';
    }
  }

  private onDoubleClick = (e: MouseEvent): void => {
    const rect = (this.app.canvas as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 이벤트가 있는 곳은 무시
    const hitNode = this.findNodeAt(x, y + this.scrollY);
    if (hitNode) return;

    // 미니맵 영역 무시
    const vp = this.viewportManager.getViewport();
    if (this.minimapLayer.hitTest(x, y, vp.height) !== null) return;

    // 기준선 배치
    const year = this.referenceLineLayer.screenToYear(x, vp);
    this.referenceLineLayer.setYear(year);
    this.referenceLineLayer.update(vp, Math.max(vp.height, this.categoryLaneLayer.getTotalHeight()));
  };

  private findEventById(id: number): TimelineEvent | undefined {
    return this.visibleEvents.find(e => e.id === id);
  }
}
