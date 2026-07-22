import { useEffect, useRef } from 'react';

/**
 * Attach a commit-only color handler to an `<input type="color">`.
 *
 * React wires `onChange` on color inputs to the native `input` event, which
 * fires continuously while the user drags inside the native picker. Writing
 * the store inside React `onChange` therefore applies every intermediate
 * color (the "continuous color selection" bug). The fix mirrors
 * `ColorPanel.tsx:59`: listen to the native `change` event, which fires once
 * on commit (picker close / pointer release).
 *
 * Usage: spread the returned ref onto the input; keep `value` controlled so
 * the swatch stays in sync with the store (e.g. when a history swatch is
 * clicked); add `onChange={() => {}}` to keep React from treating the
 * controlled input as read-only and to swallow the continuous `input` events
 * without writing the store.
 *
 * `onCommit` is kept in a ref so the listener always calls the latest
 * callback (no stale closure) without re-attaching on every render.
 * `deps` controls when the listener re-attaches — pass `[]` for
 * always-mounted inputs; pass a dep that flips when the input mounts/unmounts
 * for conditionally-rendered inputs (e.g. `[selectedCurveId]`).
 */
export function useColorCommit(
  onCommit: (color: string) => void,
  deps: unknown[] = [],
) {
  const ref = useRef<HTMLInputElement>(null);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => {
      if (el.value) commitRef.current(el.value);
    };
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
