import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from './api';

/** Loads JSON from the API with loading and error states. `setData` allows local updates after a save. */
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true); setError('');
    api<T>(path)
      .then(setData)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(reload, [reload]);
  return { data, setData, error, loading, reload };
}
