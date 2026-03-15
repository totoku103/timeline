import type { ViewportManager } from '../scale/ViewportManager';

/**
 * 타임라인 팬(슬라이드) 전용 핸들러.
 * 확대/축소는 UI 버튼(ZoomControls)으로만 수행.
 * 관성 없음 — 놓으면 즉시 정지.
 */
export class PanZoomHandler {
  private element: HTMLElement;
  private viewportManager: ViewportManager;

  /** 세로 스크롤 콜백 (deltaY 픽셀) */
  onVerticalScroll: ((deltaY: number) => void) | null = null;

  private isDragging = false;
  private lastX = 0;
  private _panLocked = false;

  // Touch state
  private lastTouchX: number | null = null;

  // Bound handlers
  private handleWheel: (e: WheelEvent) => void;
  private handleMouseDown: (e: MouseEvent) => void;
  private handleMouseMove: (e: MouseEvent) => void;
  private handleMouseUp: (e: MouseEvent) => void;
  private handleTouchStart: (e: TouchEvent) => void;
  private handleTouchMove: (e: TouchEvent) => void;
  private handleTouchEnd: (e: TouchEvent) => void;

  constructor(element: HTMLElement, viewportManager: ViewportManager) {
    this.element = element;
    this.viewportManager = viewportManager;

    this.handleWheel = this.onWheel.bind(this);
    this.handleMouseDown = this.onMouseDown.bind(this);
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleMouseUp = this.onMouseUp.bind(this);
    this.handleTouchStart = this.onTouchStart.bind(this);
    this.handleTouchMove = this.onTouchMove.bind(this);
    this.handleTouchEnd = this.onTouchEnd.bind(this);
  }

  attach(): void {
    this.element.addEventListener('wheel', this.handleWheel, { passive: false });
    this.element.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd);
  }

  detach(): void {
    this.element.removeEventListener('wheel', this.handleWheel);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }

  /** 휠: deltaX → 가로 팬, deltaY → 세로 스크롤 */
  private onWheel(e: WheelEvent): void {
    e.preventDefault();

    if (Math.abs(e.deltaX) > 1) {
      this.viewportManager.pan(-e.deltaX);
    } else if (e.shiftKey) {
      this.viewportManager.pan(-e.deltaY);
    }

    if (!e.shiftKey && Math.abs(e.deltaY) > 0) {
      this.onVerticalScroll?.(e.deltaY);
    }
  }

  set panLocked(locked: boolean) {
    this._panLocked = locked;
    if (locked) this.isDragging = false;
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0 || this._panLocked) return;
    this.isDragging = true;
    this.lastX = e.clientX;
    this.element.style.cursor = 'grabbing';
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.lastX;
    this.lastX = e.clientX;
    this.viewportManager.pan(deltaX);
  }

  private onMouseUp(_e: MouseEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.element.style.cursor = 'grab';
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.lastTouchX = e.touches[0].clientX;
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1 && this.lastTouchX !== null) {
      const deltaX = e.touches[0].clientX - this.lastTouchX;
      this.lastTouchX = e.touches[0].clientX;
      this.viewportManager.pan(deltaX);
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.lastTouchX = null;
    } else if (e.touches.length === 1) {
      this.lastTouchX = e.touches[0].clientX;
    }
  }
}
