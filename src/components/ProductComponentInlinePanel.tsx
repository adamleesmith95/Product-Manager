import React, { useState } from 'react';
import PC_GeneralTab from '../tabs/PC_GeneralTab';
import PC_AdditionalTab from '../tabs/PC_AdditionalTab';
import ModalTabButton from './shared/ModalTabButton';

type TabKey = 'general' | 'additional';

export default function ProductComponentInlinePanel({
  productCode,
  className = '',
}: {
  productCode: number | null;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  return (
    <section className={`pc-inline-panel ${className}`}>
      <div className="pc-inline-tabs">
        <div className="pm-tab-row">
          <ModalTabButton
            active={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
          >
            General
          </ModalTabButton>
          <ModalTabButton
            active={activeTab === 'additional'}
            onClick={() => setActiveTab('additional')}
          >
            Additional
          </ModalTabButton>
        </div>
      </div>

      <div className="pc-inline-body">
        {!productCode ? (
          <div className="pc-inline-empty">Select a Product Code to view details.</div>
        ) : (
          <>
            <div style={{ display: activeTab === 'general' ? 'block' : 'none' }}>
              <PC_GeneralTab productCode={productCode} isActive={activeTab === 'general'} />
            </div>
            <div style={{ display: activeTab === 'additional' ? 'block' : 'none' }}>
              <PC_AdditionalTab productCode={productCode} isActive={activeTab === 'additional'} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}