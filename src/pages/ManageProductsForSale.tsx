
// src/pages/ManageProductsForSale.tsx
import { useRef, useState } from 'react';
import DisplayCategoryBrowser from '../components/DisplayCategoryBrowser';
import ManageProductsForSaleLegacy from '../ManageProductsForSale.jsx';
import Modal from '../components/Modal';

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


export default function ManageProductsForSale() {
   const [detail, setDetail] = useState<{ open: boolean; product?: ProductRow }>({ open: false, product: undefined });
// Keep a stable reference to the product that was opened in the modal
const lastOpenedPhcRef = useRef<ProductRow | null>(null);


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

// src/pages/ManageProductsForSale.tsx

// ...inside ManageProductsForSale component...

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


  return (
    // Surface the modal should cover, edge-to-edge
    <div id="phc-surface" className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
      <DisplayCategoryBrowser onOpenProduct={handleOpenProduct} />

      {/* Full-bleed modal that covers ONLY the PH header surface */}
      

<Modal
  open={detail.open && !!detail.product}
  onClose={() => handleCloseDetail('exit', lastOpenedPhcRef.current ?? detail.product)}
  title={
    detail.product
      ? `Manage Product — ${detail.product.description ?? detail.product.code}`
      : 'Manage Product'
  }
  containerId="phc-surface"

  /* Header stays indigo; title text white */
  headerClassName="bg-indigo-950"   // controls the header bar
  titleClassName="text-white"       // controls only the title text
>


  {detail.product && (
    <ManageProductsForSaleLegacy
      product={detail.product}
      // Legacy only takes onClose; we map it to "Back" behavior
      onClose={() => handleCloseDetail('back', detail.product)}
    />
  )}
</Modal>

    </div>
  );
}
