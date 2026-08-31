/**
 * src/components/GlobalSearchModal.tsx
 * 
 * Modal de Búsqueda Global (Command Palette / Spotlight).
 * Busca directamente en la API de Neon con debounce — no solo los productos de la página actual.
 * Accesible con atajo de teclado Ctrl+K / Cmd+K o desde el Header.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Scale, ArrowRight, Loader2 } from 'lucide-react';
import type { SupplementProduct } from '../types';
import { getNutriScoreColorClass, formatCurrency } from '../utils/nutriscore';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: SupplementProduct[]; // fallback para cuando la API no está disponible
  onSelectProduct: (id: string) => void;
  onToggleCompare: (id: string) => void;
  comparisonIds: string[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products: fallbackProducts,
  onSelectProduct,
  onToggleCompare,
  comparisonIds,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [results, setResults] = useState<SupplementProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus al abrir y limpiar al cerrar
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // Mostrar todos los productos al abrir (sin filtro)
      setResults(fallbackProducts.slice(0, 30));
    } else {
      setSearchTerm('');
      setSelectedCategory('All');
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Búsqueda con debounce — consulta la API de Neon directamente
  const fetchResults = useCallback(async (term: string, category: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (term.trim()) params.set('search', term.trim());
      if (category !== 'All') params.set('category', category);
      params.set('limit', '40');
      params.set('page', '1');

      const response = await fetch(`/api/products/list?${params.toString()}`);
      if (!response.ok) throw new Error('API error');

      const json = await response.json();
      if (json.data && json.data.length > 0) {
        setResults(json.data);
      } else {
        // Fallback: filtrar los productos locales si la API falla o está vacía
        const clean = term.toLowerCase().trim();
        const filtered = fallbackProducts.filter((p) => {
          const matchCat = category === 'All' || p.category.toLowerCase() === category.toLowerCase();
          if (!matchCat) return false;
          if (!clean) return true;
          return (
            p.name.toLowerCase().includes(clean) ||
            p.brand.toLowerCase().includes(clean) ||
            p.category.toLowerCase().includes(clean)
          );
        });
        setResults(filtered.slice(0, 40));
      }
    } catch {
      // En caso de error (vercel dev no activo, etc.) usar fallback local
      const clean = term.toLowerCase().trim();
      const filtered = fallbackProducts.filter((p) => {
        const matchCat = category === 'All' || p.category.toLowerCase() === category.toLowerCase();
        if (!matchCat) return false;
        if (!clean) return true;
        return (
          p.name.toLowerCase().includes(clean) ||
          p.brand.toLowerCase().includes(clean) ||
          p.category.toLowerCase().includes(clean)
        );
      });
      setResults(filtered.slice(0, 40));
    } finally {
      setLoading(false);
    }
  }, [fallbackProducts]);

  // Disparar búsqueda al cambiar término o categoría (debounce 300ms)
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(searchTerm, selectedCategory);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, selectedCategory, isOpen, fetchResults]);

  if (!isOpen) return null;

  const categories = ['All', 'Creatina', 'Proteína', 'Pre-Entreno', 'Magnesio', 'Multivitamínico', 'Omega-3', 'Aminoácidos'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-[#e0e3e5] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#e0e3e5] flex items-center gap-3">
          {loading
            ? <Loader2 className="w-5 h-5 text-[#006c49] animate-spin shrink-0" />
            : <Search className="w-5 h-5 text-[#006c49] shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por suplemento, marca (Optimum, HSN, Prozis), sello (Creapure®)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-base sm:text-lg text-[#191c1e] placeholder-[#76777d] bg-transparent outline-none font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-lg hover:bg-[#f2f4f6] text-[#76777d] hover:text-[#191c1e] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#f2f4f6] text-[#45464d] hover:bg-[#e0e3e5] cursor-pointer shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#f8fafc] border-b border-[#e0e3e5] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'bg-white text-[#45464d] hover:bg-[#eceef0] border border-[#e0e3e5]'
              }`}
            >
              {cat === 'All' ? 'Todas las categorías' : cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#f2f4f6]">
          {loading && results.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Loader2 className="w-8 h-8 text-[#006c49] animate-spin mx-auto" />
              <p className="text-sm text-[#76777d]">Buscando en toda la base de datos...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((product) => {
              const scoreStyle = getNutriScoreColorClass(product.nutriScore);
              const isCompared = comparisonIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  className="py-2.5 first:pt-0 flex items-center justify-between gap-4 px-2 rounded-2xl hover:bg-[#f8fafc] transition-colors group cursor-pointer"
                  onClick={() => {
                    onSelectProduct(product.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-contain bg-white border border-[#e0e3e5] p-1 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-[#76777d] uppercase tracking-wider truncate">
                          {product.brand}
                        </span>
                        <span className="text-[10px] text-[#006c49] font-semibold bg-[#6cf8bb]/30 px-2 py-0.5 rounded-full">
                          {product.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#191c1e] truncate group-hover:text-[#006c49] transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#76777d] mt-0.5">
                        {product.price > 0 ? (
                          <span className="font-bold text-[#191c1e] font-data-tabular">
                            {formatCurrency(product.price)}
                          </span>
                        ) : (
                          <span className="text-[#76777d] italic">Ver precio</span>
                        )}
                        <span>•</span>
                        <span>{product.purityPct}% Pureza</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`w-9 h-9 rounded-xl ${scoreStyle.bg} ${scoreStyle.text} flex items-center justify-center font-bold text-xs font-data-tabular`}>
                      {product.nutriScore}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(product.id);
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        isCompared
                          ? 'bg-[#006c49] text-white border-[#006c49]'
                          : 'bg-white text-[#45464d] hover:bg-[#f2f4f6] border-[#e0e3e5]'
                      }`}
                      title={isCompared ? 'En comparativa' : 'Comparar'}
                    >
                      <Scale className="w-4 h-4" />
                    </button>

                    <ArrowRight className="w-4 h-4 text-[#76777d] group-hover:text-[#006c49] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-[#191c1e]">No se encontraron suplementos</p>
              <p className="text-xs text-[#76777d]">
                Prueba con otro término de búsqueda o selecciona "Todas las categorías".
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#f8fafc] border-t border-[#e0e3e5] flex items-center justify-between text-xs text-[#76777d] px-5">
          <span>
            {loading ? 'Buscando...' : `${results.length} resultados`}
            {!searchTerm && !loading && ' — escribe para buscar en toda la base de datos'}
          </span>
          <span className="hidden sm:inline">ESC para cerrar • clic para ver ficha</span>
        </div>
      </div>
    </div>
  );
};
