import type { ViewportManager } from '../scale/ViewportManager';

const INERTIA_DECAY = 0.95;
const INERTIA_MIN_VELOCITY = 0.5;
const ZOOM_SPEED = 1;
const FAST_ZOOM_MULTIPLIER = 3;

export class PanZoomHandler {
  private element: HTMLElement;
  private viewportManager: ViewportManager;

  private isDragging = false;
  private lastX = 0;
  private velocity = 0;
  private inertiaRaf: number | null = null;

  // Touch state
  private lastPinchDistance: number | null = null;
  private lastTouchX: number | null = null;

  // Bound handlers for cleanup
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

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.stopInertia();

    const rect = this.element.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const speed = (e.ctrlKey || e.metaKey) ? FAST_ZOOM_MULTIPLIER : ZOOM_SPEED;
    const delta = (e.deltaY > 0 ? -1 : 1) * speed;

    this.viewportManager.zoom(delta, cursorX);
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
    this.velocity = deltaX;
    this.lastX = e.clientX;

    this.viewportManager.pan(deltaX);
  }

  private onMouseUp(_e: MouseEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.element.style.cursor = 'grab';

    // Start inertia
    if (Math.abs(this.velocity) > INERTIA_MIN_VELOCITY) {
      this.startInertia();
    }
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.stopInertia();

    if (e.touches.length === 1) {
      this.lastTouchX = e.touches[0].clientX;
      this.lastPinchDistance = null;
    } else if (e.touches.length === 2) {
      this.lastPinchDistance = this.getPinchDistance(e.touches);
      this.lastTouchX = null;
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1 && this.lastTouchX !== null) {
      const deltaX = e.touches[0].clientX - this.lastTouchX;
      this.velocity = deltaX;
      this.lastTouchX = e.touches[0].clientX;
      this.viewportManager.pan(deltaX);
    } else if (e.touches.length === 2 && this.lastPinchDistance !== null) {
      const newDistance = this.getPinchDistance(e.touches);
      const ratio = newDistance / this.lastPinchDistance;
      const delta = (ratio - 1) * 5;

      const rect = this.element.getBoundingClientRect();
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;

      this.viewportManager.zoom(delta, centerX);
      this.lastPinchDistance = newDistance;
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.lastPinchDistance = null;
      this.lastTouchX = null;

      if (Math.abs(this.velocity) > INERTIA_MIN_VELOCITY) {
        this.startInertia();
      }
    } else if (e.touches.length === 1) {
      this.lastTouchX = e.touches[0].clientX;
      this.lastPinchDistance = null;
    }
  }

  private getPinchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private startInertia(): void {
    const tick = () => {
      this.velocity *= INERTIA_DECAY;

      if (Math.abs(this.velocity) < INERTIA_MIN_VELOCITY) {
        this.velocity = 0;
        this.inertiaRaf = null;
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
