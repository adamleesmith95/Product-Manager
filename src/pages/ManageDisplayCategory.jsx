import React, { useState, useEffect } from 'react';
import DisplayCategorySearch from '../components/DisplayCategorySearch';
import Modal from '../components/Modal';
import ModalTabButton from '../components/shared/ModalTabButton';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import DC_GeneralTab from '../tabs/DC_GeneralTab';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ManageDisplayCategory() {
  const [detail, setDetail] = useState({ open: false, code: null });
  const [initialGroupCode, setInitialGroupCode] = useState('');
  const [initialCategoryCode, setInitialCategoryCode] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const [openCategoryCode, setOpenCategoryCode] = useState('');
  const [focusGroupCode, setFocusGroupCode] = useState('');

  useEffect(() => {
    const state = location?.state ?? {};
    const cat = String(state.openCategoryCode ?? '');
    const grp = String(state.focusGroupCode ?? '');

    if (!cat) return;

    setInitialCategoryCode(cat);
    setInitialGroupCode(grp);
    setDetail({ open: true, code: cat });

    // clear one-time state
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const handleModifyCategory = (row) => {
    const code = String(row?.code ?? '');
    if (!code) return;
    setDetail({ open: true, code });
  };

  const handleGoToProductsForSale = (row) => {
    const code = String(row?.code ?? '');
    if (!code) return;

    const navTs = Date.now();
    navigate(
      `/product-manager/manage-products-for-sale?focusCategoryCode=${encodeURIComponent(code)}&navTs=${navTs}`
    );
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
          <h2 className="text-white text-lg font-semibold">Display Category Search</h2>
        </div>
        <DisplayCategorySearch
          initialGroupCode={initialGroupCode}
          initialCategoryCode={initialCategoryCode}
          onOpenCategory={(row) => setDetail({ open: true, code: String(row?.code ?? '') })}
          onModifyCategory={handleModifyCategory}
          onGoToProductsForSale={handleGoToProductsForSale}
        />
      </div>

      <Modal
        open={detail.open}
        onClose={() => setDetail((s) => ({ ...s, open: false }))}
        title={`Manage Display Category — ${detail.code ?? ''}`}
        headerClassName="pcphc-modal-header"
        titleClassName="pcphc-modal-title"
        panelClassName="pcphc-modal-panel"
        onSave={() => {
          // TODO: wire API save
        }}
      >
        <ModalSessionProvider>
          <div className="pm-tab-host">
            <div className="pm-tabs-row">
              <ModalTabButton active onClick={() => {}}>General</ModalTabButton>
            </div>
            <div className="pm-tab-body pm-form-shell">
              <DC_GeneralTab categoryCode={detail.code} isActive />
            </div>
          </div>
        </ModalSessionProvider>
      </Modal>
    </>
  );
}