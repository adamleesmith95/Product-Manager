// src/pages/ManageProductsForSale.tsx
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DisplayCategoryBrowser from '../components/DisplayCategoryBrowser';
import ManageProductsForSaleLegacy from '../ManageProductsForSale.jsx';
import Modal from '../components/Modal';
import { ModalSessionProvider, useModalSession } from '../context/ModalSessionContext';
import ModalTabButton from '../components/shared/ModalTabButton';
import DC_GeneralTab from '../tabs/productTables/displayCategory/DC_GeneralTab';
import { normalizeCode, normalizeDescription, withNavTs } from '../utils/navInterop';

type ProductRow = {
  code: string;
  description?: string;
  active?: string;
  display?: string;
  displayOrder?: number | string;
  displayCategory?: string;
  displayCategoryCode?: string;
  [key: string]: any;
};

type DetailState = { open: boolean; product?: ProductRow };
type DC_DetailState = { open: boolean; code: string | null; description?: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function PrefetchWarmup({ phcCode }: { phcCode: string }) {
  const { getDataCache, setDataCache } = useModalSession();
  useEffect(() => {
    // Warm the components tree once per session
    const treeKey = 'components-tree';
    if (!getDataCache(treeKey)) {
      fetch(`${API_BASE}/api/components/tree`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setDataCache(treeKey, data); })
        .catch(() => {});
    }
    // Warm assigned components for the hovered/clicked PHC
    if (!phcCode) return;
    const compKey = `product-components-${phcCode}`;
    if (!getDataCache(compKey)) {
      fetch(`${API_BASE}/api/products/${phcCode}/components`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setDataCache(compKey, data); })
        .catch(() => {});
    }
  }, [phcCode]);
  return null;
}

export default function ManageProductsForSalePage() {
  const [prefetchPhcCode, setPrefetchPhcCode] = useState('');
  const [detail, setDetail] = useState<{ open: boolean; product?: ProductRow }>({ open: false, product: undefined });
  const [dcDetail, setDcDetail] = useState<DC_DetailState>({ open: false, code: null, description: '' });
  const navigate = useNavigate();
  const location = useLocation();

  const [initialCategoryCode, setInitialCategoryCode] = useState<string>('');
  const [categoryAnchor, setCategoryAnchor] = useState<{ code: string; ts: number } | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const qsCode = String(qs.get('focusCategoryCode') ?? '');
    const qsTs = Number(qs.get('navTs') ?? Date.now());
    const qsOpen = qs.get('openCategoryModal');

    const state: any = location.state ?? {};
    const stateCode = String(state.focusCategoryCode ?? '');
    const stateOpen = Boolean(state.openCategoryModal);

    const focusCategoryCode = qsCode || stateCode;
    const navTs = Number.isFinite(qsTs) ? qsTs : Date.now();
    const openCategoryModal = qsOpen != null ? qsOpen === 'true' : stateOpen; // ADD

    if (!focusCategoryCode) {
      console.log('[MPFS] no focusCategoryCode; skipping');
      return;
    }

    console.log('[MPFS] applying anchor', { focusCategoryCode, navTs, openCategoryModal });
    setCategoryAnchor({ code: focusCategoryCode, ts: navTs });

    if (openCategoryModal) {
      setDcDetail({
        open: true,
        code: focusCategoryCode,
        description: String(state.description ?? ''),
      });
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.search, location.state, navigate]);

  const handleOpenProduct = (row: ProductRow) => {
    const product: ProductRow = {
      ...row,
      // Friendly aliases in case the legacy reads different names internally
      phcCode: row.code,
      productHeaderCode: row.code,
      ProductHeaderCode: row.code,
      product_header_code: row.code,
    };
    
    setDetail({ open: true, product })

  };

  /**
   * Close handler:
   * - 'exit' => keep whatever is currently shown in the right pane (desc results, anchor results, etc.)
   * - 'back' => jump to the opened PHC's Display Category and show that category's PHCs
   */
  const handleClose = () => {
    handleCloseDetail('exit', detail.product);
  };

  const handleCloseDetail = (mode: 'exit' | 'back', product?: ProductRow) => {
    setDetail({ open: false, product: undefined });

    if (mode === 'back' && product) {
      // Targeted back: jump to product's category and re-highlight there
      window.dispatchEvent(
        new CustomEvent('go-back-to-categories-specific', {
          detail: {
            categoryCode: product.displayCategoryCode,
            categoryName: product.displayCategory,
            phcCode: product.code, // we already had this—keep it
          },
        })
      );
    }

    if (mode === 'exit' && product) {
      // Exit: keep current listing *and* re-select the PHC that was open
      window.dispatchEvent(
        new CustomEvent('reselect-phc', {
          detail: { code: product.code },
        })
      );
    }
  };

  const handleModifyCategory = (row: any) => {
    const code = String(row?.code ?? row?.categoryCode ?? row?.displayCategoryCode ?? '');
    const description = String(row?.label ?? row?.description ?? row?.name ?? '');
    if (!code) return;
    setDcDetail({ open: true, code, description });
  };

  const handleGoToDisplayCategory = (row: any) => {
    const openCategoryCode = normalizeCode(row, ['displayCategoryCode', 'categoryCode', 'code', 'display_category_code']);
    const focusGroupCode = normalizeCode(row, ['displayGroupCode', 'groupCode', 'display_group_code']);
    const description = normalizeDescription(row);

    if (!openCategoryCode) return;

    navigate('/product-manager/manage-display-category', {
      state: withNavTs({
        openCategoryCode,
        focusGroupCode,
        description,
      }),
    });
  };

    return (
    <ModalSessionProvider>
      <PrefetchWarmup phcCode={prefetchPhcCode} />
      <>
        <div id="phc-surface" className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
          <DisplayCategoryBrowser
            onOpenProduct={handleOpenProduct}
            onModifyCategory={handleModifyCategory}
            onGoToDisplayCategory={handleGoToDisplayCategory}
            initialCategoryCode={initialCategoryCode}
            categoryAnchor={categoryAnchor}
            onPhcRowClick={(row) => setPrefetchPhcCode(String(row.code))}
          />
        </div>
  
        <Modal
          open={detail.open}
          onClose={handleClose}
          title={
            detail.product
              ? `Manage Product — ${detail.product.description} (${detail.product.code})`
              : 'Manage Product'
          }
          headerClassName="pcphc-modal-header"
          titleClassName="pcphc-modal-title"
          panelClassName="pcphc-modal-panel"
        >
          {/* ModalSessionProvider removed — uses the outer one above */}
          <ManageProductsForSaleLegacy
            product={detail.product}
            onClose={handleClose}
          />
        </Modal>
  
        <Modal
          open={dcDetail.open}
          onClose={() => setDcDetail((s) => ({ ...s, open: false }))}
          title={
            dcDetail.code
              ? `Manage Display Category — ${dcDetail.description || 'Category'} (${dcDetail.code})`
              : 'Manage Display Category'
          }
          headerClassName="pcphc-modal-header"
          titleClassName="pcphc-modal-title"
          panelClassName="pcphc-modal-panel"
          onSave={() => {}}
        >
          <ModalSessionProvider>  {/* DC modal keeps its own isolated scope */}
            <div className="pm-tab-host">
              <div className="pm-tabs-row">
                <ModalTabButton active onClick={() => {}}>General</ModalTabButton>
              </div>
              <div className="pm-tab-body pm-form-shell">
                <DC_GeneralTab categoryCode={dcDetail.code} isActive />
              </div>
            </div>
          </ModalSessionProvider>
        </Modal>
      </>
    </ModalSessionProvider>
  );
}
