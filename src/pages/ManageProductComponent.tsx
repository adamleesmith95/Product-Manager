import React, { useState } from 'react';
import ProductComponentSearch from '../components/ProductComponentSearch';
import Modal from '../components/Modal';
import PC_GeneralTab from '../tabs/PC_GeneralTab';
import PC_AdditionalTab from '../tabs/PC_AdditionalTab';

export default function ManageProductComponent() {
  const [detail, setDetail] = useState<{ open: boolean; productCode: number | null }>({
    open: false,
    productCode: null,
  });
  const [activeTab, setActiveTab] = useState<'general' | 'additional'>('general');

  const handleOpenProduct = (row: any) => {
    setDetail({ open: true, productCode: Number(row.productCode ?? row.code) || null });
    setActiveTab('general');
  };

  const handleClose = () => setDetail((s) => ({ ...s, open: false }));

  return (
    <>
      <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
          <h2 className="text-white text-lg font-semibold">Product Component Search</h2>
        </div>
        <ProductComponentSearch onOpenProduct={handleOpenProduct} />
      </div>

      <Modal
        open={detail.open}
        onClose={handleClose}
        title={`Manage Product Component — ${detail.productCode ?? ''}`}
        headerClassName="pcphc-modal-header"
        titleClassName="pcphc-modal-title"
        panelClassName="pcphc-modal-panel"
      >
        <div className="pm-tab-host">
          <div className="pm-tabs-row">
            <button
              type="button"
              className={`pm-tab ${activeTab === 'general' ? 'pm-tab--active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              type="button"
              className={`pm-tab ${activeTab === 'additional' ? 'pm-tab--active' : ''}`}
              onClick={() => setActiveTab('additional')}
            >
              Additional
            </button>
          </div>

          <div className="pm-tab-body pm-form-shell">
            {activeTab === 'general' && (
              <PC_GeneralTab productCode={detail.productCode} isActive />
            )}
            {activeTab === 'additional' && (
              <PC_AdditionalTab productCode={detail.productCode} isActive />
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}