// src/pages/ManageProductsForSale.tsx
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DisplayCategoryBrowser from '../components/DisplayCategoryBrowser';
import ManageProductsForSaleLegacy from '../ManageProductsForSale.jsx';
import Modal from '../components/Modal';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import ModalTabButton from '../components/shared/ModalTabButton';
import DC_GeneralTab from '../tabs/DC_GeneralTab';

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
type DC_DetailState = { open: boolean; code: string | null };

export default function ManageProductsForSalePage() {
  const [detail, setDetail] = useState<{ open: boolean; product?: ProductRow }>({ open: false, product: undefined });
  const [dcDetail, setDcDetail] = useState<DC_DetailState>({ open: false, code: null }); // ADD THIS
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
      setDcDetail({ open: true, code: focusCategoryCode });
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

  const handleModifyCategory = (row: ProductRow) => {
    const code = String(row?.code ?? '');
    if (!code) return;
    setDcDetail({ open: true, code });
  };

  const handleGoToDisplayCategory = (row: ProductRow) => {
    const code = String(row?.code ?? '');
    if (!code) return;

    navigate('/product-manager/manage-display-category', {
      state: {
        openCategoryCode: code,
        focusGroupCode: String(
          row?.displayGroupCode ?? row?.groupCode ?? row?.display_group_code ?? ''
        ),
      },
    });
  };

  return (
    <>
      {/* Surface the modal should cover, edge-to-edge */}
      <div id="phc-surface" className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <DisplayCategoryBrowser
          onOpenProduct={handleOpenProduct}
          onModifyCategory={handleModifyCategory}
          onGoToDisplayCategory={handleGoToDisplayCategory}
          initialCategoryCode={initialCategoryCode}
          categoryAnchor={categoryAnchor}
        />

        {/* Full-bleed modal that covers ONLY the PH header surface */}
      </div>

      <Modal
        open={detail.open}
        onClose={handleClose}
        title={detail.product ? `Manage Product — ${detail.product.description} (${detail.product.code})` : 'Manage Product'}
        headerClassName="pcphc-modal-header"
        titleClassName="pcphc-modal-title"
        panelClassName="pcphc-modal-panel"
      >
        <ModalSessionProvider>   {/* NEW — wraps modal content only */}
          <ManageProductsForSaleLegacy
            product={detail.product}
            onClose={handleClose}
          />
        </ModalSessionProvider>
      </Modal>

      <Modal
        open={dcDetail.open}
        onClose={() => setDcDetail((s) => ({ ...s, open: false }))}
        title={`Manage Display Category — ${dcDetail.code ?? ''}`}
        headerClassName="pcphc-modal-header"
        titleClassName="pcphc-modal-title"
        panelClassName="pcphc-modal-panel"
        onSave={() => {
          // TODO: save detail edits
        }}
      >
        <ModalSessionProvider>
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
  );
}
