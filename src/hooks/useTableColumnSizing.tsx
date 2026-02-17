import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

// --- top of file additions ---
type ColumnCaps = {
  [index: number]: {
    min?: number;
    max?: number;
    seed?: number; // optional starting width if you want to bias autosize
  };
};

type Options = {
  storageKey: string;
  sampleRows?: number;
  minPx?: number;
  maxPx?: number;
  autoSizeDeps?: any[];
  columnCaps?: ColumnCaps;  // <-- NEW
};

export function useTableColumnSizing<T extends HTMLTableElement>(
  tableRef: React.RefObject<T>,
  {
    storageKey,
    sampleRows = 200,
    minPx = 80,
    maxPx = 520,
    autoSizeDeps = [],
    columnCaps,                 // <-- NEW
  }: Options
) {
  const [widths, setWidths] = useState<number[] | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(`colw:${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
          setWidths(parsed as number[]);
        }
      }
    } catch {}
  }, [storageKey]);

  
function clampForIndex(width: number, index: number) {
    const cap = columnCaps?.[index];
    const localMin = cap?.min ?? minPx;
    const localMax = cap?.max ?? maxPx;
    return Math.max(localMin, Math.min(localMax, width));
  }


  function measureAll(): number[] | null {
    const table = tableRef.current;
    if (!table) return null;
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    if (!thead || !tbody) return null;

    const ths = Array.from(thead.querySelectorAll("th")) as HTMLElement[];
    const colCount = ths.length;
    if (!colCount) return null;

    const measured = new Array(colCount).fill(0);
    for (let i = 0; i < colCount; i++) {
      measured[i] = Math.ceil(Math.max(ths[i].scrollWidth, ths[i].getBoundingClientRect().width));
    }

    const rows = Array.from(tbody.querySelectorAll("tr")).slice(0, sampleRows);
    for (const row of rows) {
      const cells = Array.from(row.children) as HTMLElement[];
      for (let i = 0; i < Math.min(cells.length, colCount); i++) {
        const cell = cells[i];
        const w = Math.ceil(Math.max(cell.scrollWidth, cell.getBoundingClientRect().width));
        if (w > measured[i]) measured[i] = w;
      }
    }

    for (let i = 0; i < measured.length; i++) measured[i] += 12;
    
    for (let i = 0; i < measured.length; i++) {
        measured[i] = clampForIndex(measured[i], i);

    }
    
// if you want to bias the starting width, apply seed (optional)
    for (let i = 0; i < measured.length; i++) {
      const seed = columnCaps?.[i]?.seed;
      if (typeof seed === "number") {
        measured[i] = Math.max(seed, measured[i]);
        measured[i] = clampForIndex(measured[i], i);
      }
    }

    return measured;
  }

  useLayoutEffect(() => {
    if (widths && widths.length) return;
    const measured = measureAll();
    if (measured) {
      setWidths(measured);
      try {
        localStorage.setItem(`colw:${storageKey}`, JSON.stringify(measured));
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableRef, ...autoSizeDeps]);

  const startResize = (e: React.MouseEvent, colIndex: number) => {
    if (!widths) return;

    let isDragging = true;
    const startX = e.clientX;
    const startWidth = widths[colIndex];

    const onMove = (ev: MouseEvent) => {
      if (!isDragging) return;
      const dx = ev.clientX - startX;
      setWidths((prev) => {
        if (!prev) return prev;
        const next = prev.slice();
        next[colIndex] = clampForIndex(startWidth + dx, colIndex); // <-- clamp per column
        return next;
      });
      document.body.classList.add("pm-col-resizing");
    };

    const onUp = () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.classList.remove("pm-col-resizing");
      try {
        const now = widths ?? [];
        localStorage.setItem(`colw:${storageKey}`, JSON.stringify(now));
      } catch {}
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const autoFitColumn = (colIndex: number) => {
    let base = widths;
    if (!base) {
      const measured = measureAll();
      if (!measured) return;
      base = measured;
    }
    const measuredAll = measureAll();
    if (!measuredAll) return;

    const next = base.slice();
    next[colIndex] = clampForIndex(measuredAll[colIndex], colIndex); // <-- clamp
    setWidths(next);
    try {
      localStorage.setItem(`colw:${storageKey}`, JSON.stringify(next));
    } catch {}
  };

  // AFTER (uses React’s type)
const ColGroup = useMemo<React.ReactElement | null>(() => {
    if (!widths) return null;
    return (
      <colgroup>
        {widths.map((w, i) => (
          <col key={i} style={{ width: `${w}px` }} />
        ))}
      </colgroup>
    );
  }, [widths]);

  const resetWidths = () => {
    try {
      localStorage.removeItem(`colw:${storageKey}`);
    } catch {}
    setWidths(null);
  };

  return { widths, setWidths, ColGroup, startResize, autoFitColumn, resetWidths };
}