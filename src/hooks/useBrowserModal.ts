import { useState, useCallback } from 'react';

export function useBrowserModal() {
  const [state, setState] = useState({ open: false, focusCode: '' });

  const openModal = useCallback((focusCode = '') => {
    setState({ open: true, focusCode });
  }, []);

  const closeModal = useCallback(() => {
    setState(s => ({ ...s, open: false }));
  }, []);

  return { open: state.open, focusCode: state.focusCode, openModal, closeModal };
}