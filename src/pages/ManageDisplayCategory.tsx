import React, { useState, useEffect, useRef } from 'react';
import DisplayCategorySearch from '../components/DisplayCategorySearch';
import Modal from '../components/Modal';
import ModalTabButton from '../components/shared/ModalTabButton';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import DC_GeneralTab from '../tabs/DC_GeneralTab';
import DG_GeneralTab from '../tabs/DG_GeneralTab';
import { useLocation, useNavigate } from 'react-router-dom';

type Anchor = { code: string; ts: number } | null;
type DG_DetailState = { open: boolean; code: string; description: string };

export default function ManageDisplayCategory() {
  type DisplayCategoryDetailState = {
    open: boolean;
    code: string;
    description: string;
  };

  type DisplayCategoryRow = {
    code?: string | number;
    description?: string;
    label?: string;
    name?: string;
    [key: string]: unknown;
  };

  const [detail, setDetail] = useState<DisplayCategoryDetailState>({
    open: false,
    code: '',
    description: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const [groupAnchor, setGroupAnchor] = useState<Anchor>(null);
  const [categoryAnchor, setCategoryAnchor] = useState<Anchor>(null);

  const stateConsumedRef = useRef(false);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const state: any = location.state ?? {};

    console.log('[MDC] location.state received', state);
    console.log('[MDC] location.search received', location.search);

    const qsGroup = String(qs.get('focusGroupCode') ?? '');
    const qsCategory = String(qs.get('focusCategoryCode') ?? '');
    const qsTs = Number(qs.get('navTs') ?? 0);

    const stateCategory = String(state.openCategoryCode ?? '');
    const stateGroup = String(state.focusGroupCode ?? '');
    const stateDescription = String(state.description ?? state.label ?? '');

    const categoryCode = qsCategory || stateCategory;
    const groupCode = qsGroup || stateGroup;
    const ts = qsTs || (categoryCode || groupCode ? Date.now() : 0);

    console.log('[MDC] parsed', { qsGroup, stateGroup, groupCode, categoryCode, ts });

    // only process if we have real anchor data AND haven't consumed it yet
    if (!categoryCode && !groupCode) {
      console.warn('[MDC] no anchor codes found, skipping');
      return;
    }

    // prevent second fire from navigate(...state:{}) overwriting anchors
    if (stateConsumedRef.current) {
      console.log('[MDC] state already consumed, skipping');
      return;
    }
    stateConsumedRef.current = true;

    if (groupCode) setGroupAnchor({ code: groupCode, ts: ts || Date.now() });
    if (categoryCode) setCategoryAnchor({ code: categoryCode, ts: ts || Date.now() });

    if (stateCategory) {
      setDetail({ open: true, code: stateCategory, description: stateDescription });
    }

    // clear state from URL without re-triggering anchor logic
    if (Object.keys(state).length) {
      navigate(location.pathname, { replace: true, state: {} });
    }

    // reset ref after a tick so next genuine navigation works
    setTimeout(() => { stateConsumedRef.current = false; }, 500);

  }, [location.search, location.state, location.pathname, navigate]);

  const handleOpenCategory = (row: any) => {
    setDetail({
      open: true,
      code: String(row?.code ?? ''),
      description: String(row?.label ?? row?.description ?? row?.name ?? ''),
    });
  };

  const handleModifyCategory = (row: any) => {
    const code = String(row?.code ?? '');
    if (!code) return;
    setDetail({
      open: true,
      code,
      description: String(row?.label ?? row?.description ?? row?.name ?? ''),
    });
  };

  const handleGoToProductsForSale = (row: any) => {
    const code = String(row?.code ?? '');
    if (!code) return;
    navigate(
      `/product-manager/manage-products-for-sale?focusCategoryCode=${encodeURIComponent(code)}&navTs=${Date.now()}`
    );
  };

  const handleModifyGroup = (row: any) => {
    const code = String(row?.groupCode ?? row?.code ?? row?.displayGroupCode ?? '');
    const description = String(row?.label ?? row?.description ?? row?.name ?? '');
    if (!code) return;
    setDgDetail({ open: true, code, description });
  };

  const handleGoToDisplayGroup = (row: any) => {
    const code = String(row?.groupCode ?? row?.code ?? row?.displayGroupCode ?? '');
    const description = String(row?.label ?? row?.description ?? row?.name ?? '');
    if (!code) return;

    navigate('/product-manager/manage-display-group', {
      state: {
        focusGroupCode: code,
        openGroupCode: code,
        description,
        navTs: Date.now(),
      },
    });
  };

  const [dgDetail, setDgDetail] = useState<DG_DetailState>({
    open: false,
    code: '',
    description: '',
  });

  return (
    <>
      <div className="bg-white shadow-md rounded-md mb-4 border border-gray-300">
        <div className="flex items-center justify-between bg-indigo-950 px-4 py-2 rounded-t-md">
          <h2 className="text-white text-lg font-semibold">Display Category Search</h2>
        </div>
        <DisplayCategorySearch
          groupAnchor={groupAnchor}
          categoryAnchor={categoryAnchor}
          onOpenCategory={handleOpenCategory}
          onModifyCategory={handleModifyCategory}
          onGoToProductsForSale={handleGoToProductsForSale}
          onModifyGroup={handleModifyGroup}
          onGoToDisplayGroup={handleGoToDisplayGroup}
        />
      </div>

      {/* Display Category modal (restore this) */}
      <Modal
        open={detail.open}
        onClose={() => setDetail((s) => ({ ...s, open: false }))}
        title={
          detail.code
            ? `Manage Display Category — ${detail.description || 'Category'} (${detail.code})`
            : 'Manage Display Category'
        }
        headerClassName="pcphc-modal-header"
        titleClassName="pcphc-modal-title"
        panelClassName="pcphc-modal-panel"
        onSave={() => {}}
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

      {/* Display Group modal (keep this) */}
      <Modal
        open={dgDetail.open}
        onClose={() => setDgDetail((s) => ({ ...s, open: false }))}
        title={
          dgDetail.code
            ? `Manage Display Group — ${dgDetail.description || 'Group'} (${dgDetail.code})`
            : 'Manage Display Group'
        }
        headerClassName="pcphc-modal-header"
        titleClassName="pcphc-modal-title"
        panelClassName="pcphc-modal-panel"
        onSave={() => {}}
      >
        <ModalSessionProvider>
          <div className="pm-tab-host">
            <div className="pm-tabs-row">
              <ModalTabButton active onClick={() => {}}>General</ModalTabButton>
            </div>
            <div className="pm-tab-body pm-form-shell">
              <DG_GeneralTab groupCode={dgDetail.code} isActive />
            </div>
          </div>
        </ModalSessionProvider>
      </Modal>
    </>
  );
}