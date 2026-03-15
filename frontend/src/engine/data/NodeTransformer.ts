import type { TimelineEvent, Category } from '../../types/timeline';
import type { Viewport } from '../../types/viewport';
import type { RenderNode } from '../../types/render';
import { yearToScreen } from '../scale/symlog';
import { getCategoryColor } from '../scale/precisionMapping';

const NODE_RADIUS = 12;
const MAX_LABEL_LENGTH = 30;

export interface CategoryRowConfig {
  categoryId: number;
  categoryName: string;
  rowIndex: number;
  subLaneCount: number; // 이 Row에 필요한 서브레인 수
}

/**
 * Compute a precise fractional year incorporating month and day.
 * e.g., July 15 of year 2000 → 2000 + (6*30.44 + 14) / 365 ≈ 2000.537
 */
function toPreciseYear(event: TimelineEvent): number {
  let year = event.eventYear;
  if (event.eventMonth != null && event.eventMonth >= 1) {
    year += (event.eventMonth - 1) * 30.44 / 365;
    if (event.eventDay != null && event.eventDay >= 1) {
      year += (event.eventDay - 1) / 365;
    }
  }
  return year;
}

function toPreciseEndYear(event: TimelineEvent): number {
  let year = event.endYear ?? event.eventYear;
  if (event.endMonth != null && event.endMonth >= 1) {
    year += (event.endMonth - 1) * 30.44 / 365;
    if (event.endDay != null && event.endDay >= 1) {
      year += (event.endDay - 1) / 365;
    }
  }
  return year;
}

/**
 * Transform TimelineEvent[] to RenderNode[] using category-fixed row layout.
 * Each category gets a fixed row index; events within a row use sub-lanes to avoid overlaps.
 * y is set to 0 — actual y is computed by the rendering layer using categoryRow + subLane.
 */
export function transformNodes(
  events: TimelineEvent[],
  viewport: Viewport,
  categories: Category[],
): { nodes: RenderNode[]; rowConfigs: CategoryRowConfig[] } {
  if (categories.length === 0) {
    return { nodes: [], rowConfigs: [] };
  }

  // Build category → rowIndex map from the ordered categories array
  const categoryRowMap = new Map<number, number>();
  for (let i = 0; i < categories.length; i++) {
    categoryRowMap.set(categories[i].id, i);
  }

  // Group events by categoryId (one event can appear in multiple category rows)
  const eventsByCategory = new Map<number, TimelineEvent[]>();
  for (const event of events) {
    for (const catId of event.categoryIds) {
      if (!categoryRowMap.has(catId)) continue;
      const group = eventsByCategory.get(catId);
      if (group) {
        group.push(event);
      } else {
        eventsByCategory.set(catId, [event]);
      }
    }
  }

  const nodes: RenderNode[] = [];
  // subLaneCount per rowIndex, initialized to 1 for all categories
  const subLaneCountByRow = new Map<number, number>();
  for (const cat of categories) {
    subLaneCountByRow.set(categoryRowMap.get(cat.id)!, 1);
  }

  for (const [categoryId, catEvents] of eventsByCategory) {
    const rowIndex = categoryRowMap.get(categoryId)!;

    // 시간순 정렬: 정밀 연도 → sortOrder → id
    catEvents.sort((a, b) => {
      const yearDiff = toPreciseYear(a) - toPreciseYear(b);
      if (yearDiff !== 0) return yearDiff;
      const sortDiff = a.sortOrder - b.sortOrder;
      if (sortDiff !== 0) return sortDiff;
      return a.id - b.id;
    });

    // Sub-lane occupancy for this category row
    const subLaneOccupancy: Array<Array<{ left: number; right: number }>> = [[]];

    for (const event of catEvents) {
      const x = yearToScreen(toPreciseYear(event), viewport);

      let type: 'point' | 'range';
      let width: number;
      let endX: number | undefined;
      let visible: boolean;

      if (event.eventType === 'RANGE' && event.endYear != null) {
        type = 'range';
        endX = yearToScreen(toPreciseEndYear(event), viewport);
        width = Math.max(0, endX - x);
        visible = endX >= 0 && x <= viewport.width;
      } else {
        type = 'point';
        width = NODE_RADIUS * 2;
        if (event.uncertaintyYears != null && event.uncertaintyYears > 0) {
          const leftX = yearToScreen(event.eventYear - event.uncertaintyYears, viewport);
          const rightX = yearToScreen(event.eventYear + event.uncertaintyYears, viewport);
          const uncertaintyWidth = rightX - leftX;
          width = Math.max(width, uncertaintyWidth);
        }
        visible = x + width / 2 >= 0 && x - width / 2 <= viewport.width;
      }

      // Determine sub-lane: find first lane with no x-overlap
      const nodeLeft = type === 'range' ? x - 4 : x - width / 2 - 4;
      const nodeRight = type === 'range' ? (endX ?? x) + 4 : x + width / 2 + 4;

      let assignedSubLane = -1;
      for (let lane = 0; lane < subLaneOccupancy.length; lane++) {
        const occupied = subLaneOccupancy[lane];
        let hasOverlap = false;
        for (const occ of occupied) {
          if (nodeLeft < occ.right && nodeRight > occ.left) {
            hasOverlap = true;
            break;
          }
        }
        if (!hasOverlap) {
          assignedSubLane = lane;
          break;
        }
      }

      // If no free lane found, open a new sub-lane
      if (assignedSubLane === -1) {
        assignedSubLane = subLaneOccupancy.length;
        subLaneOccupancy.push([]);
      }

      subLaneOccupancy[assignedSubLane].push({ left: nodeLeft, right: nodeRight });

      const color = getCategoryColor(categoryId);

      let label = event.title;
      if (label.length > MAX_LABEL_LENGTH) {
        label = label.substring(0, MAX_LABEL_LENGTH - 1) + '…';
      }

      const node: RenderNode = {
        id: event.id,
        x,
        y: 0,
        width,
        color,
        label,
        categoryId,
        visible,
        type,
        categoryRow: rowIndex,
        subLane: assignedSubLane,
      };
      if (endX !== undefined) {
        node.endX = endX;
      }

      nodes.push(node);
    }

    // Update the max sub-lane count for this row
    const currentMax = subLaneCountByRow.get(rowIndex) ?? 1;
    subLaneCountByRow.set(rowIndex, Math.max(currentMax, subLaneOccupancy.length));
  }

  // Build rowConfigs in category order
  const rowConfigs: CategoryRowConfig[] = categories.map((cat) => {
    const rowIndex = categoryRowMap.get(cat.id)!;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      rowIndex,
      subLaneCount: subLaneCountByRow.get(rowIndex) ?? 1,
    };
  });

  return { nodes, rowConfigs };
}
