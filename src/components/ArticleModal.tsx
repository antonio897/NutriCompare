import React from 'react';
import { X, Clock, Calendar, User, Bookmark, Share2, Check } from 'lucide-react';
import { BlogArticle } from '../types';

interface ArticleModalProps {
  article: BlogArticle | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#e0e3e5] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header Image Banner */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#131b2e]">
          <img 
            src={article.image} 
            alt={article.title} 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#191c1e] via-[#191c1e]/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#006c49] text-white px-2.5 py-0.5 rounded font-label-caps inline-block">
              {article.categoryTag}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-[#d8dadc] pt-1">
              <span className="flex items-center gap-1 font-data-tabular">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {article.date}
              </span>
              <span className="flex items-center gap-1 hidden sm:flex">
                <User className="w-3.5 h-3.5" />
                {article.author}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Key Takeaways Card */}
          {article.keyTakeaways && article.keyTakeaways.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#6cf8bb]/15 border border-[#6cf8bb]/30 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#005236] font-label-caps">
                Puntos Clave del Análisis
              </h3>
              <ul className="space-y-1.5 text-xs text-[#191c1e]">
                {article.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#006c49] flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article Text Formatted */}
          <div className="prose prose-sm max-w-none text-[#191c1e] text-sm leading-relaxed space-y-4">
            {article.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-base font-bold text-[#191c1e] pt-2">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              return (
                <p key={index} className="text-[#45464d]">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Footer of modal */}
          <div className="pt-6 border-t border-[#e0e3e5] flex justify-between items-center text-xs text-[#76777d]">
            <span>Publicado por el equipo científico de NutriCompare</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] font-semibold cursor-pointer"
            >
              Cerrar Artículo
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
