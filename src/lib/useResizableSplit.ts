'use client';

import { useCallback, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

// Drives a vertical resize handle between a list and a detail panel laid out
// side by side. Reports the panel's width as a percentage of the container,
// measured from the right edge (the panel sits on the right).
export function useResizableSplit({
  onChange,
  min = 35,
  max = 70,
  containerRef,
}: {
  onChange: (pct: number) => void;
  min?: number;
  max?: number;
  containerRef: RefObject<HTMLElement | null>;
}) {
  const [resizing, setResizing] = useState(false);

  const onHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      setResizing(true);

      const handleMove = (moveEvent: PointerEvent) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const distanceFromRight = rect.right - moveEvent.clientX;
        const pct = (distanceFromRight / rect.width) * 100;
        onChange(Math.min(max, Math.max(min, pct)));
      };

      const handleUp = () => {
        setResizing(false);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [containerRef, max, min, onChange],
  );

  return { resizing, onHandlePointerDown };
}
