import { useRef, useEffect, useMemo } from 'react';
import { useTimelineEngine } from '../hooks/useTimelineEngine';
import { useViewportEvents, useCategories } from '../hooks/useViewportEvents';
import { useTimelineStore } from '../store/useTimelineStore';

export default function TimelineCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { engineRef, ready } = useTimelineEngine(containerRef);
  const { data: events } = useViewportEvents();
  const { data: categories } = useCategories();
  const selectedCategoryIds = useTimelineStore((s) => s.filters.categoryIds);

  // 선택된 카테고리만 표시 (없으면 전체)
  const visibleCategories = useMemo(() => {
    if (!categories) return [];
    if (!selectedCategoryIds || selectedCategoryIds.length === 0) return categories;
    return categories.filter((c) => selectedCategoryIds.includes(c.id));
  }, [categories, selectedCategoryIds]);

  // 선택된 카테고리의 이벤트만 필터링 (없으면 전체)
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!selectedCategoryIds || selectedCategoryIds.length === 0) return events;
    return events.filter((e) =>
      e.categoryIds.some((id) => selectedCategoryIds.includes(id))
    );
  }, [events, selectedCategoryIds]);

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

  return (
    <div
      ref={containerRef}
      className="timeline-canvas"
      style={{ width: '100%', height: '100%', background: '#0a0a1a' }}
    />
  );
}
