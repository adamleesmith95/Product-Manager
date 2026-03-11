import React, { useState } from 'react';
import DisplayGroupSearch from '../components/DisplayGroupSearch';
import Modal from '../components/Modal';
import ModalTabButton from '../components/shared/ModalTabButton';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import DG_GeneralTab from '../tabs/DG_GeneralTab';

export default function ManageDisplayGroup() {
  const [detail, setDetail] = useState<{ open: boolean; code: string | null }>({ open: false, code: null });

  return (
    <>
      <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
          <h2 className="text-white text-lg font-semibold">Display Group Search</h2>
        </div>
        <DisplayGroupSearch
          onOpenGroup={(row: any) => setDetail({ open: true, code: String(row?.code ?? '') })}
        />
      </div>

      <Modal
        open={detail.open}
        onClose={() => setDetail((s) => ({ ...s, open: false }))}
        title={`Manage Display Group — ${detail.code ?? ''}`}
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
              <DG_GeneralTab groupCode={detail.code} isActive />
            </div>
          </div>
        </ModalSessionProvider>
      </Modal>
    </>
  );
}