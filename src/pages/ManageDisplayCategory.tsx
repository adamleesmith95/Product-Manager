import React, { useState, useEffect } from 'react';
import DisplayCategorySearch from '../components/DisplayCategorySearch';
import Modal from '../components/Modal';
import ModalTabButton from '../components/shared/ModalTabButton';
import { ModalSessionProvider } from '../context/ModalSessionContext';
import DC_GeneralTab from '../tabs/DC_GeneralTab';
import { useLocation, useNavigate } from 'react-router-dom';

type Anchor = { code: string; ts: number } | null;

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

  const location = useLocation();
  const navigate = useNavigate();

  const [groupAnchor, setGroupAnchor] = useState<Anchor>(null);
  const [categoryAnchor, setCategoryAnchor] = useState<Anchor>(null);

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const qsGroup = String(qs.get('focusGroupCode') ?? '');
    const qsCategory = String(qs.get('focusCategoryCode') ?? '');
    const qsTs = Number(qs.get('navTs') ?? 0);

    const state: any = location.state ?? {};
    const stateCategory = String(state.openCategoryCode ?? '');
    const stateGroup = String(state.focusGroupCode ?? '');
    const stateDescription = String(state.description ?? state.label ?? '');

    const categoryCode = qsCategory || stateCategory;
    const groupCode = qsGroup || stateGroup;
    const ts = qsTs || (categoryCode || groupCode ? Date.now() : 0);

    if (!categoryCode && !groupCode) return;

    if (groupCode) setGroupAnchor({ code: groupCode, ts: ts || Date.now() });
    if (categoryCode) setCategoryAnchor({ code: categoryCode, ts: ts || Date.now() });

    if (stateCategory) {
      setDetail({
        open: true,
        code: stateCategory,
        description: stateDescription,
      });
    }

    navigate(location.pathname, { replace: true, state: {} });
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
        />
      </div>

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
    </>
  );
}