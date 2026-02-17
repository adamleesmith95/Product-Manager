
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * @typedef {Object} ProductHeaderSearchProps
 * @property {(filters: any) => void} onSearch
 * @property {() => void} onClear
 * @property {() => void} onExport
 * @property {boolean=} busy   // OPTIONAL: disable Search while loading
 */

/**
 * @param {ProductHeaderSearchProps} props
 */
export default function ProductHeaderSearch({ onSearch, onClear, onExport, busy = false }) {
  const [expanded, setExpanded] = useState(false); // collapsed by default
  const [filters, setFilters] = useState({
    code: "",
    description: "",
    lob: "",
    displayGroup: "",
    displayCategory: "",
    active: "",
    advancedQuery: "",
  });

  // NEW: ref so we can blur the button and avoid “enabled” look when disabled
  const searchBtnRef = useRef(null);

  // Lookups
  const [lobs, setLobs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [cats, setCats] = useState([]);

  // Load lookups once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [lobRes, grpRes, catRes] = await Promise.all([
          fetch("/api/lookups/lobs"),
          fetch("/api/lookups/display-groups"),
          fetch("/api/lookups/display-categories"),
        ]);
        const [lobJson, grpJson, catJson] = await Promise.all([
          lobRes.json(),
          grpRes.json(),
          catRes.json(),
        ]);
        if (!alive) return;
        setLobs(lobJson.rows ?? []);
        setGroups(grpJson.rows ?? []);
        setCats(catJson.rows ?? []);
      } catch (e) {
        console.error("Failed to load lookups", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // One-way cascading: Display Group -> Display Category
  const catsForGroup = useMemo(() => {
    if (!filters.displayGroup) return cats;
    return (cats ?? []).filter((c) => String(c.groupCode) === String(filters.displayGroup));
  }, [filters.displayGroup, cats]);

  // If group changes and the current category isn't in that group, clear it
  useEffect(() => {
    if (!filters.displayGroup || !filters.displayCategory) return;
    const stillValid = (catsForGroup ?? []).some(
      (c) => String(c.code) === String(filters.displayCategory)
    );
    if (!stillValid) {
      setFilters((f) => ({ ...f, displayCategory: "" }));
    }
  }, [filters.displayGroup, filters.displayCategory, catsForGroup]);

  // Utility: is the main (basic) search empty?
  const isBasicEmpty = () => !filters.code.trim() && !filters.description.trim();

  // Utility: is *any* search criteria present for Advanced?
  const isAdvancedCriteriaEmpty = () => {
    const { code, description, lob, displayGroup, displayCategory, active, advancedQuery } = filters;
    return (
      !String(code || "").trim() &&
      !String(description || "").trim() &&
      !String(lob || "").trim() &&
      !String(displayGroup || "").trim() &&
      !String(displayCategory || "").trim() &&
      !String(active || "").trim() &&
      !String(advancedQuery || "").trim()
    );
  };

  // NEW: single source of truth for the Search button disabled state
  const isSearchDisabled = busy || isBasicEmpty();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // MAIN "Search" button — only runs when PHC or Description is present (independent of Advanced)
  const handleSearch = () => {
    if (isBasicEmpty()) {
      // Optional: toast or UI hint here
      return;
    }
    onSearch(filters);
  };

  // "Apply Advanced" — show confirm when criteria are empty
  const handleApplyAdvanced = () => {
    if (isAdvancedCriteriaEmpty()) {
      const proceed = window.confirm(
        "Search Criteria  - There is no search criteria selected, this could take a long time to complete the search. Are you sure you want to continue?"
      );
      if (!proceed) return;
    }
    onSearch(filters);
  };

  // Clear — reset filters (DO NOT collapse Advanced)
  const handleClearAll = () => {
    setFilters({
      code: "",
      description: "",
      lob: "",
      displayGroup: "",
      displayCategory: "",
      active: "",
      advancedQuery: "",
    });

    // Keep Advanced open (do not setExpanded(false))
    // Blur search button so focus styles don’t make it look enabled
    requestAnimationFrame(() => {
      searchBtnRef.current?.blur();
    });

    onClear && onClear();
  };

  // Advanced caret toggle — ensure we blur if search is disabled so it doesn't look active
  const toggleAdvanced = () => {
    setExpanded((prev) => {
      const next = !prev;
      requestAnimationFrame(() => {
        if (isSearchDisabled) searchBtnRef.current?.blur();
      });
      return next;
    });
  };

  // Keyboard for simple inputs (PHC / Description)
  const onKeyDownBasic = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isBasicEmpty()) return; // guard still applies
      handleSearch();
    } else if (e.key === "Escape") {
      setFilters((prev) => ({ ...prev, code: "", description: "" }));
    }
  };

  const descDebounceMs = 0; // set to 250 if you want auto-search on description while collapsed
  const descTimer = useRef(null);

  // Optional auto-search on description (when collapsed)
  useEffect(() => {
    if (!expanded && !filters.code.trim() && descDebounceMs > 0) {
      if (descTimer.current) window.clearTimeout(descTimer.current);
      descTimer.current = window.setTimeout(() => handleSearch(), descDebounceMs);
    }
    return () => {
      if (descTimer.current) window.clearTimeout(descTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.description, expanded, filters.code]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
        <h2 className="text-white text-lg font-semibold">Product Header Search</h2>
      </div>

      {/* Collapsed: PHC + Description + Search split button */}
      <div className="pm-section">
        {/* 12-col grid */}
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* PHC (3/12) */}
          <input
            type="text"
            name="code"
            placeholder="PHC"
            value={filters.code}
            onChange={handleChange}
            onKeyDown={onKeyDownBasic}
            className="col-span-3 w-full h-10 px-3 py-2 pmsearch"
          />

          {/* Description (8/12) */}
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={filters.description}
            onChange={handleChange}
            onKeyDown={onKeyDownBasic}
            className="col-span-8 w-full h-10 px-3 py-2 pmsearch"
          />

          {/* Search + Caret (1/12) */}
          
<div className="col-span-1 flex justify-end items-center">

  {/* SEARCH button */}
  <button
    ref={searchBtnRef}
    onClick={handleSearch}
    disabled={isSearchDisabled}
    aria-disabled={isSearchDisabled}
    tabIndex={isSearchDisabled ? -1 : 0}
    className={
      `btn btn-light rounded-r-none ` +
      (isSearchDisabled ? "opacity-60 cursor-not-allowed" : "")
    }
    title={isBasicEmpty() ? "Enter PHC or Description" : "Search"}
  >
    Search
  </button>

  {/* CARET button */}
  <button
    onClick={toggleAdvanced}
    aria-expanded={expanded}
    aria-controls="advanced-panel"
    className="btn btn-light rounded-l-none px-3 flex items-center justify-center"
    title={expanded ? "Hide advanced filters" : "Show advanced filters"}
  >
    <svg
      className={`w-3 h-4 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
    </svg>
  </button>

</div>

        </div>

        {/* Advanced panel */}
        {expanded && (
          <div id="advanced-panel" className="mt-4">
            {/* Advanced row: LOB / Display Group / Display Category / Active */}
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* LOB (3/12) — independent */}
              <select
                name="lob"
                value={filters.lob}
                onChange={handleChange}
                className="col-span-3 w-full h-10 px-3 py-2 pmsearch"
                aria-label="Line of Business"
              >
                <option value="">LOB</option>
                {lobs.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>

              {/* Display Group (4/12) */}
              <select
                name="displayGroup"
                value={filters.displayGroup}
                onChange={handleChange}
                className="col-span-4 w-full h-10 px-3 py-2 pmsearch"
                aria-label="Display Group"
              >
                <option value="">Display Group</option>
                {groups.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.label}
                  </option>
                ))}
              </select>

              {/* Display Category (4/12) — cascades from Display Group */}
              <select
                name="displayCategory"
                value={filters.displayCategory}
                onChange={handleChange}
                className="col-span-4 w-full h-10 px-3 py-2 pmsearch"
                aria-label="Display Category"
                title={filters.displayGroup ? "Filtered by Display Group" : "All categories"}
              >
                <option value="">Display Category</option>
                {(filters.displayGroup ? catsForGroup : cats).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Active (1/12) */}
              <div className="col-span-1">
                <select
                  name="active"
                  value={filters.active}
                  onChange={handleChange}
                  className="w-full h-10 px-3 py-2 pmsearch"
                  aria-label="Active"
                  title="Active"
                >
                  <option value="">Active</option>
                  <option value="Y">Y</option>
                  <option value="N">N</option>
                </select>
              </div>
            </div>

            {/* Advanced Query full-width row */}
            <div className="mt-4">
              <textarea
                name="advancedQuery"
                placeholder="Advanced Query"
                value={filters.advancedQuery}
                onChange={handleChange}
                className="w-full h-10 px-3 py-2 font-mono text-sm pmsearch"
                aria-label="Advanced Query"
              />
            </div>

            {/* Buttons row (advanced actions) */}
            <div className="flex gap-2 ml-auto justify-between">
              <div>
                {/* confirm if empty */}
                <button
                  onClick={handleApplyAdvanced}
                  disabled={busy}
                  className="btn btn-light mr-2"
                >
                  Apply Advanced
                </button>

                {/* Clear keeps Advanced open and re-disables Search */}
                <button
                  onClick={handleClearAll}
                  className="btn btn-light"
                >
                  Clear
                </button>
              </div>

              <div>
                <div className="flex gap-2 ml-auto">
                  <button className="btn btn-light">Upload</button>
                  <button className="btn btn-light">Export</button>
                  <button className="btn btn-light">Unlock</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
