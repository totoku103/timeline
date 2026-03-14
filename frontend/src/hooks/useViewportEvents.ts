import { useQuery } from '@tanstack/react-query';
import { searchTimelines } from '../api/timelineApi';
import { getCategories } from '../api/categoryApi';
import { useTimelineStore } from '../store/useTimelineStore';
import { getZoomLevelForRange } from '../engine/scale/precisionMapping';

export function useViewportEvents() {
  const { viewport, filters, searchQuery } = useTimelineStore();
  const { fromYear, toYear } = viewport;
  const yearRange = toYear - fromYear;
  const zoomConfig = getZoomLevelForRange(yearRange);
  const precisionLevel = zoomConfig.precisionLevel;

  return useQuery({
    queryKey: ['timelines', fromYear, toYear, precisionLevel, filters.categoryId, searchQuery],
    queryFn: () =>
      searchTimelines({
        fromYear,
        toYear,
        precisionLevel,
        categoryId: filters.categoryId,
      }),
    staleTime: 30_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
}
