import React, { useEffect, useRef, useState } from "react";
import BrowserLayout from './shared/BrowserLayout';
import ProductHeaderSearch from './ProductHeaderSearch';
import DataTable from './shared/DataTable';
import { ColumnDefinition } from './shared/DataTable';
import { resetTableColumns } from "../utils/tableStorage";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useBrowserData } from "../hooks/useBrowserData";
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';

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
  maxQuantity?: number | string;
  securityLevel?: number | string;
  priceChangeLevel?: number | string;
  commission?: string;
  identifyCustomer?: string;
  primaryLob?: string;
  receiptLabel?: string;
  loyaltyProduct?: string;
  auditCategory?: string;
  redemptionProduct?: string;
  comment?: string;
  shippingCategoryCode?: string;
  shippingCategory?: string;
  specialText?: string;
  operatorId?: string;
  updateDate?: string;
  customerAgeMin?: number | string;
  customerAgeMax?: number | string;
  minAdvanceDays?: number | string;
  maxAdvanceDays?: number | string;
  salesReportCategoryCode?: string;
  salesReportCategory?: string;
  internetAuthorizationCode?: string;
  internetAuthorization?: string;
  priceByLocation?: string;
  priceBySeason?: string;
  paymentProfileRequired?: string;
  salesReportGroupCode?: string;
  salesReportGroup?: string;
  depositRequired?: string;
  allowDelivery?: string;
  pickupLocationTypeCode?: string;
  pickupLocationType?: string;
  units?: number | string;
  unitOfMeasureCode?: string;
  relationId?: string;
  autoRenew?: string;
  displayTitle?: string;
  internalComment?: string;
  hideReceiptPrice?: string;
  currencyCode?: string;
  priceByPricingRule?: string;
  priceBySalesChannel?: string;
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

interface DisplayCategoryBrowserProps {
  initialCategoryCode?: string;
  onOpenProduct: (product: ProductRow) => void;
  onModifyCategory?: (row: any) => void;
  onGoToDisplayCategory?: (row: any) => void;
  onPhcRowClick?: (row: ProductRow) => void;  // NEW
  categoryAnchor?: { code: string; ts: number } | null;
}

const PRODUCT_COLUMNS: ColumnDefinition<ProductRow>[] = [
  { key: 'code', label: 'Code', className: 'font-mono', sortable: true, sortType: 'string' },
  { key: 'description', label: 'Description', sortable: true, sortType: 'string' },
  { key: 'active', label: 'Active', sortable: true, sortType: 'string' },
  { key: 'display', label: 'Display', sortable: true, sortType: 'string' },
  { key: 'displayOrder', label: 'Display Order', sortable: true, sortType: 'string' },
  { key: 'displayCategoryCode', label: 'Display Category Code', sortable: true, sortType: 'string' },
  { key: 'displayCategory', label: 'Display Category Description', sortable: true, sortType: 'string' },
  { key: 'maxQuantity', label: 'Max Qty', sortable: true, sortType: 'number' },
  { key: 'securityLevel', label: 'Security Level', sortable: true, sortType: 'number' },
  { key: 'priceChangeLevel', label: 'Price Change', sortable: true, sortType: 'number' },
  { key: 'commission', label: 'Commission', sortable: true, sortType: 'string' },
  { key: 'identifyCustomer', label: 'ID Customer', sortable: true, sortType: 'string' },
  { key: 'primaryLob', label: 'Primary LOB', sortable: true, sortType: 'string' },
  { key: 'receiptLabel', label: 'Receipt Label', width: 160, sortable: true, sortType: 'string' },
  { key: 'loyaltyProduct', label: 'Loyalty Product', sortable: true, sortType: 'string' },
  { key: 'auditCategory', label: 'Audit Category', sortable: true, sortType: 'string' },
  { key: 'redemptionProduct', label: 'Redemption Product', sortable: true, sortType: 'string' },
  { key: 'comment', label: 'Comment', width: 160, sortable: true, sortType: 'string' },
  { key: 'shippingCategoryCode', label: 'Shipping Category Code', sortable: true, sortType: 'string' },
  { key: 'shippingCategory', label: 'Shipping Category', sortable: true, sortType: 'string' },
  { key: 'specialText', label: 'Special Text', sortable: true, sortType: 'string' },
  { key: 'operatorId', label: 'Operator ID', sortable: true, sortType: 'string' },
  { key: 'updateDate', label: 'Updated', sortable: true, sortType: 'date' },
  { key: 'customerAgeMin', label: 'Customer Age (Min)', sortable: true, sortType: 'number' },
  { key: 'customerAgeMax', label: 'Customer Age (Max)', sortable: true, sortType: 'number' },
  { key: 'minAdvanceDays', label: 'Min Advance Days', sortable: true, sortType: 'number' },
  { key: 'maxAdvanceDays', label: 'Max Advance Days', sortable: true, sortType: 'number' },
  { key: 'salesReportCategoryCode', label: 'SalesReportCategoryCode', sortable: true, sortType: 'string' },
  { key: 'salesReportCategory', label: 'Sales Report Category', sortable: true, sortType: 'string' },
  { key: 'internetAuthorizationCode', label: 'InternetAuthorizationCode', sortable: true, sortType: 'string' },
  { key: 'internetAuthorization', label: 'Internet Authorization', sortable: true, sortType: 'string' },
  { key: 'priceByLocation', label: 'Price By Location', sortable: true, sortType: 'string' },
  { key: 'priceBySeason', label: 'Price By Season', sortable: true, sortType: 'string' },
  { key: 'paymentProfileRequired', label: 'Payment Profile Required', sortable: true, sortType: 'string' },
  { key: 'salesReportGroupCode', label: 'Sales Report Group Code', sortable: true, sortType: 'string' },
  { key: 'salesReportGroup', label: 'Sales Report Group', sortable: true, sortType: 'string' },
  { key: 'depositRequired', label: 'Deposit Required', sortable: true, sortType: 'string' },
  { key: 'allowDelivery', label: 'Allow Delivery', sortable: true, sortType: 'string' },
  { key: 'pickupLocationTypeCode', label: 'Pickup Location Type Code', sortable: true, sortType: 'string' },
  { key: 'pickupLocationType', label: 'Pickup Location Type', sortable: true, sortType: 'string' },
  { key: 'units', label: 'units', sortable: true, sortType: 'number' },
  { key: 'unitOfMeasureCode', label: 'unit_of_measure_code', sortable: true, sortType: 'string' },
  { key: 'relationId', label: 'relation_id', sortable: true, sortType: 'string' },
  { key: 'autoRenew', label: 'Auto Renew', sortable: true, sortType: 'string' },
  { key: 'displayTitle', label: 'Display Title', width: 160, sortable: true, sortType: 'string' },
  { key: 'internalComment', label: 'Internal Comment', width: 160, sortable: true, sortType: 'string' },
  { key: 'hideReceiptPrice', label: 'Hide Receipt Price', sortable: true, sortType: 'string' },
  { key: 'currencyCode', label: 'Currency Code', sortable: true, sortType: 'string' },
  { key: 'priceByPricingRule', label: 'Price By Pricing Rule', sortable: true, sortType: 'string' },
  { key: 'priceBySalesChannel', label: 'Price By Sales Channel', sortable: true, sortType: 'string' },
];

