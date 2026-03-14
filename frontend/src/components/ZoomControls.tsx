import { useRef, useEffect } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { getZoomLevelForRange } from '../engine/scale/precisionMapping';
import { useAriaLiveRegion } from '../hooks/useAriaLiveRegion';
import YearJumper from './YearJumper';
import type { ViewportManager } from '../engine/scale/ViewportManager';

function formatYearShort(year: number): string {
  const abs = Math.abs(year);
  const suffix = year < 0 ? ' BCE' : '';

  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)}B${suffix}`;
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M${suffix}`;
  if (abs >= 10_000) return `${Math.round(abs / 1_000)}K${suffix}`;
  if (abs < 1) return '0';
  return `${Math.round(abs)}${suffix}`;
}

const PRESET_RANGES: Array<{ label: string; fromYear: number; toYear: number }> = [
  { label: '우주', fromYear: -13_800_000_000, toYear: 2030 },
  { label: '지질', fromYear: -541_000_000, toYear: 2030 },
  { label: '고대', fromYear: -10_000, toYear: 2030 },
  { label: '현대', fromYear: 1800, toYear: 2030 },
];

const INITIAL_VIEWPORT = PRESET_RANGES[3]; // 현대 (1800~2030)

interface ZoomControlsProps {
  /** TimelineEngine의 ViewportManager를 직접 받아 YearJumper에 전달 */
  viewportManagerRef?: React.RefObject<ViewportManager | null>;
}

export default function ZoomControls({ viewportManagerRef }: ZoomControlsProps) {
  const { viewport, setViewport, setFilters, setSearchQuery } = useTimelineStore();
  const { fromYear, toYear, centerYear } = viewport;
  const range = toYear - fromYear;
  const zoomConfig = getZoomLevelForRange(range);
  const { announce } = useAriaLiveRegion();

  // fallback용 내부 ref (viewportManagerRef가 없을 때)
  const internalVmRef = useRef<ViewportManager | null>(null);
  const vmRef = viewportManagerRef ?? internalVmRef;

  const handleZoomIn = () => {
    const newRange = range / 2;
    const half = newRange / 2;
    setViewport({
      fromYear: centerYear - half,
      toYear: centerYear + half,
      centerYear,
    });
    announce(`확대: ${zoomConfig.nameKo} 단위 보기`);
  };

  const handleZoomOut = () => {
    const newRange = range * 2;
    const half = newRange / 2;
    setViewport({
      fromYear: centerYear - half,
      toYear: centerYear + half,
      centerYear,
    });
    announce(`축소: ${getZoomLevelForRange(newRange).nameKo} 단위 보기`);
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
    announce(`${preset.label} 뷰로 이동: ${formatYearShort(preset.fromYear)}부터 ${formatYearShort(preset.toYear)}까지`);
  };

  return (
    <div
      className="zoom-controls"
      role="toolbar"
      aria-label="타임라인 탐색 도구"
    >
      {/* 현재 위치 정보 — 스크린 리더가 읽을 수 있도록 aria-live로 노출 */}
      <div
        className="zoom-controls__info"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`현재 보기: ${zoomConfig.nameKo}, ${formatYearShort(fromYear)}부터 ${formatYearShort(toYear)}까지`}
      >
        <span className="zoom-controls__level-name" aria-hidden="true">
          {zoomConfig.nameKo}
        </span>
        <span className="zoom-controls__range" aria-hidden="true">
          {formatYearShort(fromYear)} ~ {formatYearShort(toYear)}
        </span>
      </div>

      {/* 연도 직접 이동 */}
      <YearJumper
        viewportManagerRef={vmRef}
        onJump={(year, label) => announce(`${label}(으)로 이동했습니다`)}
      />

      {/* 프리셋 버튼 */}
      <div className="zoom-controls__presets" role="group" aria-label="시대 프리셋">
        {PRESET_RANGES.map((p) => (
          <button
            key={p.label}
            className="zoom-controls__preset-btn"
            onClick={() => handlePreset(p)}
            aria-label={`${p.label} 뷰: ${formatYearShort(p.fromYear)}부터 ${formatYearShort(p.toYear)}까지`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 줌 버튼 */}
      <div className="zoom-controls__buttons" role="group" aria-label="확대/축소">
        <button
          className="zoom-controls__btn"
          onClick={handleZoomIn}
          aria-label="확대 (단축키: + 또는 위 방향키)"
          title="확대 (+, ↑)"
        >
          +
        </button>
        <button
          className="zoom-controls__btn"
          onClick={handleZoomOut}
          aria-label="축소 (단축키: - 또는 아래 방향키)"
          title="축소 (-, ↓)"
        >
          −
        </button>
        <button
          className="zoom-controls__btn zoom-controls__btn--reset"
          onClick={() => {
            handlePreset(INITIAL_VIEWPORT);
            setFilters({});
            setSearchQuery('');
            announce('타임라인이 초기화되었습니다. 현대 뷰로 돌아갑니다.');
          }}
          aria-label="초기화: 현대 뷰로 리셋"
          title="뷰포트, 필터, 검색 초기화"
        >
          ↺
        </button>
      </div>

      {/* 키보드 단축키 힌트 (시각 사용자용) */}
      <div className="zoom-controls__kbd-hint" aria-hidden="true">
        <span className="zoom-controls__kbd">←→</span>팬&nbsp;
        <span className="zoom-controls__kbd">↑↓</span>줌&nbsp;
        <span className="zoom-controls__kbd">Home</span><span className="zoom-controls__kbd">End</span>
      </div>
    </div>
  );
}
