// src/components/shared/RovingList.tsx
import * as React from "react";

type RovingListProps<T> = {
  items: T[];
  /** Unique key for each item (e.g., code) */
  getKey: (item: T) => string;
  /** Text used for type-ahead matching (e.g., `${label} ${code}`) */
  getSearchText: (item: T) => string;
  /** Render the visual content of an item */
  renderItem?: (item: T, state: { selected: boolean; focused: boolean }) => React.ReactNode;
  /** Class for each item button; often toggles an "active" style */
  itemClassName?: (item: T, state: { selected: boolean; focused: boolean }) => string;
  /** Called when user selects an item (Enter/Space/Click) */
  onSelect: (item: T) => void;
  /** Currently selected key (controls highlight state) */
  selectedKey?: string;
  /** Optional: focus this key when it changes (anchors + centers) */
  focusKey?: string;
  /** Label for a11y */
  ariaLabel?: string;
  /** ID prefix for DOM ids (e.g., "cat" -> id="cat-<key>") */
  idPrefix?: string;
  /** Optional additional classes */
  className?: string;
  /** Scroll centering behavior */
  scrollBlock?: ScrollLogicalPosition; // "center" (default), "nearest", etc.
  /** How many items to move on PageUp/PageDown */
  pageJump?: number;
};

const TYPE_AHEAD_RESET_MS = 600;

export function RovingList<T>({
  items,
  getKey,
  getSearchText,
  renderItem,
  itemClassName,
  onSelect,
  selectedKey,
  focusKey,
  ariaLabel = "List",
  idPrefix = "item",
  className,
  scrollBlock = "center",
  pageJump = 10,
}: RovingListProps<T>) {
  const [focusedIdx, setFocusedIdx] = React.useState<number>(() => {
    if (!items.length) return -1;
    if (selectedKey != null) {
      const i = items.findIndex((it) => getKey(it) === selectedKey);
      if (i >= 0) return i;
    }
    return 0;
  });

  const typeAheadRef = React.useRef<{ text: string; ts: number }>({ text: "", ts: 0 });

  const scrollItemIntoView = (idx: number) => {
    if (idx < 0 || idx >= items.length) return;
    const key = getKey(items[idx]);
    const el = document.getElementById(`${idPrefix}-${encodeURIComponent(key)}`);
    el?.scrollIntoView({ block: scrollBlock, behavior: "smooth" });
  };

  const focusItem = (idx: number) => {
    if (idx < 0 || idx >= items.length) return;
    setFocusedIdx(idx);
    const key = getKey(items[idx]);
    const el = document.getElementById(`${idPrefix}-${encodeURIComponent(key)}`) as HTMLButtonElement | null;
    if (el) {
      el.focus();
      scrollItemIntoView(idx);
    }
  };

  // Keep focused item aligned with selectedKey when it changes (e.g., anchors)
  React.useEffect(() => {
    if (!items.length || selectedKey == null) return;
    const i = items.findIndex((it) => getKey(it) === selectedKey);
    if (i >= 0) {
      setFocusedIdx(i);
      // Keep it visible without stealing focus from keyboard Tab users
      requestAnimationFrame(() => scrollItemIntoView(i));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, items.length]);

  // Optionally focus a specific key imperatively (e.g., when a search targets a category)
  React.useEffect(() => {
    if (!items.length || focusKey == null) return;
    const i = items.findIndex((it) => getKey(it) === focusKey);
    if (i >= 0) requestAnimationFrame(() => focusItem(i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, items.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!items.length) return;
    const current = Math.max(0, Math.min(items.length - 1, focusedIdx === -1 ? 0 : focusedIdx));

    const go = (idx: number) => {
      const bounded = Math.max(0, Math.min(items.length - 1, idx));
      focusItem(bounded);
    };

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
        go(items.length - 1);
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
        onSelect(items[current]);
        // keep focus/scroll where it is
        return;
      default:
        break;
    }

    // Type-ahead
    const isChar = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (isChar) {
      const now = Date.now();
      const expired = now - typeAheadRef.current.ts > TYPE_AHEAD_RESET_MS;
      typeAheadRef.current.text = expired ? e.key : typeAheadRef.current.text + e.key;
      typeAheadRef.current.ts = now;

      const norm = (s: string) => s.toLowerCase();
      const q = norm(typeAheadRef.current.text);
      const n = items.length;

      for (let step = 1; step <= n; step++) {
        const i = (current + step) % n;
        const hay = `${getSearchText(items[i])}`;
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
      className={className}
      tabIndex={0}
      role="listbox"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      {items.map((item, i) => {
        const key = getKey(item);
        const selected = selectedKey === key;
        const focused = i === focusedIdx;
        const cls =
          itemClassName?.(item, { selected, focused }) ??
          `w-full text-left px-3 py-1 text-sm hover:bg-neutral-50 ${selected ? "pm-list-item--active" : ""}`;

        return (
          <button
            key={key}
            id={`${idPrefix}-${encodeURIComponent(key)}`}
            type="button"
            tabIndex={-1}
            onFocus={() => setFocusedIdx(i)}
            onClick={() => onSelect(item)}
            role="option"
            aria-selected={selected}
            className={cls}
            title={typeof getSearchText === "function" ? getSearchText(item) : undefined}
          >
            {renderItem ? renderItem(item, { selected, focused }) : getSearchText(item)}
          </button>
        );
      })}
    </div>
  );
}