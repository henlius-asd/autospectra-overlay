import type { SVGProps } from 'react';
import {
  Undo2, Redo2, Lock, LockOpen, ChevronDown, ChevronLeft, ChevronRight,
  Check, Ellipsis, ImageDown, Download, Upload, FilePlus2,
  FileUp, Search, AlignCenter, Palette,
} from 'lucide-react';

/*
 * Icon system: generic icons are re-exported from lucide-react (tree-shaken,
 * named exports keep call sites unchanged). Domain-concept icons with no
 * lucide equivalent keep hand-drawn paths following the lucide visual spec
 * (24 viewBox, stroke=2, round caps/joins).
 */

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---- lucide re-exports (same names as before) ---- */

export { Undo2 as UndoIcon, Redo2 as RedoIcon };
export { Lock as LockIcon, LockOpen as UnlockIcon };
export { ChevronDown as ChevronDownIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon };
export { Check as CheckIcon, Ellipsis as MoreIcon };
export { ImageDown as ExportImageIcon, Download as ExportWorkspaceIcon, Upload as ImportWorkspaceIcon, FilePlus2 as NewWorkspaceIcon };
export { FileUp as FileUploadIcon, Search as SearchIcon, AlignCenter as AlignmentIcon, Palette as LabelStyleIcon };

/* ---- domain-concept icons (hand-drawn, lucide visual spec) ---- */

export function SelectIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m5 5 14 14" />
      <path d="M5 19 19 5" />
      <path d="M5 11V5h6" />
      <path d="M19 13v6h-6" />
    </Icon>
  );
}

export function BraceIcon(props: SVGProps<SVGSVGElement>) {
  // Overbrace ⏜: spike points UP, arms open DOWN — matches the brace drawn on the chart.
  return (
    <Icon {...props}>
      <path d="M4 18 Q4 13 8 13 Q12 13 12 6 Q12 13 16 13 Q20 13 20 18" />
    </Icon>
  );
}

export function PointLabelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z" />
      <circle cx="12" cy="9" r="3" />
    </Icon>
  );
}

export function MoveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 8c3-4 6 4 8 0s5 4 8 0" />
      <path d="M3 18h18" />
      <path d="m5 16-2 2 2 2" />
      <path d="m19 16 2 2-2 2" />
    </Icon>
  );
}

export function ZoomGlobalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 7h13" />
      <path d="M3 12h13" />
      <path d="M3 17h13" />
      <path d="M20 5v14" />
      <path d="m18 7 2-2 2 2" />
      <path d="m18 17 2 2 2-2" />
    </Icon>
  );
}

export function ZoomCurveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 12c3-5 6 5 9 0s3 5 6 0" />
      <path d="M20 5v14" />
      <path d="m18 7 2-2 2 2" />
      <path d="m18 17 2 2 2-2" />
    </Icon>
  );
}

export function BoxSelectIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="15" height="15" rx="1" strokeDasharray="3 3" />
      <circle cx="17" cy="17" r="4" />
      <line x1="20" y1="20" x2="22" y2="22" />
    </Icon>
  );
}

export function ExportPptxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 16v4M16 16v4M8 20h8" />
      <path d="M7 12l3-3 3 2 4-4" />
    </Icon>
  );
}

export function NormalizeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20V10" />
      <path d="M4 10h12" />
      <path d="M16 16h6" />
    </Icon>
  );
}

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </Icon>
  );
}

export function XAxisIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 20h16" />
      <polyline points="18 16 20 20 18 20" />
      <path d="M4 20v-4" />
    </Icon>
  );
}

export function YAxisIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 4v16" />
      <polyline points="4 6 8 4 8 6" />
      <path d="M8 4h4" />
    </Icon>
  );
}
