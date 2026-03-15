import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimelineCanvas from './components/TimelineCanvas';
import EventDetailPanel from './components/EventDetailPanel';
import ZoomControls from './components/ZoomControls';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';

import ViewModeToggle from './components/ViewModeToggle';
import CanvasZoomButtons from './components/CanvasZoomButtons';
import { useTimelineStore } from './store/useTimelineStore';
import type { ViewportManager } from './engine/scale/ViewportManager';
import './App.css';

const ThreeTimeline = lazy(() => import('./samples/ThreeTimeline'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

function TimelineApp() {
  const viewMode = useTimelineStore((s) => s.viewMode);
  const [rendered, setRendered] = useState<'pixi' | 'three' | 'transitioning'>(
    viewMode === 'pixi' ? 'pixi' : 'three'
  );

  // ZoomControls의 YearJumper가 ViewportManager에 직접 접근할 수 있도록
  // TimelineCanvas → useTimelineEngine → engineRef.getViewportManager() 연결
  // App 레벨에서 공유 ref 를 내려준다
  const viewportManagerRef = useRef<ViewportManager | null>(null);

  useEffect(() => {
    if (viewMode === 'pixi' && rendered !== 'pixi') {
      setRendered('transitioning');
      const timer = setTimeout(() => setRendered('pixi'), 100);
      return () => clearTimeout(timer);
    }
    if (viewMode === 'three' && rendered !== 'three') {
      setRendered('transitioning');
      const timer = setTimeout(() => setRendered('three'), 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, rendered]);

  return (
    <div className="app">
      <div className="app__header" role="banner">
        <SearchBar />
        <CategoryFilter />
        <ZoomControls viewportManagerRef={viewportManagerRef} />
        <ViewModeToggle />
      </div>
      <main className="app__canvas" aria-label="타임라인 캔버스 영역">
        {rendered === 'pixi' && (
          <TimelineCanvas viewportManagerRef={viewportManagerRef} />
        )}
        {rendered === 'pixi' && <CanvasZoomButtons />}
        {rendered === 'three' && (
          <Suspense
            fallback={
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8888aa',
                }}
              >
                로딩 중...
              </div>
            }
          >
            <ThreeTimeline />
          </Suspense>
        )}
        {rendered === 'transitioning' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8888aa',
              background: '#141210',
            }}
          >
            전환 중...
          </div>
        )}
      </main>
      <EventDetailPanel />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TimelineApp />
    </QueryClientProvider>
  );
}

export default App;
