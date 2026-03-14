import { useRef, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchTimelines } from '../api/timelineApi';
import { getCategories } from '../api/categoryApi';
import { useTimelineStore } from '../store/useTimelineStore';
import { getZoomLevelForRange } from '../engine/scale/precisionMapping';

const BUFFER_MULTIPLIER = 3;   // 뷰포트의 3배 범위를 미리 로딩
const REFETCH_THRESHOLD = 0.4; // 버퍼의 40% 밖으로 나가면 재호출

/**
 * 뷰포트 이벤트를 버퍼링하여 로딩.
 * 현재 뷰포트의 3배 범위를 미리 가져오고,
 * 뷰포트가 버퍼 범위의 40% 밖으로 이동하면 재호출.
 */
export function useViewportEvents() {
  const { viewport, filters, searchQuery } = useTimelineStore();
  const { fromYear, toYear } = viewport;
  const yearRange = toYear - fromYear;
  const zoomConfig = getZoomLevelForRange(yearRange);
  const precisionLevel = zoomConfig.precisionLevel;

  const categoryId = filters.categoryIds?.[0];

  // 마지막으로 fetch한 버퍼 범위를 추적
  const lastFetchRange = useRef({ from: fromYear, to: toYear, range: yearRange });

  // 버퍼 범위 계산: 현재 뷰포트 범위 밖으로 나갔을 때만 새 범위로 갱신
  const fetchRange = useMemo(() => {
    const last = lastFetchRange.current;
    const bufferMargin = last.range * BUFFER_MULTIPLIER * REFETCH_THRESHOLD;

    // 현재 뷰포트가 마지막 fetch 범위 내에 충분히 포함되어 있는지 확인
    const isWithinBuffer =
      fromYear >= last.from - bufferMargin * 0.1 &&
      toYear <= last.to + bufferMargin * 0.1 &&
      Math.abs(yearRange - last.range) < last.range * 0.5; // 줌 레벨이 크게 바뀌지 않았을 때만

    if (isWithinBuffer) {
      return { from: last.from, to: last.to };
    }

    // 새 버퍼 범위 계산 (뷰포트 중심 기준 3배)
    const center = (fromYear + toYear) / 2;
    const halfBuffer = (yearRange * BUFFER_MULTIPLIER) / 2;
    const newFrom = center - halfBuffer;
    const newTo = center + halfBuffer;

    lastFetchRange.current = { from: newFrom, to: newTo, range: yearRange };
    return { from: newFrom, to: newTo };
  }, [fromYear, toYear, yearRange]);

  return useQuery({
    queryKey: ['timelines', fetchRange.from, fetchRange.to, precisionLevel, filters.categoryIds, searchQuery],
    queryFn: () =>
      searchTimelines({
        fromYear: fetchRange.from,
        toYear: fetchRange.to,
        precisionLevel,
        categoryId,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
}
