import { useRef, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchTimelines } from '../api/timelineApi';
import { getCategories } from '../api/categoryApi';
import { getCountries } from '../api/countryApi';
import { useTimelineStore } from '../store/useTimelineStore';
import { getZoomLevelForRange } from '../engine/scale/precisionMapping';

const BUFFER_MULTIPLIER = 3;
const REFETCH_THRESHOLD = 0.4;

/**
 * 뷰포트 이벤트를 버퍼링하여 로딩.
 * 필터(카테고리/국가) 변경 시 버퍼를 리셋하고 데이터를 다시 가져옴.
 */
export function useViewportEvents() {
  const { viewport, filters, searchQuery } = useTimelineStore();
  const { fromYear, toYear } = viewport;
  const yearRange = toYear - fromYear;
  const zoomConfig = getZoomLevelForRange(yearRange);
  const precisionLevel = zoomConfig.precisionLevel;

  // 필터 변경 감지용 키
  const filterKey = JSON.stringify({
    categoryIds: filters.categoryIds ?? [],
    countryIds: filters.countryIds ?? [],
  });

  // 마지막으로 fetch한 버퍼 범위 + 필터 상태 추적
  const lastFetchState = useRef({
    from: fromYear,
    to: toYear,
    range: yearRange,
    filterKey,
  });

  // 버퍼 범위 계산: 뷰포트 이동 또는 필터 변경 시 갱신
  const fetchRange = useMemo(() => {
    const last = lastFetchState.current;

    // 필터가 변경되면 버퍼 리셋
    const filterChanged = last.filterKey !== filterKey;

    if (!filterChanged) {
      const bufferMargin = last.range * BUFFER_MULTIPLIER * REFETCH_THRESHOLD;
      const isWithinBuffer =
        fromYear >= last.from - bufferMargin * 0.1 &&
        toYear <= last.to + bufferMargin * 0.1 &&
        Math.abs(yearRange - last.range) < last.range * 0.5;

      if (isWithinBuffer) {
        return { from: last.from, to: last.to };
      }
    }

    // 새 버퍼 범위 계산
    const center = (fromYear + toYear) / 2;
    const halfBuffer = (yearRange * BUFFER_MULTIPLIER) / 2;
    const newFrom = center - halfBuffer;
    const newTo = center + halfBuffer;

    lastFetchState.current = { from: newFrom, to: newTo, range: yearRange, filterKey };
    return { from: newFrom, to: newTo };
  }, [fromYear, toYear, yearRange, filterKey]);

  return useQuery({
    queryKey: ['timelines', fetchRange.from, fetchRange.to, precisionLevel, filterKey, searchQuery],
    queryFn: () =>
      searchTimelines({
        fromYear: fetchRange.from,
        toYear: fetchRange.to,
        precisionLevel,
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

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: 5 * 60 * 1000,
  });
}