const onResetColumns = () => {
  resetTableColumns("display-category-browser");
  window.location.reload();
};

export default function DisplayCategoryBrowser({ 
  initialCategoryCode = '',
  onOpenProduct,
  onModifyCategory,
  onGoToDisplayCategory,
  onPhcRowClick,          // NEW
  categoryAnchor = null,
}: DisplayCategoryBrowserProps) {
  const [pendingAnchorCode, setPendingAnchorCode] = useState<string | null>(null);
  const [lastAppliedAnchorTs, setLastAppliedAnchorTs] = useState<number>(0);

  const [cats, setCats] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>(initialCategoryCode || '');
  const [catReloadNonce, setCatReloadNonce] = useState<number>(0);

  const [lastCatCode, setLastCatCode] = useState<string>("");
  const [lastCatName, setLastCatName] = useState<string>("");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [originalRows, setOriginalRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const rowsRef = useRef<ProductRow[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const [searchTitle, setSearchTitle] = useState<string>("");
  const isResultsMode = !!searchTitle?.trim();

  const [inlineCode, setInlineCode] = useState<string>("");
  const [inlineDesc, setInlineDesc] = useState<string>("");

  const debouncedInlineCode = useDebouncedValue(inlineCode, 180);
  const debouncedInlineDesc = useDebouncedValue(inlineDesc, 180);

  const [selectedPhcCode, setSelectedPhcCode] = useState<string | null>(null);

  const {
    data: catsData,
    loading: catsLoading,
    error: catsError,
  } = useBrowserData<Category[]>(
    [],
    async (signal) => {
      const res = await fetch("/api/lookups/display-categories", { signal });
      const data = await res.json();
      return (data.rows ?? []).map((r: any) => ({
        code: String(r.code),
        label: String(r.label),
        groupCode: r.groupCode ? String(r.groupCode) : undefined,
        groupLabel: r.groupLabel ? String(r.groupLabel) : undefined,
        displayOrder:
          typeof r.displayOrder === "number" ? r.displayOrder : Number(r.displayOrder ?? 0),
      }));
    }
  );

  const anchorLockRef = useRef(false);

  // Apply anchor ONLY after categories are loaded, and lock against auto-restore override
  useEffect(() => {
    if (!categoryAnchor?.code) return;
    if (!cats.length) return;

    const code = String(categoryAnchor.code);
    const match = cats.find((c) => String(c.code) === code);
    if (!match) return;

    anchorLockRef.current = true;
    handleSelectCategory(code);
    setTimeout(() => scrollCategoryIntoView(code), 80);

    // keep "last selected" in sync so later restore doesn't snap back
    setLastCatCode(code);
    setLastCatName(match.label ?? "");
    localStorage.setItem("lastCatCode", code);
    localStorage.setItem("lastCatName", match.label ?? "");
  }, [categoryAnchor, cats]);

  useEffect(() => {
    if (!catsData) return;
    setCats(catsData);

    // IMPORTANT: never auto-select/restore while anchor lock is active
    if (anchorLockRef.current) return;

    if (!initialCategoryCode && catsData.length && !selectedCat) {
      setSelectedCat(catsData[0].code);
      setLastCatCode(catsData[0].code);
      setLastCatName(catsData[0].label);
      localStorage.setItem("lastCatCode", catsData[0].code);
      localStorage.setItem("lastCatName", catsData[0].label);
    }
  }, [catsData, initialCategoryCode, selectedCat]);

  useEffect(() => {
    if (catsError) console.error("Failed to load display categories", catsError);
  }, [catsError]);

    const scrollRowIntoView = (code: string) => {
  const target = String(code);
  const selector =
  'tr[data-table-key="display-category-browser"][data-row-key="' + target + '"]';

  const attempt = (attemptsLeft: number) => {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (el) {
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return;
  }
  if (attemptsLeft > 0) {
  setTimeout(() => attempt(attemptsLeft - 1), 100);
  }
  };

  attempt(6);
  };



  const scrollCategoryIntoView = (categoryCode: string) => {
    const el = document.getElementById(`cat-${categoryCode}`);
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


                console.log('[DCB] applying pendingAnchorCode after rows load', {
          pendingAnchorCode,
          selectedCat,
          rowCount: recs.length,
        });

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
    const codeTerm = debouncedInlineCode.trim().toLowerCase();
    const descTerm = debouncedInlineDesc.trim().toLowerCase();
    let filtered = originalRows;

    if (codeTerm) {
      filtered = filtered.filter((row) =>
        String(row.code ?? "").toLowerCase().includes(codeTerm)
      );
    }
    if (descTerm) {
      filtered = filtered.filter((row) =>
        String(row.description ?? "").toLowerCase().includes(descTerm)
      );
    }

    setRows(filtered);
  }, [debouncedInlineCode, debouncedInlineDesc, originalRows]);

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
            console.log('[DCB] go-back-to-categories-specific received', e.detail);
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

  // table spinner only (keep left pane clickable)
  const tableLoading = loading || catsLoading;

  // ---------- Header title ----------
  const headerTitle = isResultsMode
    ? searchTitle
    : (cats.find((c) => c.code === selectedCat)?.label && selectedCat)
    ? `${cats.find((c) => c.code === selectedCat)!.label} (${selectedCat})`
    : lastCatName && lastCatCode
    ? `${lastCatName} (${lastCatCode})`
    : "Products";

  const [catCtx, setCatCtx] = useState<null | { x: number; y: number; cat: Category }>(null);

  useEffect(() => {
    const close = () => setCatCtx(null);
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setCatCtx(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <>
      <BrowserLayout
        sidebar={
          <>
            <div className="pm-sidebar-title">Display Categories</div>
            <div className="pm-sidebar-scroll">
              {cats.map((c) => (
                <button
                  key={c.code}
                  id={`cat-${c.code}`}
                  onClick={() => handleSelectCategory(c.code)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectCategory(c.code);
                    setCatCtx({ x: e.clientX, y: e.clientY, cat: c });
                  }}
                  className={`pm-list-item ${selectedCat === c.code ? 'pm-list-item--active' : ''}`}
                  title={`Open ${c.label} (${c.code})`}
                >
                  <div className="truncate">
                    {c.label}
                    <span className="ml-2 text-[11px] text-neutral-500">({c.code})</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        }
        searchPanel={
          <>
            <ProductHeaderSearch
              onSearch={handleSearch}
              onClear={handleClear}
              onExport={() => console.log("Exporting selected products to Excel")}
            />
            <div className="pm-divider-bleed" />
          </>
        }
        paneHeader={
          <>
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
              <button
                onClick={onResetColumns}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                title="Reset column widths to auto-fit content"
              >
                Reset Columns
              </button>
            </div>
          </>
        }
        table={
          <DataTable
            columns={PRODUCT_COLUMNS}
            data={rows}
            rowKey="code"
            storageKey="display-category-browser"
            selectedRowKey={selectedPhcCode}
            onRowClick={(row) => {
              setSelectedPhcCode(row.code);
              onPhcRowClick?.(row);
            }}
            onRowDoubleClick={(row) => {
              setSelectedPhcCode(null);
              onOpenProduct?.(row);
            }}
            emptyMessage={isResultsMode ? searchTitle : 'No products found'}
            loading={tableLoading}
          />
        }
        paneFooter={
          <>
            <button className="btn btn-light">New</button>
            <button className="btn btn-light">Clone</button>
          </> 
        }
      />

      {catCtx && (
        <div
          className="fixed z-1000 min-w-45 rounded border border-gray-300 bg-white shadow-md"
          style={{ left: catCtx.x, top: catCtx.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => {
              onModifyCategory?.(catCtx.cat);
              setCatCtx(null);
            }}
          >
            Modify
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => {
              onGoToDisplayCategory?.(catCtx.cat);
              setCatCtx(null);
            }}
          >
            Go to Display Category
          </button>
          </div>
      )}
    </>
  );
}