import React from 'react';
import Modal from '../Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Standard full-size modal wrapper for browser components (PC, Scan Types, etc.)
// Each browser component manages its own ModalSessionProvider internally.
export default function BrowserModal({ open, onClose, title, children }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      headerClassName="pcphc-modal-header"
      titleClassName="pcphc-modal-title"
      panelClassName="pcphc-modal-panel"
    >
      {children}
    </Modal>
  );
}