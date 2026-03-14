import React, { useState, useEffect } from 'react';
import DisplayGroupSearch from '../components/DisplayGroupSearch';
import Modal from '../components/Modal';
import ModalTabButton from '../components/shared/ModalTabButton';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import DG_GeneralTab from '../tabs/DG_GeneralTab';
import { useLocation, useNavigate } from 'react-router-dom';

type Anchor = { code: string; ts: number } | null;

export default function ManageDisplayGroup() {
  type DisplayGroupDetailState = {
    open: boolean;
    code: string;
    description: string;
  };

  const location = useLocation();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DisplayGroupDetailState>({
    open: false,
    code: '',
    description: '',
  });
  const [groupAnchor, setGroupAnchor] = useState<Anchor>(null);

  const handleOpenGroup = (row: any) => {
    setDetail({
      open: true,
      code: String(row?.code ?? ''),
      description: String(row?.description ?? row?.label ?? row?.name ?? ''),
    });
  };

  const handleGoToDisplayCategory = (row: any) => {
    const groupCode = String(row?.code ?? row?.groupCode ?? row?.displayGroupCode ?? '');
    const description = String(row?.label ?? row?.description ?? '');
    console.log('[MDG] handleGoToDisplayCategory called', { row, groupCode, description });
    if (!groupCode) {
      console.warn('[MDG] no groupCode found on row', row);
      return;
    }
    navigate('/product-manager/manage-display-category', {
      state: {
        focusGroupCode: groupCode,
        description,
        navTs: Date.now(),
      },
    });
  };

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const state: any = location.state ?? {};

    const focusGroupCode = String(qs.get('focusGroupCode') ?? state.focusGroupCode ?? '');
    const openGroupCode = String(qs.get('openGroupCode') ?? state.openGroupCode ?? '');
    const description = String(state.description ?? '');
    const navTs = Number(qs.get('navTs') ?? state.navTs ?? 0) || Date.now();

    if (focusGroupCode) setGroupAnchor({ code: focusGroupCode, ts: navTs });

    if (openGroupCode) {
      setDetail({ open: true, code: openGroupCode, description });
    }

    // consume state once
    if (Object.keys(state).length) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.search, location.state, location.pathname, navigate]);

  return (
    <>
      <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
          <h2 className="text-white text-lg font-semibold">Display Group Search</h2>
        </div>
        <DisplayGroupSearch
          groupAnchor={groupAnchor}
          onOpenGroup={handleOpenGroup}
          onGoToDisplayCategory={handleGoToDisplayCategory}
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