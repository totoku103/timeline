import { useRef, useEffect } from 'react';
import { useTimelineEngine } from '../hooks/useTimelineEngine';
import { useViewportEvents, useCategories } from '../hooks/useViewportEvents';

export default function TimelineCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { engineRef, ready } = useTimelineEngine(containerRef);
  const { data: events } = useViewportEvents();
  const { data: categories } = useCategories();

  useEffect(() => {
    if (ready && engineRef.current && categories) {
      engineRef.current.setCategories(categories);
    }
  }, [categories, ready, engineRef]);

  useEffect(() => {
    if (ready && engineRef.current && events) {
      engineRef.current.setEvents(events);
    }
  }, [events, ready, engineRef]);

  return (
    <div
      ref={containerRef}
      className="timeline-canvas"
      style={{ width: '100%', height: '100%', background: '#0a0a1a' }}
    />
  );
}
