export interface RenderNode {
  id: number;
  x: number;
  y: number;
  width: number;
  color: number;
  label: string;
  categoryId: number;
  visible: boolean;
  type: 'point' | 'range';
  endX?: number;
  categoryRow: number;
  subLane: number;
}
