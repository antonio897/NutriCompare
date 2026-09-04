/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useProducts } from './hooks/useProducts';
import { BLOG_ARTICLES } from './data/blogArticles';
import { ActiveFilters, CategoryType } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DirectoryView } from './components/DirectoryView';
import { ComparisonView } from './components/ComparisonView';
import { ProductDetailView } from './components/ProductDetailView';
import { RankingsView } from './components/RankingsView';
import { MethodsView } from './components/MethodsView';
import { BlogView } from './components/BlogView';
import { ComparisonFloatingBar } from './components/ComparisonFloatingBar';
import { ShareModal } from './components/ShareModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { Footer } from './components/Footer';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<string>('directorio');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Lista de comparación dinámica (inicialmente vacía o con los seleccionados)
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [comparisonCache, setComparisonCache] = useState<Record<string, any>>({});

  // Search Modal & Share Modal State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<ActiveFilters>({
    category: 'All',
    purityCertifiedOnly: false,
    dietaryNeed: undefined,
    minScore: 0,
    searchQuery: '',
    sortBy: 'popular',
  });

  // Carga reactiva: cuando cambian los filtros, la API devuelve los datos actualizados
  const { products: dbProducts, loading, usingMockData, total: dbTotal, hasMore, loadMore } = useProducts(filters);

  // Atajo global de teclado Ctrl+K / Cmd+K para abrir buscador global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actualizar caché de productos para que los comparados no se pierdan al paginar
  useEffect(() => {
    if (dbProducts.length > 0) {
      setComparisonCache(prev => {
        const next = { ...prev };
        dbProducts.forEach(p => { next[p.id] = p; });
        return next;
      });
    }
  }, [dbProducts]);

  const categories: CategoryType[] = ['Creatina', 'Proteína', 'BCAA', 'Magnesio', 'Omega-3', 'Pre-Entreno', 'Multivitamínico'];

  // Toggle supplement in comparison (máximo 4)
  const handleToggleCompare = (id: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRemoveFromCompare = (id: string) => {
    setComparisonIds((prev) => prev.filter((item) => item !== id));
  };

  const handleAddToCompare = (id: string) => {
    setComparisonIds((prev) => (prev.includes(id) || prev.length >= 4 ? prev : [...prev, id]));
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    setCurrentView('producto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (newFilters: Partial<ActiveFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    if (currentView !== 'directorio') {
      setCurrentView('directorio');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'All',
      purityCertifiedOnly: false,
      dietaryNeed: undefined,
      minScore: 0,
      searchQuery: '',
      sortBy: 'popular',
    });
  };

  // Los filtros los gestiona el hook useProducts (API) o el fallback mockup
  const filteredProducts = [...dbProducts].sort((a, b) => {
    if (filters.sortBy === 'price-asc') return a.price - b.price;
    if (filters.sortBy === 'price-desc') return b.price - a.price;
    if (filters.sortBy === 'score') return b.nutriScore - a.nutriScore;
    return b.nutriScore - a.nutriScore; // 'popular' → por score descendente
  });

  // Reconstruir lista de comparados desde la caché para no perderlos al filtrar o paginar
  const comparedProducts = comparisonIds
    .map(id => comparisonCache[id] || dbProducts.find(p => p.id === id))
    .filter(Boolean);

  const selectedProduct = (selectedProductId ? (comparisonCache[selectedProductId] || dbProducts.find((p) => p.id === selectedProductId)) : null) || dbProducts[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e]">
      
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        products={dbProducts}
        comparisonIds={comparisonIds}
        onSelectProduct={handleSelectProduct}
        onToggleCompare={handleToggleCompare}
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => handleFilterChange({ searchQuery: q })}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'directorio' && (
          <div className="flex flex-col lg:flex-row gap-8">
            <Sidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              categories={categories}
              totalProductsCount={dbTotal || dbProducts.length}
              filteredCount={filteredProducts.length}
            />
            <div className="flex-1">
              {/* Banner de origen de datos */}
              {!loading && usingMockData && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <span>⚠️</span>
                  <span><strong>Datos de demostración</strong> — La base de datos aún se está poblando. Los datos reales aparecerán automáticamente en cuanto termine la ingesta.</span>
                </div>
              )}
              {!loading && !usingMockData && dbTotal > 0 && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                  <span>✅</span>
                  <span><strong>{dbTotal.toLocaleString('es-ES')} suplementos reales</strong> cargados desde tu base de datos PostgreSQL.</span>
                </div>
              )}
              {loading && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                  <span className="animate-spin">⏳</span>
                  <span>Consultando base de datos...</span>
                </div>
              )}
              <DirectoryView
                products={filteredProducts}
                onSelectProduct={handleSelectProduct}
                onToggleCompare={handleToggleCompare}
                comparisonIds={comparisonIds}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
              {/* Botón "Ver más" para paginación */}
              {hasMore && !loading && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={loadMore}
                    className="px-8 py-3 rounded-full bg-[#006c49] text-white font-semibold hover:bg-[#005a3c] transition-colors shadow-md"
                  >
                    Cargar más suplementos
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'comparador' && (
          <ComparisonView
            products={comparedProducts}
            allProducts={dbProducts}
            onRemoveFromCompare={handleRemoveFromCompare}
            onAddToCompare={handleAddToCompare}
            onSelectProduct={handleSelectProduct}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'producto' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onBack={() => setCurrentView('directorio')}
            isInCompare={comparisonIds.includes(selectedProduct.id)}
            onToggleCompare={handleToggleCompare}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onNavigateToCategory={(cat) => {
              handleFilterChange({ category: cat as CategoryType });
              setCurrentView('directorio');
            }}
          />
        )}
        {currentView === 'producto' && !selectedProduct && !loading && (
          <div className="text-center py-20 text-[#76777d]">
            <p className="text-lg font-semibold">Producto no encontrado</p>
            <button
              onClick={() => setCurrentView('directorio')}
              className="mt-4 px-6 py-2 rounded-full bg-[#006c49] text-white font-semibold hover:bg-[#005a3c] transition-colors"
            >
              Volver al directorio
            </button>
          </div>
        )}

        {currentView === 'rankings' && (
          <RankingsView
            products={dbProducts}
            onSelectProduct={handleSelectProduct}
            onToggleCompare={handleToggleCompare}
            comparisonIds={comparisonIds}
          />
        )}

        {currentView === 'metodos' && (
          <MethodsView />
        )}

        {currentView === 'blog' && (
          <BlogView articles={BLOG_ARTICLES} />
        )}
      </main>

      {/* Bottom Floating Comparison Bar (when not in full comparison view) */}
      {currentView !== 'comparador' && (
        <ComparisonFloatingBar
          comparedProducts={comparedProducts}
          onRemove={handleRemoveFromCompare}
          onClear={() => setComparisonIds([])}
          onOpenCompare={() => {
            setCurrentView('comparador');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        products={dbProducts}
        onSelectProduct={handleSelectProduct}
        onToggleCompare={handleToggleCompare}
        comparisonIds={comparisonIds}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        products={comparedProducts.length > 0 ? comparedProducts : (selectedProduct ? [selectedProduct] : [])}
      />

      {/* Global Footer */}
      <Footer
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
}
