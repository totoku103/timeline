import { useRef, useEffect, useState } from 'react';
import { TimelineEngine } from '../engine/TimelineEngine';
import { useTimelineStore } from '../store/useTimelineStore';

export function useTimelineEngine(containerRef: React.RefObject<HTMLDivElement | null>) {
  const engineRef = useRef<TimelineEngine | null>(null);
  const [ready, setReady] = useState(false);
  const { setViewport, setSelectedEventId, setShowDetailPanel } = useTimelineStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new TimelineEngine();
    engineRef.current = engine;
    setReady(false);

    engine.init(containerRef.current).then(() => {
      engine.onViewportChange = (vp) => setViewport(vp);
      engine.onEventClick = (event) => {
        setSelectedEventId(event.id);
        setShowDetailPanel(true);
      };
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
