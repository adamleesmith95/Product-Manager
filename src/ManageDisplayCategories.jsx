import React, { useState } from 'react';
import DisplayCategoryBrowser from './components/DisplayCategoryBrowser';
import ManageProductsForSale from './ManageProductsForSale';

export default function ManageDisplayCategories() {
  const [view, setView] = useState('browse');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState(null);

  function openProductView(row) {
    setSelectedProduct(row);
    setSelectedCategoryCode(row.displayCategoryCode);
    setView('product');
  }

  function returnToBrowse() {
    setView('browse');
  }

  return (
    <div className="min-h-screen w-full bg-neutral-50 px-6 py-4">
      {view === 'browse' ? (
        <DisplayCategoryBrowser
          initialCategoryCode={selectedCategoryCode}
          onOpenProduct={openProductView}
        />
      ) : view === 'product' ? (
        <ManageProductsForSale
          product={selectedProduct}
          onClose={returnToBrowse}
        />
      ) : (
        <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-600">
          <p>
            Unknown view: <span className="font-medium">{view}</span>
          </p>
        </div>
      )}
    </div>
  );
}