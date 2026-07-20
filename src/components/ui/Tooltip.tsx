import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

interface TooltipProps {
  /** Tooltip text content */
  label: string;
  /** Optional keyboard shortcut hint rendered as kbd */
  kbd?: string;
  /** Preferred side; defaults to bottom (toolbar chrome) */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** The trigger element. Must accept a ref (native elements and most components do). */
  children: ReactNode;
}

/**
 * Unified tooltip primitive (Radix). 300ms delay, hover + focus trigger,
 * design-token styling. Requires a TooltipProvider ancestor (mounted in App).
 */
export default function Tooltip({ label, kbd, side = 'bottom', children }: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={300}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={4}
          className="z-[100] flex items-center gap-1.5 bg-ink text-white text-xs rounded-md px-2 py-1 shadow-overlay select-none"
        >
          <span>{label}</span>
          {kbd && <kbd className="text-white/70 font-mono text-[11px]">{kbd}</kbd>}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
