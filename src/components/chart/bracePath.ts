export const BRACE_COLOR = '#e74c3c';

export function bracePath(startX: number, endX: number, y: number): string {
  const width = endX - startX;
  const midX = startX + width / 2;
  const h = 12;
  const w = 6;

  return `M ${startX} ${y}
    C ${startX} ${y - h}, ${startX + w} ${y - h}, ${startX + w} ${y - h / 2}
    L ${midX - w / 2} ${y + h / 2}
    L ${midX} ${y + h}
    L ${midX + w / 2} ${y + h / 2}
    L ${endX - w} ${y - h / 2}
    C ${endX - w} ${y - h}, ${endX} ${y - h}, ${endX} ${y}`;
}
