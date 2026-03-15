import { useEffect, useCallback, useRef } from 'react';
import type { ViewportManager } from '../engine/scale/ViewportManager';
import { yearToScreen } from '../engine/scale/symlog';
import { useTimelineStore } from '../store/useTimelineStore';

/**
 * 키보드 탐색 훅
 *
 * 지원 키:
 *   ArrowLeft / ArrowRight  — 팬 (Shift 누르면 5배 빠르게)
 *   +  / =  / ArrowUp       — 줌인
 *   -  / ArrowDown          — 줌아웃
 *   Home                    — 타임라인 시작(우주 빅뱅)으로 이동
 *   End                     — 타임라인 끝(현재)으로 이동
 *   0                       — 현재 뷰포트 중앙으로 리셋
 *
 * tabIndex 요소가 포커스를 갖고 있을 때만 동작한다.
 */

const PAN_STEP_FRACTION = 0.15;   // 화면 너비의 15%씩 이동
const ZOOM_STEP = 2;               // 줌 스텝 (ViewportManager.zoom delta 단위)
const SHIFT_MULTIPLIER = 5;

interface UseKeyboardNavigationOptions {
  /** 키보드 이벤트를 받을 요소 (null이면 window 전체) */
  targetRef: React.RefObject<HTMLElement | null>;
  viewportManagerRef: React.RefObject<ViewportManager | null>;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  targetRef,
  viewportManagerRef,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  // 연속 키 입력을 위한 pressed key 추적
  const pressedKeys = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  const getVM = useCallback(() => viewportManagerRef.current, [viewportManagerRef]);

  const step = useCallback(() => {
    const vm = getVM();
    if (!vm) return;

    const keys = pressedKeys.current;
    if (keys.size === 0) return;

    const vp = vm.getViewport();
    const width = vp.width || 800;
    const isShift = keys.has('Shift');
    const multiplier = isShift ? SHIFT_MULTIPLIER : 1;

    if (keys.has('ArrowLeft')) {
      // 양수 deltaX = 오른쪽으로 이동 (뷰가 과거로)
      vm.pan(width * PAN_STEP_FRACTION * multiplier);
    }
    if (keys.has('ArrowRight')) {
      vm.pan(-width * PAN_STEP_FRACTION * multiplier);
    }
    if (keys.has('ArrowUp') || keys.has('+') || keys.has('=')) {
      const refYear = useTimelineStore.getState().referenceLineYear;
      const anchorX = refYear !== null ? yearToScreen(refYear, vp) : width / 2;
      vm.zoom(ZOOM_STEP * multiplier, anchorX);
    }
    if (keys.has('ArrowDown') || keys.has('-')) {
      const refYear = useTimelineStore.getState().referenceLineYear;
      const anchorX = refYear !== null ? yearToScreen(refYear, vp) : width / 2;
      vm.zoom(-ZOOM_STEP * multiplier, anchorX);
    }

    rafRef.current = requestAnimationFrame(step);
  }, [getVM]);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(step);
  }, [step]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const el = targetRef.current ?? window;

    const onKeyDown = (e: Event) => {
      const ke = e as KeyboardEvent;

      // 입력 필드에서는 키보드 탐색 무시
      const tag = (ke.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const vm = getVM();
      if (!vm) return;

      const vp = vm.getViewport();
      const width = vp.width || 800;

      switch (ke.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          ke.preventDefault();
          pressedKeys.current.add(ke.key);
          if (ke.shiftKey) pressedKeys.current.add('Shift');
          startLoop();
          break;
        case '+':
        case '=':
          ke.preventDefault();
          pressedKeys.current.add('+');
          startLoop();
          break;
        case '-':
          ke.preventDefault();
          pressedKeys.current.add('-');
          startLoop();
          break;
        case 'Home':
          ke.preventDefault();
          vm.setRange(-13_800_000_000, 2100);
          break;
        case 'End':
          ke.preventDefault();
          vm.setRange(1800, 2030);
          break;
        case '0':
          ke.preventDefault();
          // 현재 범위 유지, 중앙 리셋 없이 현대로
          vm.setRange(1800, 2030);
          break;
        default:
          break;
      }
    };

    const onKeyUp = (e: Event) => {
      const ke = e as KeyboardEvent;
      pressedKeys.current.delete(ke.key);
      pressedKeys.current.delete('Shift');
      pressedKeys.current.delete('+');
      pressedKeys.current.delete('-');

      if (pressedKeys.current.size === 0) {
        stopLoop();
      }
    };

    const onBlur = () => {
      pressedKeys.current.clear();
      stopLoop();
    };

    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('keyup', onKeyUp);
    el.addEventListener('blur', onBlur);

    return () => {
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('blur', onBlur);
      stopLoop();
    };
  }, [enabled, targetRef, getVM, startLoop, stopLoop]);
}
