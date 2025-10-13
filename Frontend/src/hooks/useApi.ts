import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (endpoint: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(options?: UseApiOptions): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (endpoint: string, fetchOptions?: RequestInit): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(fetchOptions?.headers || {}),
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const url = endpoint.startsWith('http')
          ? endpoint
          : `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || 'Request failed');
        }

        setData(responseData);
        setLoading(false);
        options?.onSuccess?.(responseData);
        return responseData;
      } catch (err: any) {
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        setLoading(false);
        options?.onError?.(errorMessage);
        return null;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * Hook specifically for GET requests with auto-fetch
 */
export function useApiGet<T = any>(
  endpoint: string,
  options?: UseApiOptions & { autoFetch?: boolean; deps?: any[] }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Request failed');
      }

      setData(responseData);
      setLoading(false);
      options?.onSuccess?.(responseData);
      return responseData;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      options?.onError?.(errorMessage);
      return null;
    }
  }, [endpoint, options]);

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [options?.autoFetch, ...(options?.deps || [])]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute: refetch, refetch, reset };
}

/**
 * Hook for POST requests
 */
export function useApiPost<T = any>(options?: UseApiOptions) {
  const api = useApi<T>(options);

  const post = useCallback(
    (endpoint: string, body: any) => {
      return api.execute(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    [api.execute]
  );

  return { ...api, post };
}

/**
 * Hook for PUT requests
 */
export function useApiPut<T = any>(options?: UseApiOptions) {
  const api = useApi<T>(options);

  const put = useCallback(
    (endpoint: string, body: any) => {
      return api.execute(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    [api.execute]
  );

  return { ...api, put };
}

/**
 * Hook for PATCH requests
 */
export function useApiPatch<T = any>(options?: UseApiOptions) {
  const api = useApi<T>(options);

  const patch = useCallback(
    (endpoint: string, body?: any) => {
      return api.execute(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    [api.execute]
  );

  return { ...api, patch };
}

/**
 * Hook for DELETE requests
 */
export function useApiDelete<T = any>(options?: UseApiOptions) {
  const api = useApi<T>(options);

  const remove = useCallback(
    (endpoint: string) => {
      return api.execute(endpoint, {
        method: 'DELETE',
      });
    },
    [api.execute]
  );

  return { ...api, delete: remove };
}

/**
 * Hook for file uploads
 */
export function useApiUpload<T = any>(options?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (endpoint: string, formData: FormData): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const headers: HeadersInit = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const url = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || 'Upload failed');
        }

        setData(responseData);
        setLoading(false);
        options?.onSuccess?.(responseData);
        return responseData;
      } catch (err: any) {
        const errorMessage = err.message || 'Upload failed';
        setError(errorMessage);
        setLoading(false);
        options?.onError?.(errorMessage);
        return null;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, upload, reset };
}