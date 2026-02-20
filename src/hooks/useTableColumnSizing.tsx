import React, { 
  useState, 
  useRef, 
  useLayoutEffect, 
  useMemo,
  useEffect  // ADD THIS
} from "react";

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
    minPx = 40,
    maxPx = 520,
    autoSizeDeps = [],
    columnCaps,                 // <-- NEW
  }: Options
) {
  const [widths, setWidths] = useState<number[] | null>(null);
  const widthsRef = useRef<number[] | null>(null);
  const hasLoadedFromStorage = useRef(false);
  const hasInitializedWidths = useRef(false);
  const prevDepsRef = useRef<any[]>([]);
  const isFirstMount = useRef(true);

  React.useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  // Load from localStorage ONLY on first mount
  React.useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    hasLoadedFromStorage.current = true;
    
    try {
      const raw = localStorage.getItem(`colw:${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
          console.log('[useTableColumnSizing] Loaded widths from storage:', parsed.length, 'columns');
          setWidths(parsed);
          hasInitializedWidths.current = true;
        }
      }
    } catch {}
  }, [storageKey]);

  // Check if autoSizeDeps changed (e.g., category change or new data)
  const depsChanged = useMemo(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevDepsRef.current = autoSizeDeps;
      return false;
    }
    const changed = JSON.stringify(prevDepsRef.current) !== JSON.stringify(autoSizeDeps);
    if (changed) {
      console.log('[useTableColumnSizing] Deps changed - forcing re-measure');
      prevDepsRef.current = autoSizeDeps;
      hasInitializedWidths.current = false; // Force re-measure
      setWidths(null); // Clear current widths
    }
    return changed;
  }, [autoSizeDeps]);

  // Reset initialization flag when deps change
  useEffect(() => {
    if (depsChanged && hasInitializedWidths.current) {
      console.log('[useTableColumnSizing] Deps changed - will re-measure');
      hasInitializedWidths.current = false;
    }
  }, [depsChanged]);

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

    console.log('[useTableColumnSizing] Measuring all columns...');
    const measured = new Array(colCount).fill(0);
    
    // Measure headers first
    for (let i = 0; i < colCount; i++) {
      const seed = columnCaps?.[i]?.seed;
      if (typeof seed === "number") {
        measured[i] = seed;
        console.log(`[useTableColumnSizing] Column ${i}: using seed ${seed}px`);
      } else {
        const headerWidth = Math.ceil(ths[i].scrollWidth);
        measured[i] = headerWidth;
        console.log(`[useTableColumnSizing] Column ${i}: header measured ${headerWidth}px`);
      }
    }

    // Measure cell content
    const rows = Array.from(tbody.querySelectorAll("tr")).slice(0, sampleRows);
    console.log(`[useTableColumnSizing] Measuring ${rows.length} rows`);
    
    for (const row of rows) {
      const cells = Array.from(row.children) as HTMLElement[];
      for (let i = 0; i < Math.min(cells.length, colCount); i++) {
        const seed = columnCaps?.[i]?.seed;
        if (typeof seed === "number") continue;
        
        const cell = cells[i];
        const w = Math.ceil(cell.scrollWidth);
        if (w > measured[i]) {
          measured[i] = w;
        }
      }
    }

    // Add padding
    for (let i = 0; i < measured.length; i++) {
      if (typeof columnCaps?.[i]?.seed !== "number") {
        measured[i] += 24; // Padding
      }
    }

    // Apply min/max constraints
    for (let i = 0; i < measured.length; i++) {
      measured[i] = clampForIndex(measured[i], i);
      console.log(`[useTableColumnSizing] Column ${i}: final width ${measured[i]}px`);
    }

    return measured;
  }

  // Auto-measure when needed
  useLayoutEffect(() => {
    if (hasInitializedWidths.current) {
      console.log('[useTableColumnSizing] Skipping auto-measure - already initialized');
      return;
    }
    
    if (!tableRef.current) return;
    
    const measured = measureAll();
    if (measured) {
      console.log('[useTableColumnSizing] Auto-measure complete, applying widths');
      setWidths(measured);
      hasInitializedWidths.current = true;
      try {
        localStorage.setItem(`colw:${storageKey}`, JSON.stringify(measured));
      } catch {}
    }
  }, [tableRef, depsChanged, widths]); // Add widths to deps

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
    const table = tableRef.current;
    if (!table) return;

    // Temporarily remove width constraints to measure true content size
    const colGroup = table.querySelector('colgroup');
    const col = colGroup?.children[colIndex] as HTMLElement | undefined;
    const originalWidth = col?.style.width;
    
    if (col) {
      col.style.width = 'auto';
      col.style.minWidth = 'auto';
    }

    // Force browser reflow
    table.offsetHeight;

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    if (!thead || !tbody) return;

    const th = thead.querySelectorAll("th")[colIndex] as HTMLElement;
    if (!th) return;

    let maxWidth = Math.ceil(th.scrollWidth);

    const rows = Array.from(tbody.querySelectorAll("tr")).slice(0, sampleRows);
    for (const row of rows) {
      const cell = row.children[colIndex] as HTMLElement | undefined;
      if (cell) {
        const w = Math.ceil(cell.scrollWidth);
        if (w > maxWidth) maxWidth = w;
      }
    }

    // Restore original width
    if (col && originalWidth) {
      col.style.width = originalWidth;
      col.style.minWidth = originalWidth;
    }

    maxWidth += 24; // Add padding
    const finalWidth = clampForIndex(maxWidth, colIndex);

    console.log(`[useTableColumnSizing] Auto-fit column ${colIndex} to ${finalWidth}px`);

    setWidths((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[colIndex] = finalWidth;
      return next;
    });

    // Save immediately
    setTimeout(() => {
      const currentWidths = widthsRef.current;
      if (currentWidths) {
        try {
          localStorage.setItem(`colw:${storageKey}`, JSON.stringify(currentWidths));
        } catch {}
      }
    }, 0);
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