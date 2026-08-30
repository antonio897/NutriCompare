import React, { useState } from 'react';
import { BookOpen, Clock, ArrowRight, Sparkles, Tag, ChevronRight } from 'lucide-react';
import { BlogArticle } from '../types';
import { ArticleModal } from './ArticleModal';

interface BlogViewProps {
  articles: BlogArticle[];
}

export const BlogView: React.FC<BlogViewProps> = ({ articles }) => {
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  const featured = articles.find((a) => a.featured) || articles[0];
  const restArticles = articles.filter((a) => a.id !== featured?.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e0e3e5] shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c49] bg-[#6cf8bb]/30 px-2.5 py-0.5 rounded-full font-label-caps flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Evidencia & Divulgación
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
            Ciencia, Auditorías y Guías de Compra
          </h1>
          <p className="text-sm text-[#45464d] mt-2 leading-relaxed">
            Investigaciones detalladas para ayudarte a desentrañar el marketing de la industria de la suplementación deportiva.
          </p>
        </div>
      </div>

      {/* Featured Deep Dive Article (Bento Grid Main) */}
      {featured && (
        <div 
          onClick={() => setSelectedArticle(featured)}
          className="relative rounded-3xl overflow-hidden bg-[#131b2e] min-h-[380px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-10 cursor-pointer group shadow-md hover:shadow-xl transition-all border border-[#3f465c]"
        >
          {/* Background image & gradient */}
          <img 
            src={featured.image} 
            alt={featured.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 group-hover:opacity-50 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e] via-[#131b2e]/60 to-transparent" />

          {/* Content container */}
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#006c49] text-white px-2.5 py-1 rounded font-label-caps">
                {featured.categoryTag}
              </span>
              <span className="text-xs text-[#bec6e0] font-data-tabular flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {featured.readTime}
              </span>
              <span className="text-xs text-[#7c839b]">•</span>
              <span className="text-xs text-[#bec6e0]">{featured.date}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight group-hover:text-[#6cf8bb] transition-colors">
              {featured.title}
            </h2>

            <p className="text-sm text-[#bec6e0] line-clamp-2 leading-relaxed">
              {featured.excerpt}
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#6cf8bb] group-hover:translate-x-1 transition-transform">
                Leer artículo completo
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Articles Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {restArticles.map((art) => (
          <div
            key={art.id}
            onClick={() => setSelectedArticle(art)}
            className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="aspect-video rounded-2xl bg-[#f2f4f6] overflow-hidden relative">
                <img 
                  src={art.image} 
                  alt={art.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#191c1e] px-2.5 py-0.5 rounded font-label-caps shadow-2xs">
                  {art.categoryTag}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#76777d] pt-1">
                <span className="flex items-center gap-1 font-data-tabular">
                  <Clock className="w-3.5 h-3.5" />
                  {art.readTime}
                </span>
                <span>•</span>
                <span>{art.date}</span>
              </div>

              <h3 className="text-lg font-bold text-[#191c1e] group-hover:text-[#006c49] transition-colors">
                {art.title}
              </h3>

              <p className="text-xs text-[#45464d] line-clamp-3 leading-relaxed">
                {art.excerpt}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#f2f4f6] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#76777d]">
                Por {art.author.split('(')[0]}
              </span>
              <span className="text-xs font-bold text-[#006c49] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Leer más
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      <ArticleModal 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />

    </div>
  );
};
