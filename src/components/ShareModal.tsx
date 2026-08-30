import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles, QrCode } from 'lucide-react';
import { SupplementProduct } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: SupplementProduct[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://nutricompare.ai/compare';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#e0e3e5] shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-5">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6cf8bb]/30 flex items-center justify-center text-[#006c49]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191c1e]">Compartir Comparativa</h3>
              <p className="text-xs text-[#76777d]">Enlace directo a este reporte clínico</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-[#76777d] hover:bg-[#f2f4f6] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Products Summary */}
        <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#76777d] font-label-caps block">
            Suplementos Incluidos ({products.length})
          </span>
          <div className="space-y-1.5">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#191c1e] truncate max-w-[240px]">{p.name}</span>
                <span className="font-bold text-[#006c49] font-data-tabular">Score {p.nutriScore}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#45464d] block">
            Enlace Permanente
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-[#f2f4f6] text-xs text-[#191c1e] p-2.5 rounded-xl border border-transparent font-data-tabular outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                copied
                  ? 'bg-[#006c49] text-white'
                  : 'bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
