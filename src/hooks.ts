import { useCallback, useEffect, useRef, useState } from "react";

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Error inesperado";
}

export function useSort<T extends string>(initial: T) {
  const [sortBy, setSortBy] = useState<T>(initial);
  const [sortOpen, setSortOpen] = useState(false);
  return {
    sortBy,
    sortOpen,
    setSortBy,
    toggle: () => setSortOpen((value) => !value),
    select: (value: T) => {
      setSortBy(value);
      setSortOpen(false);
    },
  };
}

export function usePagination<T>(items: T[], pageSize = 8) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  useEffect(() => {
    setPage(0);
  }, [items.length]);
  const start = safePage * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    page: safePage,
    totalPages,
    pageItems,
    next: () => setPage((value) => Math.min(value + 1, totalPages - 1)),
    prev: () => setPage((value) => Math.max(value - 1, 0)),
  };
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fn()
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}

export function useScrollPreserve() {
  const distanceRef = useRef(0);
  const capture = useCallback(() => {
    const main = document.querySelector("main") as HTMLElement | null;
    if (main) {
      distanceRef.current = main.scrollHeight - main.scrollTop - main.clientHeight;
    }
  }, []);
  const restore = useCallback(() => {
    const main = document.querySelector("main") as HTMLElement | null;
    if (main) {
      const target = main.scrollHeight - main.clientHeight - distanceRef.current;
      main.scrollTop = Math.max(0, target);
    }
  }, []);
  return { capture, restore };
}
