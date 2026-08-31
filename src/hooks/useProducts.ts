/**
 * src/hooks/useProducts.ts
 * 
 * Hook de React para cargar suplementos desde la API de Neon PostgreSQL.
 * Incluye fallback automático al dataset mockup si la BD no está disponible.
 */

import { useState, useEffect, useCallback } from 'react';
import type { SupplementProduct, ActiveFilters } from '../types';
import { SUPPLEMENT_PRODUCTS as MOCK_PRODUCTS } from '../data/supplements';

interface ProductsApiResponse {
  data: SupplementProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface UseProductsResult {
  products: SupplementProduct[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  usingMockData: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function useProducts(filters: ActiveFilters): UseProductsResult {
  const [products, setProducts] = useState<SupplementProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  // Función principal de carga desde API
  const fetchFromAPI = useCallback(async (currentPage: number, append = false) => {
    setLoading(true);
    setError(null);

    // Construir query params desde los filtros activos
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters.searchQuery?.trim()) params.set('search', filters.searchQuery.trim());
    if (filters.purityCertifiedOnly) params.set('purityCertified', 'true');
    if (filters.minScore > 0) params.set('minScore', String(filters.minScore));
    if (filters.dietaryNeed) {
      const dietSlug = filters.dietaryNeed.toLowerCase().replace(/\s+/g, '-');
      params.set('diet', dietSlug);
    }
    if (filters.novaGroup) params.set('nova', String(filters.novaGroup));
    params.set('page', String(currentPage));
    params.set('limit', '24');

    try {
      const response = await fetch(`/api/products/list?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ProductsApiResponse = await response.json();

      if (!json.data || json.data.length === 0 && currentPage === 1) {
        // La BD está vacía o aún se está llenando → usar mockup
        console.info('[useProducts] BD vacía, usando datos de demostración.');
        fallbackToMock();
        return;
      }

      setUsingMockData(false);
      setTotal(json.meta.total);
      setHasMore(json.meta.hasMore);

      if (append) {
        setProducts((prev) => [...prev, ...json.data]);
      } else {
        setProducts(json.data);
      }
    } catch (err) {
      console.warn('[useProducts] API no disponible, usando datos de demostración:', err);
      fallbackToMock();
    } finally {
      setLoading(false);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback automático al dataset mockup (supplements.ts)
  const fallbackToMock = useCallback(() => {
    setUsingMockData(true);
    const filtered = MOCK_PRODUCTS.filter((prod) => {
      if (filters.category !== 'All' && prod.category !== filters.category) return false;
      if (filters.purityCertifiedOnly && !prod.isPurityCertified) return false;
      if (filters.dietaryNeed && !prod.dietaryTags.includes(filters.dietaryNeed)) return false;
      if (filters.minScore > 0 && prod.nutriScore < filters.minScore) return false;
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          prod.name.toLowerCase().includes(q) ||
          prod.brand.toLowerCase().includes(q) ||
          prod.category.toLowerCase().includes(q) ||
          prod.certifications.some((c) => c.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
    setProducts(filtered);
    setTotal(filtered.length);
    setHasMore(false);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resetear y recargar cuando cambian los filtros
  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchFromAPI(1, false);
  }, [
    filters.category,
    filters.searchQuery,
    filters.purityCertifiedOnly,
    filters.minScore,
    filters.dietaryNeed,
    filters.novaGroup,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar más páginas (infinite scroll / botón "Ver más")
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFromAPI(nextPage, true);
    }
  }, [loading, hasMore, page, fetchFromAPI]);

  const refresh = useCallback(() => {
    setPage(1);
    fetchFromAPI(1, false);
  }, [fetchFromAPI]);

  return {
    products,
    loading,
    error,
    total,
    hasMore,
    usingMockData,
    loadMore,
    refresh,
  };
}
