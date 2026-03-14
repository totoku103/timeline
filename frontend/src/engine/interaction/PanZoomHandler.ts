import type { ViewportManager } from '../scale/ViewportManager';

const FRICTION = 0.006;
const INERTIA_MIN_VELOCITY = 0.1;
const VELOCITY_SMOOTHING = 0.25;

/**
 * 타임라인 팬(슬라이드) 전용 핸들러.
 * 확대/축소는 UI 버튼(ZoomControls)으로만 수행.
 */
export class PanZoomHandler {
  private element: HTMLElement;
  private viewportManager: ViewportManager;

  /** 세로 스크롤 콜백 (deltaY 픽셀) */
  onVerticalScroll: ((deltaY: number) => void) | null = null;

  private isDragging = false;
  private lastX = 0;
  private velocity = 0;
  private inertiaRaf: number | null = null;
  private lastFrameTime = 0;
  private velocityHistory: number[] = [];

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
    this.stopInertia();
  }

  /** 휠: deltaX → 가로 팬(시간 이동), deltaY → 세로 스크롤(카테고리 스크롤) */
  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.stopInertia();

    // 가로 스크롤 (deltaX 또는 Shift+deltaY)
    if (Math.abs(e.deltaX) > 1) {
      this.viewportManager.pan(-e.deltaX);
    } else if (e.shiftKey) {
      this.viewportManager.pan(-e.deltaY);
    }

    // 세로 스크롤 (deltaY, Shift 미포함)
    if (!e.shiftKey && Math.abs(e.deltaY) > 0) {
      this.onVerticalScroll?.(e.deltaY);
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.lastX = e.clientX;
    this.velocity = 0;
    this.stopInertia();
    this.element.style.cursor = 'grabbing';
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastX;
    this.lastX = e.clientX;

    this.velocity = this.velocity * (1 - VELOCITY_SMOOTHING) + deltaX * VELOCITY_SMOOTHING;

    this.velocityHistory.push(deltaX);
    if (this.velocityHistory.length > 5) this.velocityHistory.shift();

    this.viewportManager.pan(deltaX);
  }

  private onMouseUp(_e: MouseEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.element.style.cursor = 'grab';

    if (this.velocityHistory.length > 0) {
      const weights = this.velocityHistory.map((_, i) => i + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      this.velocity = this.velocityHistory.reduce(
        (sum, v, i) => sum + v * weights[i], 0
      ) / totalWeight;
    }

    if (Math.abs(this.velocity) > INERTIA_MIN_VELOCITY) {
      this.lastFrameTime = performance.now();
      this.startInertia();
    } else {
      this.velocityHistory = [];
    }
  }

  /** 터치 = 1핑거 슬라이드만 (핀치 줌 제거) */
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.stopInertia();

    if (e.touches.length === 1) {
      this.lastTouchX = e.touches[0].clientX;
      this.velocity = 0;
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1 && this.lastTouchX !== null) {
      const deltaX = e.touches[0].clientX - this.lastTouchX;
      this.velocity = this.velocity * (1 - VELOCITY_SMOOTHING) + deltaX * VELOCITY_SMOOTHING;
      this.velocityHistory.push(deltaX);
      if (this.velocityHistory.length > 5) this.velocityHistory.shift();
      this.lastTouchX = e.touches[0].clientX;
      this.viewportManager.pan(deltaX);
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.lastTouchX = null;

      if (this.velocityHistory.length > 0) {
        const weights = this.velocityHistory.map((_, i) => i + 1);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        this.velocity = this.velocityHistory.reduce(
          (sum, v, i) => sum + v * weights[i], 0
        ) / totalWeight;
      }

      if (Math.abs(this.velocity) > INERTIA_MIN_VELOCITY) {
        this.lastFrameTime = performance.now();
        this.startInertia();
      } else {
        this.velocityHistory = [];
      }
    } else if (e.touches.length === 1) {
      this.lastTouchX = e.touches[0].clientX;
    }
  }

  private startInertia(): void {
    const tick = (now: number) => {
      const dt = Math.min(now - this.lastFrameTime, 32);
      this.lastFrameTime = now;

      const decayFactor = Math.pow(1 - FRICTION, dt / 16.67);
      this.velocity *= decayFactor;

      if (Math.abs(this.velocity) < INERTIA_MIN_VELOCITY) {
        this.velocity = 0;
        this.inertiaRaf = null;
        this.velocityHistory = [];
        return;
      }

      this.viewportManager.pan(this.velocity);
      this.inertiaRaf = requestAnimationFrame(tick);
    };

    this.inertiaRaf = requestAnimationFrame(tick);
  }

  private stopInertia(): void {
    if (this.inertiaRaf !== null) {
      cancelAnimationFrame(this.inertiaRaf);
      this.inertiaRaf = null;
    }
    this.velocity = 0;
  }
}
