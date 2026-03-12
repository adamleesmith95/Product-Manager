// src/pages/ManageProductsForSale.tsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
// Keep a stable reference to the product that was opened in the modal
const lastOpenedPhcRef = useRef<ProductRow | null>(null);
const navigate = useNavigate();

  const handleOpenProduct = (row: ProductRow) => {
    const product: ProductRow = {
      ...row,
      // Friendly aliases in case the legacy reads different names internally
      phcCode: row.code,
      productHeaderCode: row.code,
      ProductHeaderCode: row.code,
      product_header_code: row.code,
    };
    
lastOpenedPhcRef.current = product;
setDetail({ open: true, product })

  };

  /**
   * Close handler:
   * - 'exit' => keep whatever is currently shown in the right pane (desc results, anchor results, etc.)
   * - 'back' => jump to the opened PHC's Display Category and show that category's PHCs
   */
 // ADD this — simple close used by modal onClose
  const handleClose = () => {
    handleCloseDetail('exit', lastOpenedPhcRef.current ?? detail.product);
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
  setDcDetail({ open: true, code: String(row?.code ?? '') });
};

const handleDrillDownCategory = (row: ProductRow) => {
  navigate('/product-manager/manage-display-category', {
    state: { openCategoryCode: String(row?.code ?? '') },
  });
};

const [dcDetail, setDcDetail] = useState<{ open: boolean; code: string | null }>({
  open: false,
  code: null,
});

  return (
    <>
      {/* Surface the modal should cover, edge-to-edge */}
      <div id="phc-surface" className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <DisplayCategoryBrowser
          onOpenProduct={handleOpenProduct}
          onModifyCategory={handleModifyCategory}
          onDrillDownCategory={handleDrillDownCategory}
        />

        {/* Full-bleed modal that covers ONLY the PH header surface */}
      </div>

      <Modal
        open={detail.open}
        onClose={handleClose}
        title={detail.product ? `Manage Product — ${detail.product.description ?? detail.product.code}` : 'Manage Product'}
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
