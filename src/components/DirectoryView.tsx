import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  ArrowRight, 
  Star, 
  SlidersHorizontal, 
  Check, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SupplementProduct, ActiveFilters } from '../types';
import { getNutriScoreColorClass } from '../utils/nutriscore';

interface DirectoryViewProps {
  products: SupplementProduct[];
  onSelectProduct: (id: string) => void;
  onToggleCompare: (id: string) => void;
  comparisonIds: string[];
  filters: ActiveFilters;
  onFilterChange: (newFilters: Partial<ActiveFilters>) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  products,
  onSelectProduct,
  onToggleCompare,
  comparisonIds,
  filters,
  onFilterChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Sorting
  const sortedProducts = [...products].sort((a, b) => {
    if (filters.sortBy === 'score') return b.nutriScore - a.nutriScore;
    if (filters.sortBy === 'priceAsc') return a.costPerDose - b.costPerDose;
    if (filters.sortBy === 'purity') return b.purityPct - a.purityPct;
    return (a.rank || 99) - (b.rank || 99);
  });

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));
  const displayedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#191c1e]">
            Mostrando <span className="font-bold text-[#006c49] font-data-tabular">{sortedProducts.length}</span> suplementos analizados
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="text-xs text-[#76777d] font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Ordenar por:
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="bg-[#f2f4f6] text-xs font-medium text-[#191c1e] rounded-xl px-3 py-1.5 border border-transparent focus:border-[#006c49] focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="popular">Más Populares</option>
            <option value="score">Mejor NutriScore</option>
            <option value="priceAsc">Menor Coste / Dosis</option>
            <option value="purity">Mayor Pureza %</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {displayedProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedProducts.map((prod) => {
            const isCompared = comparisonIds.includes(prod.id);
            const scoreStyle = getNutriScoreColorClass(prod.nutriScore);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-3xl p-5 border border-[#e0e3e5] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top image box with score badge */}
                  <div className="relative aspect-square rounded-2xl bg-[#f8fafc] p-4 flex items-center justify-center mb-4 overflow-hidden border border-[#f2f4f6]">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* NutriScore Badge pill in top corner */}
                    <div className="absolute top-3 right-3">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${scoreStyle.badgeBg} ${scoreStyle.badgeText} shadow-xs font-data-tabular font-bold text-xs`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{prod.nutriScore}</span>
                      </div>
                    </div>

                    {/* Category tag */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#191c1e] px-2 py-0.5 rounded font-label-caps shadow-2xs">
                        {prod.category}
                      </span>
                    </div>
                  </div>

                  {/* Brand & Name */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#76777d] font-label-caps">
                      {prod.brand}
                    </span>
                    <h3 
                      onClick={() => onSelectProduct(prod.id)}
                      className="text-base font-bold text-[#191c1e] line-clamp-1 hover:text-[#006c49] cursor-pointer transition-colors"
                    >
                      {prod.name}
                    </h3>
                  </div>

                  {/* Specs row */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#f2f4f6] text-xs">
                    <div>
                      <span className="text-[#76777d] block text-[10px]">Pureza / Activo</span>
                      <span className="font-bold text-[#191c1e] font-data-tabular">{prod.purityPct}%</span>
                    </div>
                    <div>
                      <span className="text-[#76777d] block text-[10px]">Coste / Dosis</span>
                      <span className="font-bold text-[#006c49] font-data-tabular">
                        {prod.currency}{prod.costPerDose.toFixed(2)} / toma
                      </span>
                    </div>
                  </div>

                  {/* Certifications badges */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {prod.certifications.slice(0, 2).map((cert) => (
                      <span key={cert} className="text-[10px] font-semibold bg-[#dae2fd] text-[#131b2e] px-2 py-0.5 rounded">
                        {cert}
                      </span>
                    ))}
                    {prod.dietaryTags.slice(0, 1).map((tag) => (
                      <span key={tag} className="text-[10px] font-medium bg-[#f2f4f6] text-[#45464d] px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-[#e0e3e5] flex items-center gap-2">
                  <button
                    onClick={() => onSelectProduct(prod.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-semibold transition-colors text-center cursor-pointer"
                  >
                    Ver Ficha
                  </button>

                  <button
                    onClick={() => onToggleCompare(prod.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isCompared
                        ? 'bg-[#006c49] text-white border-[#006c49] shadow-xs'
                        : 'bg-white text-[#45464d] hover:bg-[#f2f4f6] border-[#e0e3e5]'
                    }`}
                    title={isCompared ? 'Quitar de la comparativa' : 'Añadir a la comparativa'}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isCompared ? 'Comparando' : 'Comparar'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#e0e3e5] shadow-xs">
          <p className="text-sm text-[#76777d]">
            No se encontraron suplementos con los filtros seleccionados.
          </p>
        </div>
      )}

      {/* Pagination Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-xs flex items-center justify-between">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          className="px-3 py-1.5 rounded-xl border border-[#e0e3e5] text-xs font-semibold text-[#45464d] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'text-[#45464d] hover:bg-[#f2f4f6]'
              }`}
            >
              {pageNum}
            </button>
          ))}
          <span className="text-xs text-[#76777d] px-1">... 12</span>
        </div>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          className="px-3 py-1.5 rounded-xl border border-[#e0e3e5] text-xs font-semibold text-[#45464d] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
