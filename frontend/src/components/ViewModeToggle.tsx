import { useTimelineStore } from '../store/useTimelineStore';

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useTimelineStore();

  return (
    <div className="view-mode-toggle">
      <button
        className={`view-mode-toggle__btn${viewMode === 'pixi' ? ' view-mode-toggle__btn--active' : ''}`}
        onClick={() => setViewMode('pixi')}
      >
        2D 타임라인
      </button>
      <button
        className={`view-mode-toggle__btn${viewMode === 'three' ? ' view-mode-toggle__btn--active' : ''}`}
        onClick={() => setViewMode('three')}
      >
        3D 타임라인
      </button>
    </div>
  );
}
