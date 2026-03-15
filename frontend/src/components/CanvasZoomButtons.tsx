import { useTimelineStore } from '../store/useTimelineStore';

export default function CanvasZoomButtons() {
  const { viewport, setViewport, referenceLineYear } = useTimelineStore();
  const { fromYear, toYear, centerYear } = viewport;
  const range = toYear - fromYear;

  const anchor = referenceLineYear ?? centerYear;

  const handleZoomIn = () => {
    const newRange = range / 2;
    setViewport({
      fromYear: anchor - newRange * ((anchor - fromYear) / range),
      toYear: anchor + newRange * ((toYear - anchor) / range),
    });
  };

  const handleZoomOut = () => {
    const newRange = range * 2;
    setViewport({
      fromYear: anchor - newRange * ((anchor - fromYear) / range),
      toYear: anchor + newRange * ((toYear - anchor) / range),
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
