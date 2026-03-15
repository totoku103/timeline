import { useTimelineStore } from '../store/useTimelineStore';
import type { ViewportManager } from '../engine/scale/ViewportManager';

interface CanvasZoomButtonsProps {
  viewportManagerRef: React.RefObject<ViewportManager | null>;
}

const ZOOM_STEP = 3;

export default function CanvasZoomButtons({ viewportManagerRef }: CanvasZoomButtonsProps) {
  const referenceLineYear = useTimelineStore((s) => s.referenceLineYear);

  const handleZoomIn = () => {
    const vm = viewportManagerRef.current;
    if (!vm) return;
    if (referenceLineYear !== null) {
      vm.zoomAtYear(ZOOM_STEP, referenceLineYear);
    } else {
      vm.zoom(ZOOM_STEP, vm.getViewport().width / 2);
    }
  };

  const handleZoomOut = () => {
    const vm = viewportManagerRef.current;
    if (!vm) return;
    if (referenceLineYear !== null) {
      vm.zoomAtYear(-ZOOM_STEP, referenceLineYear);
    } else {
      vm.zoom(-ZOOM_STEP, vm.getViewport().width / 2);
    }
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
      {referenceLineYear !== null && (
        <button
          className="canvas-zoom__btn"
          onClick={() => {
            const vm = viewportManagerRef.current;
            if (vm && referenceLineYear !== null) {
              vm.jumpToYear(referenceLineYear);
            }
          }}
          aria-label="기준선으로 이동"
          title="기준선으로 이동"
        >
          ◎
        </button>
      )}
    </div>
  );
}
