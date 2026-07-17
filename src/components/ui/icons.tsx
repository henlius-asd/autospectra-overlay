import type { SVGProps } from 'react';

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

export function UndoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </Icon>
  );
}

export function RedoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
    </Icon>
  );
}

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
  return (
    <Icon {...props}>
      <path d="M9 4c-2 0-3 1-3 3v2c0 2-1 3-3 3 2 0 3 1 3 3v2c0 2 1 3 3 3" />
      <path d="M15 4c2 0 3 1 3 3v2c0 2 1 3 3 3-2 0-3 1-3 3v2c0 2-1 3-3 3" />
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

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  );
}

export function UnlockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
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

export function ExportImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v6" />
      <path d="m9 11 3 3 3-3" />
      <circle cx="8" cy="7" r="1.5" fill="currentColor" stroke="none" />
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

export function ExportWorkspaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </Icon>
  );
}

export function ImportWorkspaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </Icon>
  );
}

export function NewWorkspaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </Icon>
  );
}

export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </Icon>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <polyline points="6 9 12 15 18 9" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <polyline points="20 6 9 17 4 12" />
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