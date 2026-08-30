import React from 'react';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import { SupplementProduct } from '../types';

interface ComparisonFloatingBarProps {
  comparedProducts: SupplementProduct[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpenCompare: () => void;
}

export const ComparisonFloatingBar: React.FC<ComparisonFloatingBarProps> = ({
  comparedProducts,
  onRemove,
  onClear,
  onOpenCompare,
}) => {
  if (comparedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 max-w-xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-[#131b2e] text-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-[#3f465c] flex items-center justify-between gap-4">
        
        {/* Thumbnails of selected products */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {comparedProducts.map((prod) => (
            <div 
              key={prod.id} 
              className="relative w-10 h-10 rounded-xl bg-white p-1 border border-[#3f465c] flex-shrink-0 group"
              title={prod.name}
            >
              <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(prod.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center text-[10px] hover:scale-110 transition-transform cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {comparedProducts.length < 4 && (
            <div className="w-10 h-10 rounded-xl border border-dashed border-[#7c839b] flex items-center justify-center text-[#7c839b] text-[11px] flex-shrink-0">
              +{4 - comparedProducts.length}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onClear}
            className="p-2 rounded-xl text-[#bec6e0] hover:text-white hover:bg-[#3f465c] transition-colors cursor-pointer"
            title="Vaciar comparativa"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCompare}
            className="px-4 py-2 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Comparar ({comparedProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
