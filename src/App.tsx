/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SUPPLEMENT_PRODUCTS } from './data/supplements';
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

  const categories: CategoryType[] = ['Creatina', 'Proteína', 'Pre-Entreno', 'Multivitamínico', 'Magnesio'];

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

  // Filtered Products for Directory
  const filteredProducts = SUPPLEMENT_PRODUCTS.filter((prod) => {
    if (filters.category !== 'All' && prod.category !== filters.category) return false;
    if (filters.purityCertifiedOnly && !prod.isPurityCertified) return false;
    if (filters.dietaryNeed && !prod.dietaryTags.includes(filters.dietaryNeed)) return false;
    if (filters.minScore > 0 && prod.nutriScore < filters.minScore) return false;
    if (filters.searchQuery.trim()) {
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

  const comparedProducts = SUPPLEMENT_PRODUCTS.filter((p) => comparisonIds.includes(p.id));
  const selectedProduct = SUPPLEMENT_PRODUCTS.find((p) => p.id === selectedProductId) || SUPPLEMENT_PRODUCTS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e]">
      
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        products={SUPPLEMENT_PRODUCTS}
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
              totalProductsCount={SUPPLEMENT_PRODUCTS.length}
              filteredCount={filteredProducts.length}
            />
            <div className="flex-1">
              <DirectoryView
                products={filteredProducts}
                onSelectProduct={handleSelectProduct}
                onToggleCompare={handleToggleCompare}
                comparisonIds={comparisonIds}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        )}

        {currentView === 'comparador' && (
          <ComparisonView
            products={comparedProducts}
            allProducts={SUPPLEMENT_PRODUCTS}
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
            products={SUPPLEMENT_PRODUCTS}
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
