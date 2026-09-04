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
  ChevronRight,
  Trophy
} from 'lucide-react';
import { SupplementProduct, ActiveFilters } from '../types';
import { getNutriScoreColorClass } from '../utils/nutriscore';
import { normalizeProductRanks } from '../utils/productRanking';

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
  const itemsPerPage = 12;

  const normalizedProducts = normalizeProductRanks(products);

  // Sorting
  const sortedProducts = [...normalizedProducts].sort((a, b) => {
    if (filters.sortBy === 'popular') {
      // Popularidad real por volumen de compras/opiniones de clientes y valoración
      const reviewsA = (a.ratingsTotal ?? 0) * (a.rating ?? 4);
      const reviewsB = (b.ratingsTotal ?? 0) * (b.rating ?? 4);
      if (reviewsA !== reviewsB) return reviewsB - reviewsA;
      return b.nutriScore - a.nutriScore;
    }
    if (filters.sortBy === 'bestsellers') {
      // Posición oficial en el ranking de ventas de Amazon
      const rankA = a.bestsellerRank ?? a.rank ?? 9999;
      const rankB = b.bestsellerRank ?? b.rank ?? 9999;
      if (rankA !== rankB) return rankA - rankB;
      return (b.ratingsTotal ?? 0) - (a.ratingsTotal ?? 0);
    }
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
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#191c1e]">
            Mostrando <span className="font-bold text-[#006c49] font-data-tabular">{sortedProducts.length}</span> suplementos analizados
          </span>

          <button
            onClick={() => onFilterChange({ bestsellersOnly: !filters.bestsellersOnly })}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
              filters.bestsellersOnly
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-[#f8fafc] text-[#45464d] hover:bg-amber-50 hover:text-amber-700 border-[#e0e3e5]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Solo Más Vendidos
          </button>
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
            <option value="bestsellers">🏆 Más Vendidos (Amazon)</option>
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
                    {/* Ranking Badge — shown for all ranked products */}
                    {(prod.bestsellerRank || prod.rank) && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide shadow-sm uppercase ${
                          (prod.bestsellerRank || prod.rank || 99) <= 3
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                            : (prod.bestsellerRank || prod.rank || 99) <= 10
                            ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white'
                            : 'bg-white/90 text-[#191c1e] border border-[#e0e3e5]'
                        }`}>
                          {(prod.bestsellerRank || prod.rank || 99) <= 3 && <Trophy className="w-3 h-3 text-amber-100" />}
                          <span>#{prod.bestsellerRank || prod.rank}</span>
                          <span className="opacity-70">Amazon</span>
                        </div>
                      </div>
                    )}

                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const cat = prod.category?.toLowerCase() ?? '';
                        if (cat.includes('creatin')) {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80';
                        } else if (cat.includes('prote')) {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80';
                        } else if (cat.includes('magnes')) {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
                        } else if (cat.includes('omega')) {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&auto=format&fit=crop&q=80';
                        } else if (cat.includes('pre-') || cat.includes('preworkout')) {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80';
                        } else if (cat.includes('vitamin') || cat.includes('mineral')) {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80';
                        } else {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80';
                        }
                      }}
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
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#76777d] font-label-caps">
                        {prod.brand}
                      </span>
                      {prod.rating && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{prod.rating.toFixed(1)}</span>
                          {prod.ratingsTotal && (
                            <span className="text-[#76777d] font-normal text-[10px]">
                              ({prod.ratingsTotal > 999 ? `${(prod.ratingsTotal / 1000).toFixed(1)}k` : prod.ratingsTotal})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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

                  {/* Certifications, NOVA & Dietary badges */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {prod.novaGroup && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        prod.novaGroup === 1 ? 'bg-emerald-100 text-emerald-800' :
                        prod.novaGroup === 2 ? 'bg-blue-100 text-blue-800' :
                        prod.novaGroup === 3 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        NOVA {prod.novaGroup}
                      </span>
                    )}
                    {prod.certifications.slice(0, 1).map((cert) => (
                      <span key={cert} className="text-[10px] font-semibold bg-[#dae2fd] text-[#131b2e] px-2 py-0.5 rounded">
                        {cert}
                      </span>
                    ))}
                    {prod.dietaryTags.slice(0, 2).map((tag) => (
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

                  {/* Enlace directo a Amazon con afiliado */}
                  {(prod.sourceUrl || prod.asin) && (
                    <a
                      href={prod.sourceUrl || `https://www.amazon.es/dp/${prod.asin}?tag=nutricompare-21`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-[#FF9900]/10 text-[#b56a00] hover:bg-[#FF9900]/20 border border-[#FF9900]/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Ver en Amazon.es"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Amazon</span>
                    </a>
                  )}

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
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#76777d] font-medium order-2 sm:order-1">
            Página <span className="font-bold text-[#191c1e]">{currentPage}</span> de <span className="font-bold text-[#191c1e]">{totalPages}</span>
            <span className="hidden md:inline"> ({sortedProducts.length} productos)</span>
          </div>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl border border-[#e0e3e5] text-xs font-semibold text-[#45464d] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-1">
              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push('ellipsis-start');

                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);

                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }

                  if (currentPage < totalPages - 2) pages.push('ellipsis-end');
                  pages.push(totalPages);
                }

                return pages.map((p, idx) => {
                  if (typeof p === 'string') {
                    return (
                      <span key={`ellipsis-${idx}`} className="w-8 text-center text-xs text-[#76777d]">
                        …
                      </span>
                    );
                  }

                  const isCurrent = currentPage === p;
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setCurrentPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#006c49] text-white shadow-xs font-bold scale-105'
                          : 'text-[#45464d] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                });
              })()}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl border border-[#e0e3e5] text-xs font-semibold text-[#45464d] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="hidden xs:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
