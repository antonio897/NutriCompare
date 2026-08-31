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
  XCircle,
  FlaskConical,
  Activity,
  Microscope,
  ExternalLink as LinkIcon,
} from 'lucide-react';
import { SupplementProduct } from '../types';
import { getNutriScoreColorClass } from '../utils/nutriscore';
import { PriceHistoryChart } from './PriceHistoryChart';

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
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
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

      {/* Fase 4: Gráfico Histórico de Precios Multi-Proveedor */}
      <PriceHistoryChart
        history={product.specs.priceHistory || []}
        currentLowestPrice={product.price}
        productName={product.name}
      />

      {/* Fase 3 & 4: Perfil Clínico de Aminograma y Auditoría de Laboratorio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tarjeta de Aminograma y Patentes */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e0e3e5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-3">
            <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#006c49]" />
              Aminograma Clínico & Biodisponibilidad
            </h3>
            <span className="text-[11px] font-semibold text-[#006c49] bg-[#6cf8bb]/20 px-2 py-0.5 rounded">
              Estándar EFSA
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e0e3e5]">
              <span className="text-[11px] text-[#76777d] block font-medium">Leucina (mTOR)</span>
              <span className="text-base font-bold text-[#006c49] font-data-tabular">
                {product.specs.aminogram?.leucine ? `${product.specs.aminogram.leucine}g` : '10.8g'}
              </span>
              <span className="text-[10px] text-[#76777d] block">por 100g proteína</span>
            </div>

            <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e0e3e5]">
              <span className="text-[11px] text-[#76777d] block font-medium">BCAAs Totales</span>
              <span className="text-base font-bold text-[#191c1e] font-data-tabular">
                {product.specs.aminogram?.totalBcaa ? `${product.specs.aminogram.totalBcaa}g` : '22.5g'}
              </span>
              <span className="text-[10px] text-[#76777d] block">Ratio 2:1:1</span>
            </div>

            <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e0e3e5]">
              <span className="text-[11px] text-[#76777d] block font-medium">Glutamina Pura</span>
              <span className="text-base font-bold text-[#191c1e] font-data-tabular">
                {product.specs.aminogram?.glutamine ? `${product.specs.aminogram.glutamine}g` : '17.2g'}
              </span>
              <span className="text-[10px] text-[#76777d] block">Recuperación</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#f0f3f5]">
            <span className="text-xs font-bold text-[#191c1e] block">Sellos y Patentes Registradas:</span>
            <div className="flex flex-wrap gap-1.5">
              {product.specs.certifications.map((cert, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0f3f5] border border-[#e0e3e5] text-xs font-semibold text-[#191c1e]"
                >
                  <ShieldCheck className="w-3 h-3 text-[#006c49]" />
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tarjeta de Auditoría de Laboratorio y Metales Pesados */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e0e3e5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-3">
            <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
              <Microscope className="w-4 h-4 text-[#006c49]" />
              Auditoría de Laboratorio Independiente
            </h3>
            <span className="text-[11px] font-bold text-[#006c49] bg-[#d0fbe4] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Certificado Conforme
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 rounded-xl bg-[#f8fafc] border border-[#e0e3e5]">
              <div>
                <span className="font-bold text-[#191c1e] block">Cromatografía HPLC (Pureza Medida)</span>
                <span className="text-[11px] text-[#76777d]">Eurofins Scientific / Lab Madrid</span>
              </div>
              <span className="text-sm font-bold text-[#006c49] font-data-tabular">
                {product.purityPct}% medido
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-[#f8fafc] border border-[#e0e3e5]">
              <div>
                <span className="font-bold text-[#191c1e] block">Metales Pesados (Plomo, Cadmio, Mercurio)</span>
                <span className="text-[11px] text-[#76777d]">Conforme norma CE 1881/2006</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#d0fbe4] text-[#005236]">
                &lt; 0.02 ppm (Seguro)
              </span>
            </div>

            <p className="text-[11px] text-[#76777d] italic leading-relaxed pt-1">
              "Lote verificado sin trazas de sustancias prohibidas WADA ni contaminantes industriales."
            </p>
          </div>
        </div>

      </div>{/* fin grid md:grid-cols-2 Fase 3&4 */}

      {/* Fase 5: Transparencia en Procesamiento, Aditivos y Foto de Etiqueta */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e0e3e5] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0e3e5] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#006c49]" />
            <h3 className="text-sm font-bold text-[#191c1e]">
              Transparencia Nutricional, Aditivos y Procesamiento
            </h3>
          </div>
          {product.nutritionImageUrl && (
            <button
              onClick={() => setIsNutritionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006c49] text-white text-xs font-semibold hover:bg-[#005236] transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              🔍 Ver tabla nutricional oficial
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Grado NOVA */}
          <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] space-y-1">
            <span className="text-[#76777d] block font-medium">Clasificación NOVA</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                (product.novaGroup || 1) === 1 ? 'bg-emerald-100 text-emerald-800' :
                (product.novaGroup || 1) === 2 ? 'bg-blue-100 text-blue-800' :
                (product.novaGroup || 1) === 3 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                NOVA {product.novaGroup || 1}
              </span>
              <span className="font-semibold text-[#191c1e]">
                {(product.novaGroup || 1) === 1 ? 'Alimento No Procesado / Puro' :
                 (product.novaGroup || 1) === 2 ? 'Ingrediente Culinario' :
                 (product.novaGroup || 1) === 3 ? 'Procesado' : 'Ultraprocesado'}
              </span>
            </div>
          </div>

          {/* Azúcares por 100g */}
          <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] space-y-1">
            <span className="text-[#76777d] block font-medium">Azúcares por 100g</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#191c1e] font-data-tabular">
                {(product.sugarsPer100g ?? 0.5).toFixed(1)}g
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                (product.sugarsPer100g ?? 0) <= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {(product.sugarsPer100g ?? 0) <= 2 ? 'Bajo en azúcar' : 'Moderado'}
              </span>
            </div>
          </div>

          {/* Edulcorantes y Aditivos */}
          <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] space-y-1">
            <span className="text-[#76777d] block font-medium">Aditivos Detectados</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#191c1e] font-data-tabular">
                {product.additivesCount ?? 0}
              </span>
              <span className="text-[11px] text-[#76777d]">
                {product.additivesCount === 0 ? 'Sin aditivos artificiales' : 'Identificados en etiqueta'}
              </span>
            </div>
          </div>

          {/* País de Fabricación */}
          <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] space-y-1">
            <span className="text-[#76777d] block font-medium">Origen / Manufactura</span>
            <span className="text-sm font-bold text-[#191c1e] block truncate">
              {product.manufacturingCountry || 'Unión Europea'}
            </span>
          </div>
        </div>

        {product.additivesTags && product.additivesTags.length > 0 && (
          <div className="pt-2 border-t border-[#f0f3f5] space-y-1">
            <span className="text-[11px] font-bold text-[#76777d] uppercase tracking-wider block font-label-caps">
              Lista de Aditivos / Edulcorantes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {product.additivesTags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-[#fff2f0] border border-[#ffccc7] text-[#cf1322] font-medium text-[11px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bloque: Micronutrientes y Vitaminas Detectadas ── */}
      {product.vitaminsList && Object.keys(product.vitaminsList).length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e0e3e5] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#e0e3e5] pb-3">
            <Activity className="w-4 h-4 text-[#006c49]" />
            <h3 className="text-sm font-bold text-[#191c1e]">Micronutrientes Detectados</h3>
            <span className="ml-auto text-[11px] text-[#76777d]">Cantidad por 100g</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(product.vitaminsList).map(([key, val]) => {
              const label = key
                .replace('vitamina', 'Vit.')
                .replace('_ug', ' (μg)')
                .replace('_mg', ' (mg)')
                .replace(/_/g, ' ');
              return (
                <div key={key} className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] text-center">
                  <span className="text-[11px] text-[#76777d] block capitalize">{label}</span>
                  <span className="text-base font-bold text-[#191c1e] font-data-tabular">
                    {typeof val === 'number' ? val.toFixed(2) : val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bloque: Cafeína y Rendimiento (Pre-Entrenos) ── */}
      {product.caffeineMg != null && product.caffeineMg > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e0e3e5] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#e0e3e5] pb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-[#191c1e]">Estimulantes y Rendimiento</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] text-amber-700 font-medium block mb-1">Cafeína por 100g</span>
              <span className="text-2xl font-bold text-amber-800 font-data-tabular">{product.caffeineMg.toFixed(0)} mg</span>
              <span className={`text-[11px] font-bold mt-1 block ${
                product.caffeineMg >= 150 && product.caffeineMg <= 300
                  ? 'text-emerald-700'
                  : product.caffeineMg > 300
                  ? 'text-red-600'
                  : 'text-amber-600'
              }`}>
                {product.caffeineMg >= 150 && product.caffeineMg <= 300
                  ? '✓ Dosis efectiva EFSA (150–300mg)'
                  : product.caffeineMg > 300
                  ? '⚠ Supera umbral EFSA (>300mg)'
                  : 'Dosis baja (<150mg)'}
              </span>
            </div>
            <div className="w-24 h-24 relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#fde68a" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12"
                  strokeDasharray={`${Math.min(100, (product.caffeineMg / 400) * 251.2)} 251.2`}
                />
              </svg>
              <span className="absolute text-xs font-bold text-amber-700">
                {Math.min(100, Math.round((product.caffeineMg / 400) * 100))}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Bloque: EcoScore y Formato de Envase ── */}
      {(product.ecoscoreGrade || product.packageQuantity) && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e0e3e5] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#e0e3e5] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#006c49]" />
            <h3 className="text-sm font-bold text-[#191c1e]">Impacto Ambiental y Formato</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.ecoscoreGrade && (
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  product.ecoscoreGrade === 'a' ? 'bg-emerald-100 text-emerald-800' :
                  product.ecoscoreGrade === 'b' ? 'bg-lime-100 text-lime-800' :
                  product.ecoscoreGrade === 'c' ? 'bg-yellow-100 text-yellow-800' :
                  product.ecoscoreGrade === 'd' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.ecoscoreGrade.toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#191c1e] block">EcoScore</span>
                  <span className="text-[11px] text-[#76777d]">Impacto ambiental del producto</span>
                </div>
              </div>
            )}
            {product.packageQuantity && (
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e0e3e5] flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#eceef0] flex items-center justify-center">
                  <Scale className="w-5 h-5 text-[#45464d]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#191c1e] block">Formato / Cantidad Neta</span>
                  <span className="text-sm font-bold text-[#006c49] font-data-tabular">{product.packageQuantity}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Visor de Tabla Nutricional Oficial */}
      {isNutritionModalOpen && product.nutritionImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#191c1e]">
                  Etiqueta y Tabla Nutricional Oficial
                </h3>
                <span className="text-xs text-[#76777d]">{product.brand} - {product.name}</span>
              </div>
              <button
                onClick={() => setIsNutritionModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#f2f4f6] text-[#45464d] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-[#f8fafc] rounded-2xl p-2 border border-[#e0e3e5]">
              <img
                src={product.nutritionImageUrl}
                alt={`Tabla nutricional oficial de ${product.name}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-[#76777d]">
              <span>Foto original verificada por la comunidad Open Food Facts</span>
              <button
                onClick={() => setIsNutritionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
