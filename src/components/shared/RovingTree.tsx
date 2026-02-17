// src/components/shared/RovingTree.tsx
import * as React from "react";

type RovingTreeProps<G, C> = {
  groups: G[];
  getGroupKey: (g: G) => string;
  getGroupLabel: (g: G) => string;
  getCategories: (g: G) => C[];

  getCatKey: (c: C) => string;
  getCatLabel: (c: C) => string;

  /** Controlled expanded groups */
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string, nextExpanded: boolean) => void;

  /** Selection */
  selectedCategoryKey?: string;
  onSelectCategory: (cat: C) => void;

  /** Optional focus target (e.g., anchor to a category and center it) */
  focusCategoryKey?: string;

  /** Class hooks */
  containerClassName?: string;
  groupHeaderClassName?: (group: G, open: boolean) => string;
  categoryClassName?: (cat: C, state: { selected: boolean; focused: boolean }) => string;

  /** ID prefix for category elements */
  catIdPrefix?: string;

  /** A11y */
  ariaLabel?: string;

  /** Scroll behavior */
  scrollBlock?: ScrollLogicalPosition;

  /** Page jump size */
  pageJump?: number;
};

const TYPE_AHEAD_RESET_MS = 600;

export function RovingTree<G, C>({
  groups,
  getGroupKey,
  getGroupLabel,
  getCategories,
  getCatKey,
  getCatLabel,
  expandedGroups,
  onToggleGroup,
  selectedCategoryKey,
  onSelectCategory,
  focusCategoryKey,
  containerClassName,
  groupHeaderClassName,
  categoryClassName,
  catIdPrefix = "cat",
  ariaLabel = "Groups and Categories",
  scrollBlock = "center",
  pageJump = 10,
}: RovingTreeProps<G, C>) {
  // Flatten visible categories (only those under expanded groups), in render order
  const visible = React.useMemo(() => {
    const out: { g: G; cat: C }[] = [];
    for (const g of groups) {
      const gk = getGroupKey(g);
      if (!expandedGroups.has(gk)) continue;
      for (const c of getCategories(g) ?? []) {
        out.push({ g, cat: c });
      }
    }
    return out;
  }, [groups, expandedGroups, getGroupKey, getCategories]);

  const [focusedIdx, setFocusedIdx] = React.useState<number>(() => {
    if (!visible.length) return -1;
    if (selectedCategoryKey != null) {
      const i = visible.findIndex(({ cat }) => getCatKey(cat) === selectedCategoryKey);
      if (i >= 0) return i;
    }
    return 0;
  });

  const typeAheadRef = React.useRef<{ text: string; ts: number }>({ text: "", ts: 0 });

  const scrollCatIntoView = (idx: number) => {
    if (idx < 0 || idx >= visible.length) return;
    const key = getCatKey(visible[idx].cat);
    const el = document.getElementById(`${catIdPrefix}-${encodeURIComponent(key)}`);
    el?.scrollIntoView({ block: scrollBlock, behavior: "smooth" });
  };

  const focusCat = (idx: number) => {
    if (idx < 0 || idx >= visible.length) return;
    setFocusedIdx(idx);
    const key = getCatKey(visible[idx].cat);
    const el = document.getElementById(`${catIdPrefix}-${encodeURIComponent(key)}`) as HTMLButtonElement | null;
    if (el) {
      el.focus();
      scrollCatIntoView(idx);
    }
  };

  // Sync with selectedCategoryKey
  React.useEffect(() => {
    if (!visible.length || selectedCategoryKey == null) return;
    const i = visible.findIndex(({ cat }) => getCatKey(cat) === selectedCategoryKey);
    if (i >= 0) {
      setFocusedIdx(i);
      requestAnimationFrame(() => scrollCatIntoView(i));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryKey, visible.length]);

  // Optional imperative focus target
  React.useEffect(() => {
    if (!visible.length || focusCategoryKey == null) return;
    const i = visible.findIndex(({ cat }) => getCatKey(cat) === focusCategoryKey);
    if (i >= 0) requestAnimationFrame(() => focusCat(i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCategoryKey, visible.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const n = visible.length;
    const current = Math.max(0, Math.min(n - 1, focusedIdx === -1 ? 0 : focusedIdx));

    const go = (idx: number) => {
      const bounded = Math.max(0, Math.min(n - 1, idx));
      focusCat(bounded);
    };

    // If focus is on a group header caret, handle Left/Right there (via data attributes)
    const target = e.target as HTMLElement;
    const onGroupHeader = target?.dataset?.treeGroup === "header";
    if (onGroupHeader) {
      const gk = target.getAttribute("data-group-key") || "";
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onToggleGroup(gk, false);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onToggleGroup(gk, true);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (n > 0) go(0);
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        go(current + 1);
        return;
      case "ArrowUp":
        e.preventDefault();
        go(current - 1);
        return;
      case "Home":
        e.preventDefault();
        go(0);
        return;
      case "End":
        e.preventDefault();
        go(n - 1);
        return;
      case "PageDown":
        e.preventDefault();
        go(current + pageJump);
        return;
      case "PageUp":
        e.preventDefault();
        go(current - pageJump);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (n > 0) onSelectCategory(visible[current].cat);
        return;
      default:
        break;
    }

    // Type-ahead across visible categories
    const isChar = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (isChar) {
      const now = Date.now();
      const expired = now - typeAheadRef.current.ts > TYPE_AHEAD_RESET_MS;
      typeAheadRef.current.text = expired ? e.key : typeAheadRef.current.text + e.key;
      typeAheadRef.current.ts = now;

      const norm = (s: string) => String(s || "").toLowerCase();
      const q = norm(typeAheadRef.current.text);

      for (let step = 1; step <= n; step++) {
        const i = (current + step) % n;
        const hay = `${getCatLabel(visible[i].cat)} ${getCatKey(visible[i].cat)}`;
        if (norm(hay).includes(q)) {
          e.preventDefault();
          go(i);
          break;
        }
      }
    }
  };

  return (
    <div
      className={containerClassName}
      tabIndex={0}
      role="tree"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      {groups.map((g) => {
        const gk = getGroupKey(g);
        const open = expandedGroups.has(gk);
        const cats = getCategories(g) ?? [];
        const headerCls =
          groupHeaderClassName?.(g, open) ??
          "pm-group-header";

        return (
          <div key={gk} className="mb-2">
            <div className={headerCls}>
              <button
                type="button"
                className="inline-flex items-center justify-center w-5 h-5 rounded border border-gray-200 bg-white hover:bg-gray-50 ml-0.5 shrink-0"
                onClick={() => onToggleGroup(gk, !open)}
                aria-label={open ? "Collapse" : "Expand"}
                title={open ? "Collapse" : "Expand"}
                data-tree-group="header"
                data-group-key={gk}
              >
                <span className="text-sm">{open ? "▾" : "▸"}</span>
              </button>
              <span className="pm-group-label">{getGroupLabel(g)}</span>
              <span className="pm-group-code">({gk})</span>
            </div>

            {open &&
              cats.map((c) => {
                const ck = getCatKey(c);
                const selected = selectedCategoryKey === ck;
                const idx = visible.findIndex((v) => getCatKey(v.cat) === ck);
                const focused = idx >= 0 && idx === focusedIdx;
                const cls =
                  categoryClassName?.(c, { selected, focused }) ??
                  `${selected ? "pm-list-item-small pm-list-item--active" : "pm-list-item-small"} pm-cat-indent block`;

                return (
                  <button
                    key={ck}
                    id={`${catIdPrefix}-${encodeURIComponent(ck)}`}
                    type="button"
                    tabIndex={-1}
                    onFocus={() => {
                      if (idx >= 0) setFocusedIdx(idx);
                    }}
                    onClick={() => onSelectCategory(c)}
                    className={cls}
                    role="treeitem"
                    aria-selected={selected}
                    title={getCatLabel(c)}
                  >
                    <div className="truncate">
                      {getCatLabel(c)}
                      <span className="ml-2 text-[11px] text-neutral-500">({ck})</span>
                    </div>
                  </button>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}