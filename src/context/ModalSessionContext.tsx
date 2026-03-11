import React, { createContext, useContext, useRef, useState, ReactNode, useCallback, useMemo } from 'react';

interface ModalSessionState {
  // tab form states keyed by tab name
  tabForms: Record<string, any>;
  setTabForm: (tab: string, data: any) => void;

  // data cache keyed by cache key
  dataCache: Record<string, any>;
  setDataCache: (key: string, data: any) => void;
  getDataCache: (key: string) => any | undefined;
  clearCache: () => void;
}

const ModalSessionContext = createContext<ModalSessionState | null>(null);

export function ModalSessionProvider({ children }: { children: ReactNode }) {
  const [tabForms, setTabForms] = useState<Record<string, any>>({});
  const dataCache = useRef<Record<string, any>>({});

  const setTabForm = useCallback((tab: string, data: any) => {
    setTabForms((prev) => {
      // prevent infinite updates when value is unchanged
      if (Object.is(prev[tab], data)) return prev;
      return { ...prev, [tab]: data };
    });
  }, []);

  const setDataCache = useCallback((key: string, data: any) => {
    dataCache.current[key] = data;
  }, []);

  const getDataCache = useCallback((key: string) => {
    return dataCache.current[key];
  }, []);

  const clearCache = useCallback(() => {
    dataCache.current = {};
    setTabForms({});
  }, []);

  const value = useMemo(
    () => ({ tabForms, setTabForm, dataCache: dataCache.current, setDataCache, getDataCache, clearCache }),
    [tabForms, setTabForm, setDataCache, getDataCache, clearCache]
  );

  return <ModalSessionContext.Provider value={value}>{children}</ModalSessionContext.Provider>;
}

// existing hook (throws if no provider)
export function useModalSession() {
  const ctx = useContext(ModalSessionContext);
  if (!ctx) throw new Error('useModalSession must be used within ModalSessionProvider');
  return ctx;
}

// ADD: safe version — returns null if no provider (for components used outside modal too)
export function useModalSessionSafe() {
  return useContext(ModalSessionContext);
}