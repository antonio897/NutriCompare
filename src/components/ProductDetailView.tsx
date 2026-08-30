import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  ExternalLink, 
  Scale, 
  ArrowLeft, 
  Share2, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Award,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { SupplementProduct } from '../types';
import { getNutriScoreColorClass } from '../utils/nutriscore';

interface ProductDetailViewProps {
  product: SupplementProduct;
  onBack: () => void;
  isInCompare: boolean;
  onToggleCompare: (id: string) => void;
  onOpenShareModal: () => void;
  onNavigateToCategory: (category: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack,
  isInCompare,
  onToggleCompare,
  onOpenShareModal,
  onNavigateToCategory,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const scoreStyle = getNutriScoreColorClass(product.nutriScore);

  // Calculate coordinates for 5-axis Radar chart
  const radarData = [
    { label: 'Pureza', value: product.radarScores.pureza, angle: -90 },
    { label: 'Valor', value: product.radarScores.valor, angle: -18 },
    { label: 'Perfil', value: product.radarScores.perfil, angle: 54 },
    { label: 'Seguridad', value: product.radarScores.seguridad, angle: 126 },
    { label: 'Transparencia', value: product.radarScores.transparencia, angle: 198 },
  ];

  const size = 200;
  const center = size / 2;
  const radius = size * 0.38;

  const getCoordinates = (value: number, angleDegrees: number) => {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const r = (value / 10) * radius;
    return {
      x: center + r * Math.cos(angleRadians),
      y: center + r * Math.sin(angleRadians),
    };
  };

  const polygonPoints = radarData
    .map((item) => {
      const { x, y } = getCoordinates(item.value, item.angle);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-xs text-[#76777d]">
          <button 
            onClick={onBack}
            className="hover:text-[#191c1e] flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </button>
          <span>/</span>
          <button 
            onClick={() => onNavigateToCategory(product.category)}
            className="hover:text-[#191c1e] transition-colors cursor-pointer"
          >
            {product.category}
          </button>
          <span>/</span>
          <span className="text-[#191c1e] font-semibold truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        <button
          onClick={onOpenShareModal}
          className="p-2 rounded-xl text-[#45464d] hover:bg-white hover:shadow-xs transition-all border border-transparent hover:border-[#e0e3e5] cursor-pointer"
          title="Compartir ficha clínica"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Product Hero Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e0e3e5] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] p-6 flex items-center justify-center relative overflow-hidden group">
              <img 
                src={images[activeImageIndex] || product.image} 
                alt={product.name} 
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#006c49] text-white flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Auditado
                </span>
              </div>
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl border-2 p-1 bg-white flex-shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#006c49] shadow-xs'
                        : 'border-[#e0e3e5] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Title, NutriScore, Radar & Buy CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-[#76777d] uppercase tracking-wider font-label-caps">
                  {product.brand}
                </span>
                <span className="text-xs text-[#006c49] font-semibold bg-[#6cf8bb]/30 px-2.5 py-0.5 rounded-full">
                  {product.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
                {product.name}
              </h1>
              
              <p className="text-sm text-[#45464d] mt-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* NutriScore Score Card & Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5]">
              
              {/* NutriScore Badge */}
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl ${scoreStyle.bg} ${scoreStyle.text} flex flex-col items-center justify-center font-bold shadow-xs`}>
                  <span className="text-xl font-data-tabular leading-none">{product.nutriScore}</span>
                  <span className="text-[9px] uppercase tracking-tighter opacity-90 mt-0.5">Score</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#191c1e] block">
                    {product.scoreGrade || 'Grado Clínico A+'}
                  </span>
                  <span className="text-[11px] text-[#76777d] block">
                    Percentil 99%
                  </span>
                </div>
              </div>

              {/* Price & Cost Per Dose */}
              <div className="border-t sm:border-t-0 sm:border-l border-[#e0e3e5] pt-2 sm:pt-0 sm:pl-3">
                <span className="text-[11px] text-[#76777d] block font-medium">Coste / Dosis Real</span>
                <span className="text-base font-bold text-[#006c49] font-data-tabular">
                  {product.currency}{product.costPerDose.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#76777d] block">
                  {product.servings} tomas ({product.currency}{product.price.toFixed(2)})
                </span>
              </div>

              {/* Purity & Active */}
              <div className="border-t sm:border-t-0 sm:border-l border-[#e0e3e5] pt-2 sm:pt-0 sm:pl-3">
                <span className="text-[11px] text-[#76777d] block font-medium">Pureza Testada</span>
                <span className="text-base font-bold text-[#191c1e] font-data-tabular">
                  {product.purityPct}%
                </span>
                <span className="text-[11px] text-[#006c49] block font-semibold truncate">
                  {product.activeIngredientAmount}
                </span>
              </div>

            </div>

            {/* Radar Analysis & Breakdown Progress */}
            <div className="p-4 rounded-2xl bg-white border border-[#e0e3e5] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider font-label-caps flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#006c49]" />
                  Perfil Clínico Multieje
                </h3>
                <span className="text-[11px] text-[#76777d]">Normalizado de 0 a 10</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* SVG Radar Chart */}
                <div className="md:col-span-5 flex justify-center">
                  <svg width={size} height={size} className="overflow-visible">
                    {/* Background concentric webs */}
                    {[0.25, 0.5, 0.75, 1.0].map((level, idx) => (
                      <circle
                        key={idx}
                        cx={center}
                        cy={center}
                        r={radius * level}
                        fill="none"
                        stroke="#e0e3e5"
                        strokeDasharray="2,2"
                      />
                    ))}

                    {/* Radar polygon shape */}
                    <polygon
                      points={polygonPoints}
                      fill="rgba(108, 248, 187, 0.4)"
                      stroke="#006c49"
                      strokeWidth="2"
                    />

                    {/* Vertices points */}
                    {radarData.map((d, i) => {
                      const { x, y } = getCoordinates(d.value, d.angle);
                      const labelPos = getCoordinates(12.5, d.angle);
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="3.5" fill="#006c49" stroke="#ffffff" strokeWidth="1.5" />
                          <text
                            x={labelPos.x}
                            y={labelPos.y + 3}
                            textAnchor="middle"
                            className="text-[10px] fill-[#45464d] font-semibold"
                          >
                            {d.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Breakdown percentage bars */}
                <div className="md:col-span-7 space-y-2.5">
                  {product.breakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#45464d]">{item.label}</span>
                        <span className="text-[#191c1e] font-bold font-data-tabular">{item.percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.colorClass || 'bg-[#006c49]'}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Action Buttons & Retailer CTAs */}
            <div className="space-y-2.5 pt-2">
              <div className="flex flex-wrap gap-2.5">
                {product.purchaseLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-between shadow-xs ${
                      link.highlight
                        ? 'bg-[#006c49] hover:bg-[#005236] text-white'
                        : 'bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e]'
                    }`}
                  >
                    <span>Comprar en {link.store}</span>
                    <div className="flex items-center gap-1.5 font-data-tabular font-bold">
                      <span>{product.currency}{link.price.toFixed(2)}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                ))}
              </div>

              <button
                onClick={() => onToggleCompare(product.id)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border cursor-pointer ${
                  isInCompare
                    ? 'bg-[#dae2fd] text-[#131b2e] border-[#bec6e0]'
                    : 'bg-white text-[#45464d] hover:bg-[#f2f4f6] border-[#e0e3e5]'
                }`}
              >
                <Scale className="w-4 h-4" />
                {isInCompare ? 'Quitar de la Comparativa' : '+ Añadir a la Comparativa'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Technical Specifications & Lab Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Specs Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#e0e3e5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-3">
            <h2 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#006c49]" />
              Especificaciones Técnicas
            </h2>
            <span className="text-xs text-[#76777d]">Datos verificados</span>
          </div>

          <dl className="divide-y divide-[#f2f4f6] text-xs">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#76777d] font-medium">Ingrediente Principal</dt>
              <dd className="font-semibold text-[#191c1e] text-right">{product.specs.mainIngredient}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#76777d] font-medium">Dosis Recomendada</dt>
              <dd className="font-semibold text-[#191c1e] text-right">{product.specs.recommendedDose}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#76777d] font-medium">Activo Puro por Toma</dt>
              <dd className="font-semibold text-[#006c49] text-right">{product.specs.activePerDose}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#76777d] font-medium">Formato / Textura</dt>
              <dd className="font-semibold text-[#191c1e] text-right">{product.specs.format}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#76777d] font-medium">Alérgenos</dt>
              <dd className="font-semibold text-[#45464d] text-right">{product.specs.allergens}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#76777d] font-medium">Sellos de Calidad</dt>
              <dd className="flex flex-wrap justify-end gap-1">
                {product.specs.certifications.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[#dae2fd] text-[#131b2e] font-semibold text-[11px]">
                    {c}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        {/* Pros & Contras */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#e0e3e5] shadow-xs space-y-6">
          
          {/* Pros */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#006c49] font-label-caps flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
              Ventajas Clínicas
            </h3>
            <ul className="space-y-2 text-xs text-[#191c1e]">
              {product.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#6cf8bb]/15 border border-[#6cf8bb]/30">
                  <Check className="w-3.5 h-3.5 text-[#006c49] flex-shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contras */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ba1a1a] font-label-caps flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-[#ba1a1a]" />
              Puntos a Considerar
            </h3>
            <ul className="space-y-2 text-xs text-[#191c1e]">
              {product.contras.map((contra, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#ffdad6]/30 border border-[#ffdad6]">
                  <X className="w-3.5 h-3.5 text-[#ba1a1a] flex-shrink-0 mt-0.5" />
                  <span>{contra}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
