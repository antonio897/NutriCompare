import React, { useState } from 'react';
import { 
  Search, 
  Layers, 
  Award, 
  BookOpen, 
  FlaskConical, 
  Scale, 
  X, 
  ExternalLink, 
  Menu,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { SupplementProduct } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  products: SupplementProduct[];
  comparisonIds: string[];
  onSelectProduct: (productId: string) => void;
  onToggleCompare: (productId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSearchModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  products,
  comparisonIds,
  onSelectProduct,
  onToggleCompare,
  searchQuery,
  onSearchChange,
  onOpenSearchModal,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredSearchResults = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.certifications.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-[#f7f9fb] border-b border-[#e0e3e5] backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onNavigate('directorio')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#006c49] flex items-center justify-center text-white shadow-sm group-hover:bg-[#005236] transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-[#191c1e] block leading-none">
                  Nutri<span className="text-[#006c49]">Compare</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#76777d] block mt-0.5">
                  Datos de Grado Clínico
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('directorio')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'directorio'
                    ? 'bg-[#eceef0] text-[#191c1e] font-semibold'
                    : 'text-[#45464d] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                Directorio
              </button>
              <button
                onClick={() => onNavigate('rankings')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'rankings'
                    ? 'bg-[#eceef0] text-[#191c1e] font-semibold'
                    : 'text-[#45464d] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                <Award className="w-4 h-4 text-[#006c49]" />
                Rankings
              </button>
              <button
                onClick={() => onNavigate('metodos')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'metodos'
                    ? 'bg-[#eceef0] text-[#191c1e] font-semibold'
                    : 'text-[#45464d] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-[#565e74]" />
                Métodos
              </button>
              <button
                onClick={() => onNavigate('blog')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'blog'
                    ? 'bg-[#eceef0] text-[#191c1e] font-semibold'
                    : 'text-[#45464d] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#76777d]" />
                Blog
              </button>
            </nav>
          </div>

          {/* Search Bar & Actions */}
          <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
            <div 
              className="relative w-full max-w-xs cursor-pointer"
              onClick={() => onOpenSearchModal && onOpenSearchModal()}
            >
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-[#76777d] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar marcas, ingredientes..."
                  value={searchQuery}
                  readOnly={Boolean(onOpenSearchModal)}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => {
                    if (onOpenSearchModal) onOpenSearchModal();
                    else setIsSearchFocused(true);
                  }}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full bg-[#f2f4f6] text-sm text-[#191c1e] placeholder-[#76777d] pl-9 pr-14 py-1.5 rounded-lg border border-transparent focus:border-[#006c49] focus:bg-white focus:outline-none transition-all cursor-pointer"
                />
                <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-semibold text-[#76777d] bg-white border border-[#e0e3e5] rounded shadow-2xs">
                  Ctrl K
                </kbd>
              </div>

              {/* Instant Search Dropdown */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-[#e0e3e5] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {filteredSearchResults.length > 0 ? (
                    <div className="py-1 divide-y divide-[#f2f4f6]">
                      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-[#76777d] tracking-wider bg-[#f8fafc]">
                        Resultados encontrados ({filteredSearchResults.length})
                      </div>
                      {filteredSearchResults.map((prod) => (
                        <div
                          key={prod.id}
                          className="px-3 py-2 hover:bg-[#f2f4f6] cursor-pointer flex items-center justify-between gap-2 transition-colors"
                          onMouseDown={() => {
                            onSelectProduct(prod.id);
                            setIsSearchFocused(false);
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={prod.image} 
                              alt={prod.name} 
                              className="w-8 h-8 rounded object-contain bg-[#eceef0] p-0.5"
                            />
                            <div className="truncate">
                              <p className="text-xs font-semibold text-[#191c1e] truncate">{prod.name}</p>
                              <p className="text-[11px] text-[#76777d]">{prod.brand} • {prod.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold text-[#006c49] bg-[#6cf8bb]/30 px-1.5 py-0.5 rounded font-data-tabular">
                              {prod.nutriScore}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#76777d]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[#76777d]">
                      No se encontraron suplementos para "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comparison Quick Button */}
            <button
              onClick={() => onNavigate('comparador')}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                comparisonIds.length > 0
                  ? 'bg-[#006c49] text-white shadow-sm hover:bg-[#005236]'
                  : 'bg-[#eceef0] text-[#45464d] hover:bg-[#e0e3e5]'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">Comparador</span>
              {comparisonIds.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#6cf8bb] text-[#002113] font-bold text-[11px] flex items-center justify-center font-data-tabular">
                  {comparisonIds.length}
                </span>
              )}
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-[#45464d] hover:bg-[#eceef0]"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#e0e3e5] py-2 px-1 flex flex-col gap-1 animate-in fade-in duration-150">
            <button
              onClick={() => { onNavigate('directorio'); setMobileMenuOpen(false); }}
              className="px-3 py-2 text-left text-sm font-medium rounded-lg hover:bg-[#eceef0] flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-[#76777d]" />
              Directorio de Suplementos
            </button>
            <button
              onClick={() => { onNavigate('rankings'); setMobileMenuOpen(false); }}
              className="px-3 py-2 text-left text-sm font-medium rounded-lg hover:bg-[#eceef0] flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-[#006c49]" />
              Rankings Top
            </button>
            <button
              onClick={() => { onNavigate('metodos'); setMobileMenuOpen(false); }}
              className="px-3 py-2 text-left text-sm font-medium rounded-lg hover:bg-[#eceef0] flex items-center gap-2"
            >
              <FlaskConical className="w-4 h-4 text-[#565e74]" />
              Métodos & Algoritmo
            </button>
            <button
              onClick={() => { onNavigate('blog'); setMobileMenuOpen(false); }}
              className="px-3 py-2 text-left text-sm font-medium rounded-lg hover:bg-[#eceef0] flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#76777d]" />
              Blog & Ciencia
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
