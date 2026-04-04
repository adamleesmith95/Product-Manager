import { useEffect, useState } from 'react';

interface Result {
    open: boolean;
    rows: Record<string, any>[];
    loading: boolean;  
    error: string;
    openViewer: () => void;
    closeViewer: () => void;
}   

export function useEntityRelationViewer(fetchURL: string): Result {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !fetchURL) return;

        let cancelled = false;
        setLoading(true);
        setError('');

        fetch(fetchURL)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => {
                if (cancelled) return;
                // Accept [ rows: [] } or a plain array
                setRows(Array.isArray(json) ? json : Array.isArray(json?.rows) ? json.rows : []);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(String(err?.message ?? 'Failed to load data'));
                setRows([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, fetchURL]);

    return {
        open,
        rows,
        loading,
        error,
        openViewer: () => setOpen(true),
        closeViewer: () => setOpen(false),
    };
}