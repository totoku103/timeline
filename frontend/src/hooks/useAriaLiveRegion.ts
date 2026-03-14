import { useEffect, useRef, useCallback } from 'react';

/**
 * ARIA 라이브 리전 훅
 *
 * 시간 이동, 줌 변경, 이벤트 선택 시 스크린 리더에 현재 상태를 알린다.
 * aria-live="polite" 리전을 DOM에 추가하고 메시지를 교체한다.
 *
 * 사용:
 *   const { announce } = useAriaLiveRegion();
 *   announce('현재 위치: 1900년 ~ 2000년, 세기 단위 보기');
 */
export function useAriaLiveRegion() {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 이미 존재하면 재사용
    let el = document.getElementById('timeline-aria-live') as HTMLDivElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'timeline-aria-live';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      // 시각적으로 숨기되 스크린 리더에는 노출
      Object.assign(el.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border: '0',
        pointerEvents: 'none',
      });
      document.body.appendChild(el);
    }
    regionRef.current = el;

    return () => {
      // 컴포넌트 언마운트 시 타이머만 정리 (DOM 요소는 공유 자원이므로 유지)
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = regionRef.current;
    if (!el) return;

    el.setAttribute('aria-live', priority);

    // 동일 메시지도 변경 감지되도록 잠깐 비웠다가 설정
    el.textContent = '';
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (el) el.textContent = message;
    }, 50);
  }, []);

  return { announce };
}
