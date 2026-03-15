import { useEffect, useState } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { getTimeline } from '../api/timelineApi';
import type { TimelineEvent } from '../types/timeline';

function formatYear(year: number): string {
  if (year < 0) {
    const abs = Math.abs(year);
    if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)}B BCE`;
    if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M BCE`;
    if (abs >= 1_000) return `${(abs / 1_000).toFixed(1)}K BCE`;
    return `${abs} BCE`;
  }
  if (year >= 1_000_000_000) return `${(year / 1_000_000_000).toFixed(1)}B`;
  if (year >= 1_000_000) return `${(year / 1_000_000).toFixed(1)}M`;
  if (year >= 1_000) return `${year}`;
  return `${year} CE`;
}

const PRECISION_LABELS: Record<string, string> = {
  BILLION_YEARS: '10억년',
  HUNDRED_MILLION_YEARS: '1억년',
  TEN_MILLION_YEARS: '1000만년',
  MILLION_YEARS: '100만년',
  HUNDRED_THOUSAND_YEARS: '10만년',
  TEN_THOUSAND_YEARS: '1만년',
  MILLENNIUM: '천년',
  CENTURY: '세기',
  DECADE: '연대',
  YEAR: '연도',
  MONTH: '월',
  DAY: '일',
  HOUR: '시간',
  MINUTE: '분',
  SECOND: '초',
};

export default function EventDetailPanel() {
  const { selectedEventId, showDetailPanel, setShowDetailPanel, setSelectedEventId } =
    useTimelineStore();
  const [event, setEvent] = useState<TimelineEvent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedEventId) {
      setEvent(null);
      return;
    }
    setLoading(true);
    getTimeline(selectedEventId)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const handleClose = () => {
    setShowDetailPanel(false);
    setSelectedEventId(null);
  };

  const handleCorrectionRequest = () => {
    if (!event) return;
    const yearInfo = event.eventType === 'RANGE' && event.endYear
      ? `${formatYear(event.eventYear)} ~ ${formatYear(event.endYear)}`
      : formatYear(event.eventYear);
    const subject = encodeURIComponent(`[이벤트 수정 요청] ${event.title}`);
    const body = encodeURIComponent(
      `이벤트 수정을 요청합니다.\n\n` +
      `────────────────\n` +
      `ID: ${event.id}\n` +
      `제목: ${event.title}\n` +
      `연도: ${yearInfo}\n` +
      `태그: ${event.categoryNames.join(', ') || '-'}\n` +


      `────────────────\n\n` +
      `수정 내용:\n\n`
    );
    window.open(`mailto:support@therene.co.kr?subject=${subject}&body=${body}`);
  };

  const visible = showDetailPanel && !!selectedEventId;

  return (
    <div className={`event-detail-panel${visible ? ' event-detail-panel--visible' : ''}`}>
      <div className="event-detail-panel__header">
        <span className="event-detail-panel__title">이벤트 상세</span>
        <button className="event-detail-panel__close" onClick={handleClose} aria-label="닫기">
          ✕
        </button>
      </div>

      {loading && <div className="event-detail-panel__loading">불러오는 중...</div>}

      {!loading && event && (
        <div className="event-detail-panel__content">
          <h2 className="event-detail-panel__event-title">{event.title}</h2>

          <div className="event-detail-panel__meta">
            <div className="event-detail-panel__meta-item">
              <span className="event-detail-panel__meta-label">연도</span>
              <span className="event-detail-panel__meta-value">
                {event.eventType === 'RANGE' && event.endYear
                  ? `${formatYear(event.eventYear)} ~ ${formatYear(event.endYear)}`
                  : formatYear(event.eventYear)}
              </span>
            </div>
            <div className="event-detail-panel__meta-item">
              <span className="event-detail-panel__meta-label">태그</span>
              <span className="event-detail-panel__meta-value">{event.categoryNames.join(', ') || '-'}</span>
            </div>
            {event.location && (
              <div className="event-detail-panel__meta-item">
                <span className="event-detail-panel__meta-label">위치</span>
                <span className="event-detail-panel__meta-value">{event.location}</span>
              </div>
            )}
            <div className="event-detail-panel__meta-item">
              <span className="event-detail-panel__meta-label">정밀도</span>
              <span className="event-detail-panel__meta-value">
                {PRECISION_LABELS[event.precisionLevel] ?? event.precisionLevel}
              </span>
            </div>
          </div>

          {event.description && (
            <p className="event-detail-panel__description">{event.description}</p>
          )}

          {event.source && (
            <div className="event-detail-panel__source">
              <span className="event-detail-panel__meta-label">출처</span>
              <span className="event-detail-panel__source-text">{event.source}</span>
            </div>
          )}

          <button
            className="event-detail-panel__correction-btn"
            onClick={handleCorrectionRequest}
          >
            수정 요청
          </button>
        </div>
      )}
    </div>
  );
}
