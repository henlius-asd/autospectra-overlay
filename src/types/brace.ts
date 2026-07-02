/** Horizontal brace annotation on the X-axis */
export interface BraceAnnotation {
  id: string;
  type: 'horizontal';
  startX: number;
  endX: number;
  label: string;
}