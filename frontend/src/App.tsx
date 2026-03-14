import { lazy, Suspense, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimelineCanvas from './components/TimelineCanvas';
import EventDetailPanel from './components/EventDetailPanel';
import ZoomControls from './components/ZoomControls';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import ViewModeToggle from './components/ViewModeToggle';
import { useTimelineStore } from './store/useTimelineStore';
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
      <div className="app__header">
        <SearchBar />
        <CategoryFilter />
        <ViewModeToggle />
      </div>
      <div className="app__canvas">
        {rendered === 'pixi' && <TimelineCanvas />}
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
              background: '#0a0a1a',
            }}
          >
            전환 중...
          </div>
        )}
        <ZoomControls />
      </div>
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
