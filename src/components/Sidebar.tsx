import React from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Heart, 
  Award, 
  History, 
  X, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { CategoryType, ActiveFilters } from '../types';

interface SidebarProps {
  filters: ActiveFilters;
  onFilterChange: (newFilters: Partial<ActiveFilters>) => void;
  onResetFilters: () => void;
  categories: CategoryType[];
  totalProductsCount: number;
  filteredCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  totalProductsCount,
  filteredCount,
}) => {
  const dietaryOptions = ['Sin Gluten', 'Vegano', 'Sin Lactosa', 'Cero Azúcar', '100% Natural'];

  const hasActiveFilters = 
    filters.category !== 'All' || 
    filters.purityCertifiedOnly || 
    Boolean(filters.dietaryNeed) || 
    filters.minScore > 0 || 
    Boolean(filters.searchQuery);

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
      
      {/* Quick Navigation Sections */}
      <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-sm space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#76777d] px-3 mb-2 font-label-caps">
          Explorar Catálogo
        </p>

        <button
          onClick={() => onFilterChange({ category: 'All', purityCertifiedOnly: false, dietaryNeed: undefined })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            filters.category === 'All' && !filters.purityCertifiedOnly && !filters.dietaryNeed
              ? 'bg-[#eceef0] text-[#191c1e] font-semibold'
              : 'text-[#45464d] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#565e74]" />
            Todos los Suplementos
          </span>
          <span className="text-xs font-data-tabular text-[#76777d] bg-[#f2f4f6] px-2 py-0.5 rounded-full">
            {totalProductsCount}
          </span>
        </button>

        <button
          onClick={() => onFilterChange({ purityCertifiedOnly: !filters.purityCertifiedOnly })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            filters.purityCertifiedOnly
              ? 'bg-[#6cf8bb]/30 text-[#00714d] font-semibold'
              : 'text-[#45464d] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#006c49]" />
            Pureza Certificada
          </span>
          <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
        </button>

        <button
          onClick={() => onFilterChange({ minScore: filters.minScore === 9.0 ? 0 : 9.0 })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            filters.minScore >= 9.0
              ? 'bg-[#dae2fd] text-[#131b2e] font-semibold'
              : 'text-[#45464d] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-[#565e74]" />
            NutriScore Grado A+ (≥9.0)
          </span>
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#76777d] font-label-caps flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros Activos
            </span>
            <button
              onClick={onResetFilters}
              className="text-xs text-[#006c49] font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filters.category && filters.category !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#eceef0] text-[#191c1e]">
                Tipo: {filters.category}
                <button 
                  onClick={() => onFilterChange({ category: 'All' })}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.purityCertifiedOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#6cf8bb]/40 text-[#005236]">
                Certificados Lab
                <button 
                  onClick={() => onFilterChange({ purityCertifiedOnly: false })}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.minScore > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#dae2fd] text-[#131b2e]">
                Score &ge; {filters.minScore.toFixed(1)}
                <button 
                  onClick={() => onFilterChange({ minScore: 0 })}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.dietaryNeed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f2f4f6] text-[#45464d]">
                {filters.dietaryNeed}
                <button 
                  onClick={() => onFilterChange({ dietaryNeed: undefined })}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.novaGroup && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800">
                NOVA {filters.novaGroup}
                <button 
                  onClick={() => onFilterChange({ novaGroup: undefined })}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f2f4f6] text-[#45464d]">
                "{filters.searchQuery}"
                <button 
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-sm space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#76777d] font-label-caps">
          Categoría
        </p>
        <div className="space-y-1">
          <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f2f4f6] cursor-pointer text-sm">
            <input
              type="radio"
              name="category"
              checked={filters.category === 'All'}
              onChange={() => onFilterChange({ category: 'All' })}
              className="text-[#006c49] focus:ring-[#006c49]"
            />
            <span className="text-[#191c1e]">Todas las categorías</span>
          </label>
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f2f4f6] cursor-pointer text-sm">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat}
                onChange={() => onFilterChange({ category: cat })}
                className="text-[#006c49] focus:ring-[#006c49]"
              />
              <span className="text-[#191c1e]">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Dietary Needs Filter */}
      <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-sm space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#76777d] font-label-caps">
          Requisitos Dietéticos
        </p>
        <div className="flex flex-wrap gap-1.5">
          {dietaryOptions.map((diet) => {
            const isSelected = filters.dietaryNeed === diet;
            return (
              <button
                key={diet}
                onClick={() => onFilterChange({ dietaryNeed: isSelected ? undefined : diet })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'bg-[#f2f4f6] text-[#45464d] hover:bg-[#eceef0]'
                }`}
              >
                {diet}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grado de Procesamiento NOVA */}
      <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#76777d] font-label-caps">
            Grado NOVA (Procesamiento)
          </p>
          {filters.novaGroup && (
            <button
              onClick={() => onFilterChange({ novaGroup: undefined })}
              className="text-[10px] text-[#006c49] font-medium hover:underline"
            >
              Borrar
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { group: 1, label: 'NOVA 1: Puro', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
            { group: 2, label: 'NOVA 2: Simple', color: 'border-blue-500 text-blue-700 bg-blue-50' },
            { group: 3, label: 'NOVA 3: Procesado', color: 'border-amber-500 text-amber-700 bg-amber-50' },
            { group: 4, label: 'NOVA 4: Ultra', color: 'border-red-500 text-red-700 bg-red-50' },
          ].map((item) => {
            const isSelected = filters.novaGroup === item.group;
            return (
              <button
                key={item.group}
                onClick={() => onFilterChange({ novaGroup: isSelected ? undefined : item.group })}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  isSelected
                    ? 'bg-[#131b2e] text-white border-[#131b2e] shadow-xs'
                    : `${item.color} hover:opacity-80`
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimum Score Slider */}
      <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-[#76777d] font-label-caps">
            Puntuación Mínima
          </span>
          <span className="font-bold font-data-tabular text-[#006c49]">
            &ge; {filters.minScore > 0 ? filters.minScore.toFixed(1) : 'Cualquiera'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="9.5"
          step="0.5"
          value={filters.minScore}
          onChange={(e) => onFilterChange({ minScore: parseFloat(e.target.value) })}
          className="w-full accent-[#006c49] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#76777d] font-data-tabular">
          <span>0.0</span>
          <span>7.0 (B)</span>
          <span>8.5 (A)</span>
          <span>9.5 (A+)</span>
        </div>
      </div>

    </aside>
  );
};
