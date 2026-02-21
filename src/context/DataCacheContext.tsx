import { createContext, useContext, useState, ReactNode } from 'react';

type CacheState = {
  phcTree?: any[];
  pcTree?: any[];
  [key: string]: any;
};

type CacheContextType = {
  cache: CacheState;
  setCache: (key: string, value: any) => void;
  clearCache: (key?: string) => void;
};

const DataCacheContext = createContext<CacheContextType | null>(null);

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCacheState] = useState<CacheState>({});

  const setCache = (key: string, value: any) => {
    setCacheState(prev => ({ ...prev, [key]: value }));
  };

  const clearCache = (key?: string) => {
    if (key) {
      setCacheState(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setCacheState({});
    }
  };

  return (
    <DataCacheContext.Provider value={{ cache, setCache, clearCache }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache must be used within DataCacheProvider');
  return ctx;
}