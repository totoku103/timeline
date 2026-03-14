import { useTimelineStore } from '../store/useTimelineStore';

export default function CanvasZoomButtons() {
  const { viewport, setViewport } = useTimelineStore();
  const { fromYear, toYear, centerYear } = viewport;
  const range = toYear - fromYear;

  const handleZoomIn = () => {
    const newRange = range / 2;
    const half = newRange / 2;
    setViewport({
      fromYear: centerYear - half,
      toYear: centerYear + half,
      centerYear,
    });
  };

  const handleZoomOut = () => {
    const newRange = range * 2;
    const half = newRange / 2;
    setViewport({
      fromYear: centerYear - half,
      toYear: centerYear + half,
      centerYear,
    });
  };

  return (
    <div className="canvas-zoom">
      <button
        className="canvas-zoom__btn"
        onClick={handleZoomIn}
        aria-label="확대"
        title="확대"
      >
        +
      </button>
      <button
        className="canvas-zoom__btn"
        onClick={handleZoomOut}
        aria-label="축소"
        title="축소"
      >
        −
      </button>
    </div>
  );
}
