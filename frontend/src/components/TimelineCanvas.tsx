import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useTimelineEngine } from '../hooks/useTimelineEngine';
import { useViewportEvents, useCategories } from '../hooks/useViewportEvents';
import { useTimelineStore } from '../store/useTimelineStore';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useAriaLiveRegion } from '../hooks/useAriaLiveRegion';
import { getZoomLevelForRange } from '../engine/scale/precisionMapping';
import type { ViewportManager } from '../engine/scale/ViewportManager';

function formatYearShort(year: number): string {
  const abs = Math.abs(year);
  const suffix = year < 0 ? ' BCE' : '';

  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)}B${suffix}`;
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M${suffix}`;
  if (abs >= 10_000) return `${Math.round(abs / 1_000)}K${suffix}`;
  if (abs < 1) return '0';
  return `${Math.round(abs)}${suffix}`;
}

interface TimelineCanvasProps {
  /** App 레벨에서 공유하는 ViewportManager ref — YearJumper 등 외부 컴포넌트가 직접 접근 */
  viewportManagerRef?: React.RefObject<ViewportManager | null>;
}

export default function TimelineCanvas({ viewportManagerRef }: TimelineCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { engineRef, ready } = useTimelineEngine(containerRef);
  const { data: events, isFetching } = useViewportEvents();
  const { data: categories } = useCategories();
  const selectedCategoryIds = useTimelineStore((s) => s.filters.categoryIds);
  const selectedCountryIds = useTimelineStore((s) => s.filters.countryIds);
  const viewport = useTimelineStore((s) => s.viewport);

  const { announce } = useAriaLiveRegion();

  // 내부 키보드 훅용 ref
  const localVmRef = useRef<ViewportManager | null>(null);

  // 엔진이 준비되면 두 ref 모두 채운다
  useEffect(() => {
    if (ready && engineRef.current) {
      const vm = engineRef.current.getViewportManager();
      localVmRef.current = vm;
      // App 레벨 공유 ref도 갱신 (YearJumper 등이 사용)
      if (viewportManagerRef) {
        (viewportManagerRef as React.MutableRefObject<ViewportManager | null>).current = vm;
      }
    } else {
      localVmRef.current = null;
      if (viewportManagerRef) {
        (viewportManagerRef as React.MutableRefObject<ViewportManager | null>).current = null;
      }
    }
  }, [ready, engineRef, viewportManagerRef]);

  // 키보드 탐색 — 캔버스 컨테이너에 포커스 시 동작
  useKeyboardNavigation({
    targetRef: containerRef,
    viewportManagerRef: localVmRef,
    enabled: ready,
  });

  // 뷰포트 변경 시 스크린 리더 알림 (300ms 디바운스)
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    announceTimerRef.current = setTimeout(() => {
      const range = viewport.toYear - viewport.fromYear;
      const zoomConfig = getZoomLevelForRange(range);
      announce(
        `타임라인 위치: ${formatYearShort(viewport.fromYear)}부터 ` +
        `${formatYearShort(viewport.toYear)}까지 보기`
      );
    }, 300);
    return () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    };
  }, [viewport.fromYear, viewport.toYear, announce]);

  // 태그 필터링
  const visibleCategories = useMemo(() => {
    if (!categories) return [];
    if (!selectedCategoryIds || selectedCategoryIds.length === 0) return categories;
    return categories.filter((c) => selectedCategoryIds.includes(c.id));
  }, [categories, selectedCategoryIds]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let result = events;
    if (selectedCategoryIds && selectedCategoryIds.length > 0) {
      result = result.filter((e) =>
        e.categoryIds.some((id) => selectedCategoryIds.includes(id))
      );
    }
    if (selectedCountryIds && selectedCountryIds.length > 0) {
      result = result.filter((e) =>
        e.countryIds.some((id) => selectedCountryIds.includes(id))
      );
    }
    return result;
  }, [events, selectedCategoryIds, selectedCountryIds]);

  useEffect(() => {
    if (ready && engineRef.current) {
      engineRef.current.setCategories(visibleCategories);
    }
  }, [visibleCategories, ready, engineRef]);

  useEffect(() => {
    if (ready && engineRef.current) {
      engineRef.current.setEvents(filteredEvents);
    }
  }, [filteredEvents, ready, engineRef]);

  // 스토어 viewport 변경 → 엔진 동기화 (프리셋 버튼, 줌 컨트롤 등)
  const prevViewportRef = useRef({ fromYear: 0, toYear: 0 });
  useEffect(() => {
    if (!ready || !engineRef.current) return;
    const prev = prevViewportRef.current;
    // 스토어에서 변경된 경우에만 엔진에 전달 (엔진→스토어 루프 방지)
    if (prev.fromYear !== viewport.fromYear || prev.toYear !== viewport.toYear) {
      engineRef.current.setViewport(viewport);
      prevViewportRef.current = { fromYear: viewport.fromYear, toYear: viewport.toYear };
    }
  }, [viewport.fromYear, viewport.toYear, ready, engineRef]);

  // 포커스 시 키보드 힌트 안내
  const handleFocus = useCallback(() => {
    announce(
      '타임라인 캔버스에 포커스되었습니다. ' +
      '좌우 방향키로 이동, 위아래 방향키로 줌 조절, ' +
      'Home 키로 우주 초기로, End 키로 현재로 이동할 수 있습니다.',
      'polite'
    );
  }, [announce]);

  const range = viewport.toYear - viewport.fromYear;
  const zoomConfig = getZoomLevelForRange(range);
  const ariaLabel =
    `인터랙티브 타임라인. 현재 ${formatYearShort(viewport.fromYear)}부터 ` +
    `${formatYearShort(viewport.toYear)}까지 표시 중. ` +
    `방향키로 탐색 가능.`;

  return (
    <>
      {isFetching && (
        <div className="loading-bar" role="progressbar" aria-label="데이터 로딩 중">
          <div className="loading-bar__indicator" />
        </div>
      )}
      <div
        ref={containerRef}
        className="timeline-canvas"
        style={{ width: '100%', height: '100%', background: '#0a0a1a' }}
        role="application"
        aria-label={ariaLabel}
        aria-roledescription="인터랙티브 타임라인"
        tabIndex={0}
        onFocus={handleFocus}
      />
    </>
  );
}
