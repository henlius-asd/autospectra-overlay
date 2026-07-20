/**
 * Single source of truth for interaction-mode keyboard shortcuts.
 * Consumed by useGlobalKeyboard (registration) and Toolbar Tooltip (display).
 * Keep the two in sync — there is a unit test that validates completeness.
 */
import type { InteractionMode } from '@/types';

export interface ModeShortcut {
  /** The KeyboardEvent.key to match (case-insensitive for letters) */
  key: string;
  /** Whether Shift must be held */
  shift?: boolean;
  /** Short display string for Tooltip kbd */
  display: string;
}

export const MODE_SHORTCUTS: Partial<Record<InteractionMode, ModeShortcut>> = {
  brush:      { key: 'b', display: 'B' },
  brace:      { key: 'B', shift: true, display: 'Shift+B' },
  pointLabel: { key: 'p', display: 'P' },
  move:       { key: 'm', display: 'M' },
  zoomGlobal: { key: 'g', display: 'G' },
  zoomCurve:  { key: 'c', display: 'C' },
  select:     { key: 'v', display: 'V' },
};
