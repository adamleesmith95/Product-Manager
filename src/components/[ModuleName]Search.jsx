// Standard pattern for all browse modules:

useEffect(() => {
  let alive = true;
  (async () => {
    try {
      setLoading(true);
      
      // 1. Check cache
      if (isCached('moduleKey')) {
        setData(cache.moduleKey);
        setLoading(false);
        return;
      }

      // 2. Fetch
      const res = await fetch('/api/module/tree');
      const json = await res.json();
      if (!alive) return;
      
      // 3. Set data
      setData(json);
      setCache('moduleKey', json);
      
    } catch (err) {
      console.error('[Module] load failed', err);
    } finally {
      if (alive) setLoading(false);
    }
  })();
  return () => { alive = false; };
}, [cache, isCached, setCache]);

// ✅ NO auto-expand/select in useEffect
// ✅ Let user interaction trigger expansion
// ✅ Spinner only tracks fetch, not DOM work