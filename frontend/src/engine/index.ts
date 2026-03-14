export { TimelineEngine } from './TimelineEngine';
export { ViewportManager } from './scale/ViewportManager';
export { SpatialIndex } from './data/SpatialIndex';
export { transformNodes } from './data/NodeTransformer';
export { PanZoomHandler } from './interaction/PanZoomHandler';
export { TimeAxisLayer } from './layers/TimeAxisLayer';
export { EventNodesLayer } from './layers/EventNodesLayer';
export { SelectionOverlay } from './layers/SelectionOverlay';
export { CategoryLaneLayer } from './layers/CategoryLaneLayer';
export type { CategoryRowLayout } from './layers/CategoryLaneLayer';
export { AXIS_HEIGHT, ROW_PADDING, SUB_LANE_HEIGHT, LANE_HEADER_WIDTH } from './layers/CategoryLaneLayer';
export { symlog, symlogInverse, yearToScreen, screenToYear } from './scale/symlog';
export {
  ZOOM_LEVELS,
  CATEGORY_COLORS,
  getZoomLevelForRange,
  getPrecisionForZoom,
  getZoomLevelConfig,
  getCategoryColor,
} from './scale/precisionMapping';
