import React, { useState, useEffect } from 'react';
import DisplayCategorySearch from '../components/DisplayCategorySearch';
import Modal from '../components/Modal';
import ModalTabButton from '../components/shared/ModalTabButton';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import DC_GeneralTab from '../tabs/DC_GeneralTab';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ManageDisplayCategory() {
  const [detail, setDetail] = useState({ open: false, code: null });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const code = location?.state?.openCategoryCode;
    if (!code) return;
    setDetail({ open: true, code: String(code) });

    // clear one-time nav state so it doesn't reopen on refresh/back
    navigate(location.pathname, { replace: true, state: {} });
  }, [location?.state, location.pathname, navigate]);

  return (
    <>
      <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
          <h2 className="text-white text-lg font-semibold">Display Category Search</h2>
        </div>
        <DisplayCategorySearch
          onOpenCategory={(row) => setDetail({ open: true, code: String(row?.code ?? '') })}
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