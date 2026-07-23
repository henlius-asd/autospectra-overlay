import { useEffect, useRef } from 'react';

/**
 * Attach a commit-only color handler to an `<input type="color">`.
 *
 * React wires `onChange` on color inputs to the native `input` event, which
 * fires continuously while the user drags inside the native picker. Writing
 * the store inside React `onChange` therefore applies every intermediate
 * color (the "continuous color selection" bug). The fix mirrors
 * `ColorPanel.tsx`: listen to the native `change` event, which fires once
 * on commit (picker close / pointer release).
 *
 * The input MUST be uncontrolled (`defaultValue`, NOT a controlled `value`).
 * A controlled `value` + `onChange={() => {}}` makes React restore `el.value`
 * to the controlled prop on every native `input` event — synchronously,
 * BEFORE the `change` event fires — so the `change` listener reads the OLD
 * color and the user's pick never commits (the "can open the palette but
 * can't confirm the selection" bug).
 *
 * To keep the swatch in sync with external store changes (history-swatch
 * clicks, undo/redo, preset apply), pass `syncValue`; a dedicated effect
 * writes it directly to the DOM. Setting `.value` programmatically does NOT
 * fire `input`/`change`, so this never triggers a spurious commit.
 *
 * Usage:
 *   const ref = useColorCommit(
 *     (c) => { setColor(c); },
 *     [],                      // deps: when the change listener re-attaches
 *     toHexColor(storeColor), // syncValue: external → DOM sync
 *   );
 *   return <input type="color" ref={ref} defaultValue={toHexColor(storeColor)} />;
 *
 * `onCommit` is kept in a ref so the listener always calls the latest
 * callback (no stale closure) without re-attaching on every render.
 * `deps` controls when the change listener re-attaches — pass `[]` for
 * always-mounted inputs; pass a dep that flips when the input mounts/unmounts
 * for conditionally-rendered inputs (e.g. `[selectedCurveId]`).
 */
export function useColorCommit(
  onCommit: (color: string) => void,
  deps: unknown[] = [],
  syncValue?: string,
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

  // Sync external value → DOM so the uncontrolled swatch reflects store
  // changes made from outside (history-swatch click, undo/redo, …). We
  // deliberately do NOT use a controlled `value` prop — see the JSDoc above
  // for why that reverts the user's pick before `change` fires.
  useEffect(() => {
    const el = ref.current;
    if (!el || syncValue == null) return;
    if (el.value.toLowerCase() !== syncValue.toLowerCase()) {
      el.value = syncValue;
    }
  }, [syncValue]);

  return ref;
}
