import React, { useState } from 'react';
import DisplayGroupSearch from '../components/DisplayGroupSearch';
import Modal from '../components/Modal';
import ModalTabButton from '../components/shared/ModalTabButton';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import DG_GeneralTab from '../tabs/DG_GeneralTab';

export default function ManageDisplayGroup() {
  type DisplayGroupDetailState = {
    open: boolean;
    code: string;
    description: string;
  };

  const [detail, setDetail] = useState<DisplayGroupDetailState>({
    open: false,
    code: '',
    description: '',
  });

  const handleOpenGroup = (row: any) => {
    setDetail({
      open: true,
      code: String(row?.code ?? ''),
      description: String(row?.description ?? row?.label ?? row?.name ?? ''),
    });
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
          <h2 className="text-white text-lg font-semibold">Display Group Search</h2>
        </div>
        <DisplayGroupSearch
          onOpenGroup={handleOpenGroup}
        />
      </div>

      <Modal
        open={detail.open}
        onClose={() => setDetail((s) => ({ ...s, open: false }))}
        title={
          detail.code
            ? `Manage Display Group — ${detail.description || 'Display Group'} (${detail.code})`
            : 'Manage Display Group'
        }
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