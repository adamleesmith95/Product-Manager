import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductHeaderSearch from "./ProductHeaderSearch";
import { useTableColumnSizing } from "../hooks/useTableColumnSizing"; // <- added

type Category = {
  code: string;
  label: string;
  groupCode?: string;
  groupLabel?: string;
  displayOrder?: number;
};

type ProductRow = {
  code: string;
  description: string;
  active: string;
  display: string;
  displayOrder: number | string;
  displayCategory: string;
  displayCategoryCode: string;
};

type SearchFilters = {
  code: string;
  description: string;
  lob: string;
  displayGroup: string;
  displayCategory: string;
  active: string;
  advancedQuery: string;
};

type Props = {
  onOpenProduct: (row: ProductRow) => void;
  initialCategoryCode?: string;
};

export default function DisplayCategoryBrowser({ onOpenProduct, initialCategoryCode }: Props) {
  const [pendingAnchorCode, setPendingAnchorCode] = useState<string | null>(null);
  const [catReloadNonce, setCatReloadNonce] = useState(0);

  const [cats, setCats] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>(initialCategoryCode ?? "");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [originalRows, setOriginalRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTitle, setSearchTitle] = useState<string>("");
  const isResultsMode = !!searchTitle?.trim();

  const [inlineCode, setInlineCode] = useState<string>("");
  const [inlineDesc, setInlineDesc] = useState<string>("");

  const [selectedPhcCode, setSelectedPhcCode] = useState<string | null>(null);

  const [lastCatCode, setLastCatCode] = useState<string>("");
  const [lastCatName, setLastCatName] = useState<string>("");

  const scrollRowIntoView = (code: string) => {
    const el = document.getElementById(`phc-row-${code}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  // ---------- Restore sticky last category ----------
  useEffect(() => {
    if (!lastCatCode || !lastCatName) {
      const code = localStorage.getItem("lastCatCode") ?? "";
      const name = localStorage.getItem("lastCatName") ?? "";
      if (code && name) {
        setLastCatCode(code);
        setLastCatName(name);
        if (!selectedCat) setSelectedCat(code);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Load categories once ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/lookups/display-categories");
        const data = await res.json();
        const list: Category[] = (data.rows ?? []).map((r: any) => ({
          code: String(r.code),
          label: String(r.label),
          groupCode: r.groupCode ? String(r.groupCode) : undefined,
          groupLabel: r.groupLabel ? String(r.groupLabel) : undefined,
          displayOrder:
            typeof r.displayOrder === "number" ? r.displayOrder : Number(r.displayOrder ?? 0),
        }));
        setCats(list);
        if (!initialCategoryCode && list.length && !selectedCat) {
          setSelectedCat(list[0].code);
          setLastCatCode(list[0].code);
          setLastCatName(list[0].label);
          localStorage.setItem("lastCatCode", list[0].code);
          localStorage.setItem("lastCatName", list[0].label);
        }
      } catch (e) {
        console.error("Failed to load display categories", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Select a category ----------
  const handleSelectCategory = (code: string) => {
    setSearchTitle("");
    setInlineCode("");
    setInlineDesc("");

    if (code === selectedCat) {
      setCatReloadNonce((n) => n + 1);
    } else {
      setSelectedCat(code);
    }

    const cat = cats.find((c) => c.code === code);
    if (cat) {
      setLastCatCode(cat.code);
      setLastCatName(cat.label);
      localStorage.setItem("lastCatCode", cat.code);
      localStorage.setItem("lastCatName", cat.label);
    }
  };

  // ---------- Load products for selected category ----------
  useEffect(() => {
    if (!selectedCat) return;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("categoryCode", selectedCat);
        params.set("page", "1");
        params.set("pageSize", "100");
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        const recs: ProductRow[] = (data.rows ?? []).map((r: any) => r);
        setRows(recs);
        setOriginalRows(recs);
        setSearchTitle("");
        if (!pendingAnchorCode) setSelectedPhcCode(null);
        setInlineCode("");
        setInlineDesc("");

        const cat = cats.find((c) => c.code === selectedCat);
        if (cat) {
          setLastCatCode(cat.code);
          setLastCatName(cat.label);
          localStorage.setItem("lastCatCode", cat.code);
          localStorage.setItem("lastCatName", cat.label);
        }

        if (pendingAnchorCode) {
          setSelectedPhcCode(pendingAnchorCode);
          requestAnimationFrame(() => scrollRowIntoView(pendingAnchorCode));
          setPendingAnchorCode(null);
        }
      } catch (e) {
        console.error("Failed to load PHCs", e);
        setRows([]);
        setOriginalRows([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCat, catReloadNonce]);

  // ---------- Inline filters ----------
  useEffect(() => {
    const codeTerm = inlineCode.trim().toLowerCase();
    const descTerm = inlineDesc.trim().toLowerCase();
    let filtered = originalRows;
    if (codeTerm) {
      filtered = filtered.filter((row) => String(row.code ?? "").toLowerCase().includes(codeTerm));
    }
    if (descTerm) {
      filtered = filtered.filter((row) =>
        String(row.description ?? "").toLowerCase().includes(descTerm)
      );
    }
    setRows(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineCode, inlineDesc]);

  // ---------- Global search ----------
  const handleSearch = async (filters: SearchFilters) => {
    try {
      setLoading(true);
      if (filters.code && !filters.advancedQuery) {
        const url = new URL("/api/products", window.location.origin);
        url.searchParams.set("code", filters.code);
        url.searchParams.set("expandCategory", "true");
        if (filters.active) url.searchParams.set("active", filters.active);
        const res = await fetch(url.toString());
        if (!res.ok) {
          console.error("[Anchor] Failed", res.status, await res.text());
          setRows([]);
          setOriginalRows([]);
          setSelectedPhcCode(null);
          setSearchTitle(`No results for code ${filters.code}`);
          return;
        }
        const data = await res.json();
        const recs: ProductRow[] = (data.rows ?? []).map((r: any) => r);
        setRows(recs);
        setOriginalRows(recs);

        if (data.anchorCategory) {
          const catCodeStr = String(data.anchorCategory);
          setSelectedCat(catCodeStr);
          const name = data.anchorCategoryName
            ? String(data.anchorCategoryName)
            : cats.find((c) => c.code === catCodeStr)?.label ?? "";
          if (name) {
            setLastCatCode(catCodeStr);
            setLastCatName(name);
            localStorage.setItem("lastCatCode", catCodeStr);
            localStorage.setItem("lastCatName", name);
          }
          setTimeout(() => scrollCategoryIntoView(catCodeStr), 0);
        }
        if (data.anchorCode) {
          setPendingAnchorCode(String(data.anchorCode));
        } else {
          setPendingAnchorCode(null);
          setSelectedPhcCode(null);
        }
        setInlineCode("");
        setInlineDesc("");
        setSearchTitle("");
        return;
      }

      // Generic path
      const params = new URLSearchParams();
      if (filters.advancedQuery) {
        params.set("sql", filters.advancedQuery);
      } else {
        if (filters.code) params.set("code", filters.code);
        if (filters.description) params.set("description", filters.description);
        if (filters.lob) params.set("lob", filters.lob);
        if (filters.displayGroup) params.set("displayGroup", filters.displayGroup);
        if (filters.displayCategory) params.set("displayCategory", filters.displayCategory);
        if (filters.active) params.set("active", filters.active);
      }
      params.set("page", "1");
      params.set("pageSize", "3000");

      const url = `/api/products?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      let recs: ProductRow[] = (data.rows ?? []).map((r: any) => r);
      if (filters.description) {
        const desc = filters.description.toLowerCase().trim();
        recs = recs.filter((row) => row.description?.toLowerCase().includes(desc));
      }
      setRows(recs);
      setOriginalRows(recs);
      setSelectedPhcCode(null);
      setSearchTitle(`Results (${recs.length})`);
      setInlineCode("");
      setInlineDesc("");
    } catch (e) {
      console.error("Search failed", e);
      setRows([]);
      setOriginalRows([]);
      setSelectedPhcCode(null);
      setSearchTitle(`Results (0)`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Clear ----------
  const handleClear = async () => {
    setSearchTitle("");
    setSelectedPhcCode(null);
    setInlineCode("");
    setInlineDesc("");
    const targetCat = initialCategoryCode ?? (cats.length > 0 ? cats[0].code : "");
    setSelectedCat(targetCat);
    const cat = cats.find((c) => c.code === targetCat);
    if (cat) {
      setLastCatCode(cat.code);
      setLastCatName(cat.label);
      localStorage.setItem("lastCatCode", cat.code);
      localStorage.setItem("lastCatName", cat.label);
    }
    if (targetCat) {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("categoryCode", targetCat);
        params.set("page", "1");
        params.set("pageSize", "100");
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        const recs: ProductRow[] = (data.rows ?? []).map((r: any) => r);
        setRows(recs);
        setOriginalRows(recs);
      } catch (e) {
        console.error("Failed to reload PHCs", e);
        setRows([]);
        setOriginalRows([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  // ---------- Events ----------
  useEffect(() => {
    const handler = () => {
      if (lastCatCode) {
        setSelectedCat(lastCatCode);
      } else {
        const code = localStorage.getItem("lastCatCode") ?? "";
        if (code) setSelectedCat(code);
      }
      setSearchTitle("");
      setSelectedPhcCode(null);
      setInlineCode("");
      setInlineDesc("");
    };
    window.addEventListener("go-back-to-categories", handler);
    return () => window.removeEventListener("go-back-to-categories", handler);
  }, [lastCatCode, lastCatName]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { categoryCode, categoryName, phcCode } = (e.detail ?? {}) as {
        categoryCode?: string;
        categoryName?: string;
        phcCode?: string;
      };
      if (!categoryCode) return;
      setSelectedCat(categoryCode);
      if (categoryName) {
        setLastCatCode(categoryCode);
        setLastCatName(categoryName);
        localStorage.setItem("lastCatCode", categoryCode);
        localStorage.setItem("lastCatName", categoryName);
      }
      setInlineCode("");
      setInlineDesc("");
      setSearchTitle("");
      if (phcCode) {
        const codeToSelect = String(phcCode);
        setTimeout(() => {
          setSelectedPhcCode(codeToSelect);
          requestAnimationFrame(() => scrollRowIntoView(codeToSelect));
        }, 0);
      } else {
        setSelectedPhcCode(null);
      }
    };
    window.addEventListener("go-back-to-categories-specific", handler as EventListener);
    return () =>
      window.removeEventListener("go-back-to-categories-specific", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { categoryCode, categoryName, phcCode } = (e as CustomEvent).detail ?? {};
      if (!categoryCode) return;
      setSelectedCat(categoryCode);
      if (categoryName) {
        setLastCatCode(categoryCode);
        setLastCatName(categoryName);
        localStorage.setItem("lastCatCode", categoryCode);
        localStorage.setItem("lastCatName", categoryName);
      }
      setInlineCode("");
      setInlineDesc("");
      setSearchTitle("");
      if (phcCode) {
        setPendingAnchorCode(String(phcCode));
      } else {
        setSelectedPhcCode(null);
      }
    };
    window.addEventListener("go-back-to-categories-specific", handler as EventListener);
    return () =>
      window.removeEventListener("go-back-to-categories-specific", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowsRef = useRef<ProductRow[]>(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    const handler = (e: Event) => {
      const code = String((e as CustomEvent).detail?.code ?? "");
      if (!code) return;
      const exists = rowsRef.current.some((r) => String(r.code) === code);
      if (!exists) return;
      setSelectedPhcCode(code);
      requestAnimationFrame(() => scrollRowIntoView(code));
    };
    window.addEventListener("reselect-phc", handler as EventListener);
    return () => window.removeEventListener("reselect-phc", handler as EventListener);
  }, []);

  // ---------- Header title ----------
  const headerTitle = isResultsMode
    ? searchTitle
    : (cats.find((c) => c.code === selectedCat)?.label && selectedCat)
    ? `${cats.find((c) => c.code === selectedCat)!.label} (${selectedCat})`
    : lastCatName && lastCatCode
    ? `${lastCatName} (${lastCatCode})`
    : "Products";

  // ---------- Column sizing hook (PHC) ----------
  const phcTableRef = useRef<HTMLTableElement | null>(null);
  const { ColGroup, startResize, autoFitColumn } = useTableColumnSizing(phcTableRef, {
    storageKey: "phc-table",
    sampleRows: 300,
    minPx: 80,
    maxPx: 520,
    autoSizeDeps: [rows.length],
    columnCaps: {
    0: { min: 80, max: 140 },  // PHC Code column
  },

  });

  const scrollCategoryIntoView = (categoryCode: string) => {
  const el = document.getElementById(`cat-${categoryCode}`);
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
};


  return (
    <div className="flex flex-col gap-4">
      <ProductHeaderSearch
        onSearch={handleSearch}
        onClear={handleClear}
        onExport={() => console.log("Exporting selected products to Excel")}
      />
      <div className="pm-divider my-2 pm-divider-bleed" />

      <div className="grid grid-cols-12 gap-4">
        {/* Left Pane */}
        <aside className="pm-sidebar col-span-3">
          <div className="pm-sidebar-title">Display Categories</div>
          <div className="pm-sidebar-scroll">
            {cats.map((c) => (
              <button
                key={c.code}
                id={`cat-${c.code}`}            // <-- ADD THIS: makes the item scroll-targetable
                onClick={() => handleSelectCategory(c.code)}
                className={`pm-list-item ${selectedCat === c.code ? "pm-list-item--active" : ""}`}
                title={`Open ${c.label} (${c.code})`}
              >
                <div className="truncate">
                  {c.label}
                  <span className="ml-2 text-[11px] text-neutral-500">({c.code})</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Right Pane */}
        <section className="col-span-9 pm-pane pm-pane-right pm-pane-flex pm-pane--vh">
          <div className="pm-pane-header">
            <div className="pm-pane-title">{headerTitle}</div>
            <div className="flex items-center gap-2 grow justify-end">
              <input
                type="text"
                placeholder="Search Code"
                value={inlineCode}
                onChange={(e) => setInlineCode(e.target.value)}
                className="border rounded px-2 py-1 text-xs w-32"
                aria-label="Search Code"
              />
              <input
                type="text"
                placeholder="Search Description"
                value={inlineDesc}
                onChange={(e) => setInlineDesc(e.target.value)}
                className="border rounded px-2 py-1 text-xs w-48"
                aria-label="Search Description"
              />
            </div>
          </div>

          <div className="pm-content">
            <table className="pm-table" ref={phcTableRef}>
              {ColGroup}
              <thead className="pm-thead pm-thead-sticky">
                <tr>
                  <th className="pm-th relative">
                    Code
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 0)}
                      onDoubleClick={() => autoFitColumn(0)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Description
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 1)}
                      onDoubleClick={() => autoFitColumn(1)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Active
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 2)}
                      onDoubleClick={() => autoFitColumn(2)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Display
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 3)}
                      onDoubleClick={() => autoFitColumn(3)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Display Category Code
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 4)}
                      onDoubleClick={() => autoFitColumn(4)}
                    />
                  </th>
                  <th className="pm-th relative">
                    Display Category Description
                    <span
                      className="pm-col-resizer"
                      onMouseDown={(e) => startResize(e, 5)}
                      onDoubleClick={() => autoFitColumn(5)}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.code}
                    id={`phc-row-${row.code}`}
                    className={`cursor-pointer select-none pm-row ${
                      row.code === selectedPhcCode ? "pm-row--selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedPhcCode(row.code);
                    }}
                    onDoubleClick={() => {
                      setSelectedPhcCode(null);
                      onOpenProduct(row);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSelectedPhcCode(null);
                        onOpenProduct(row);
                      }
                    }}
                    title={`Open ${row.code}`}
                  >
                    <td className="pm-td font-mono">{row.code}</td>
                    <td className="pm-td">{row.description}</td>
                    <td className="pm-td">{row.active}</td>
                    <td className="pm-td">{row.display}</td>
                    <td className="pm-td">{row.displayCategoryCode}</td>
                    <td className="pm-td">{row.displayCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pm-pane-footer">
            <button className="btn btn-light">New</button>
            <button className="btn btn-light">Clone</button>
          </div>
        </section>
      </div>
    </div>
  );
}