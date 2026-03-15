import { useRef, useEffect, useState } from 'react';
import { TimelineEngine } from '../engine/TimelineEngine';
import { useTimelineStore } from '../store/useTimelineStore';

export function useTimelineEngine(containerRef: React.RefObject<HTMLDivElement | null>) {
  const engineRef = useRef<TimelineEngine | null>(null);
  const [ready, setReady] = useState(false);
  const { viewport: storeViewport, setViewport, setSelectedEventId, setShowDetailPanel, setReferenceLineYear } = useTimelineStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new TimelineEngine();
    engineRef.current = engine;
    setReady(false);

    engine.init(containerRef.current).then(() => {
      // 스토어의 초기 뷰포트를 엔진에 동기화
      const { fromYear, toYear } = useTimelineStore.getState().viewport;
      if (fromYear !== -13_800_000_000 || toYear !== 2100) {
        engine.setViewport({ fromYear, toYear } as any);
      }

      engine.onViewportChange = (vp) => setViewport(vp);
      engine.onEventClick = (event) => {
        setSelectedEventId(event.id);
        setShowDetailPanel(true);
      };
      engine.onReferenceLineChange = (year) => setReferenceLineYear(year);
      setReady(true);
    });

    const handleResize = () => {
      if (containerRef.current) {
        engine.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      engineRef.current = null;
      setReady(false);
    };
  }, [containerRef]);

  return { engineRef, ready };
}
