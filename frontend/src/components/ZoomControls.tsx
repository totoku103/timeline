import { useTimelineStore } from '../store/useTimelineStore';
import { getZoomLevelForRange } from '../engine/scale/precisionMapping';

function formatYearShort(year: number): string {
  if (year < 0) {
    const abs = Math.abs(year);
    if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)}B BCE`;
    if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M BCE`;
    if (abs >= 1_000) return `${Math.round(abs / 1_000)}K BCE`;
    return `${abs} BCE`;
  }
  if (year >= 1_000_000_000) return `${(year / 1_000_000_000).toFixed(1)}B`;
  if (year >= 1_000_000) return `${(year / 1_000_000).toFixed(1)}M`;
  return `${year}`;
}

const PRESET_RANGES: Array<{ label: string; fromYear: number; toYear: number }> = [
  { label: '우주', fromYear: -13_800_000_000, toYear: 2030 },
  { label: '지질', fromYear: -541_000_000, toYear: 2030 },
  { label: '고대', fromYear: -10_000, toYear: 2030 },
  { label: '현대', fromYear: 1800, toYear: 2030 },
];

export default function ZoomControls() {
  const { viewport, setViewport } = useTimelineStore();
  const { fromYear, toYear, centerYear } = viewport;
  const range = toYear - fromYear;
  const zoomConfig = getZoomLevelForRange(range);

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

  const handlePreset = (preset: (typeof PRESET_RANGES)[number]) => {
    const center = (preset.fromYear + preset.toYear) / 2;
    const presetRange = preset.toYear - preset.fromYear;
    const zl = getZoomLevelForRange(presetRange);
    setViewport({
      fromYear: preset.fromYear,
      toYear: preset.toYear,
      centerYear: center,
      zoomLevel: zl.level,
    });
  };

  return (
    <div className="zoom-controls">
      <div className="zoom-controls__info">
        <span className="zoom-controls__level-name">{zoomConfig.nameKo}</span>
        <span className="zoom-controls__range">
          {formatYearShort(fromYear)} ~ {formatYearShort(toYear)}
        </span>
      </div>

      <div className="zoom-controls__presets">
        {PRESET_RANGES.map((p) => (
          <button
            key={p.label}
            className="zoom-controls__preset-btn"
            onClick={() => handlePreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="zoom-controls__buttons">
        <button className="zoom-controls__btn" onClick={handleZoomIn} aria-label="확대">
          +
        </button>
        <button className="zoom-controls__btn" onClick={handleZoomOut} aria-label="축소">
          −
        </button>
      </div>
    </div>
  );
}
