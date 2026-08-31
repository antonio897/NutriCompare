/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { Footer } from './components/Footer';

export default function App() {
  // 🔌 Carga de productos desde Neon PostgreSQL (con fallback automático al mockup)
  // Navigation & View State
  const [currentView, setCurrentView] = useState<string>('directorio');
  const [selectedProductId, setSelectedProductId] = useState<string | null>('creature-creapure');

  // Pre-seed comparison with the 3 creatines from user screenshot
  const [comparisonIds, setComparisonIds] = useState<string[]>([
    'creature-creapure',
    'micronized-creatine-bulk',
    'standard-creatine-generic',
  ]);

  // Share Modal State
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

  const categories: CategoryType[] = ['Creatina', 'Proteína', 'Pre-Entreno', 'Multivitamínico', 'Magnesio', 'Omega-3', 'Aminoácidos'];

  // Toggle supplement in comparison
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
  // El filtro de sortBy se aplica en cliente para no añadir latencia extra
  const filteredProducts = [...dbProducts].sort((a, b) => {
    if (filters.sortBy === 'price-asc') return a.price - b.price;
    if (filters.sortBy === 'price-desc') return b.price - a.price;
    if (filters.sortBy === 'score') return b.nutriScore - a.nutriScore;
    return b.nutriScore - a.nutriScore; // 'popular' → por score descendente
  });

  const comparedProducts = dbProducts.filter((p) => comparisonIds.includes(p.id));
  const selectedProduct = dbProducts.find((p) => p.id === selectedProductId) || dbProducts[0];

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

        {currentView === 'producto' && (
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

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        products={comparedProducts.length > 0 ? comparedProducts : [selectedProduct]}
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
