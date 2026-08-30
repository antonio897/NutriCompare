import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  ShieldCheck, 
  Sparkles, 
  Scale, 
  Eye, 
  DollarSign, 
  CheckCircle2, 
  HelpCircle,
  Calculator,
  RefreshCw,
  Award
} from 'lucide-react';
import { calculateNutriScore, NutriScoreInput, getNutriScoreColorClass } from '../utils/nutriscore';

export const MethodsView: React.FC = () => {
  // Interactive Calculator State
  const [calcInput, setCalcInput] = useState<NutriScoreInput>({
    category: 'Creatina',
    price: 24.99,
    servings: 83,
    activeIngredientAmount: 3.0,
    purityPct: 99.9,
    hasQualitySeal: true,
    isLowQualityForm: false,
    transparencyLevel: 3,
    certificationsCount: 2,
    additivePenaltyScore: 0,
  });

  const calculatedResult = useMemo(() => {
    return calculateNutriScore(calcInput);
  }, [calcInput]);

  const scoreStyle = getNutriScoreColorClass(calculatedResult.totalScore);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e0e3e5] shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c49] bg-[#6cf8bb]/30 px-2.5 py-0.5 rounded-full font-label-caps flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5" />
              Estándar Científico Abierto
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
            Metodología del Algoritmo NutriScore
          </h1>
          <p className="text-sm text-[#45464d] mt-2 leading-relaxed">
            NutriCompare no acepta patrocinios de marcas para alterar puntuaciones. Cada producto se audita mediante una fórmula matemática ponderada basada en literatura científica y análisis de laboratorios independientes.
          </p>
        </div>
      </div>

      {/* 4 Pillars Weights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pillar 1: 40% */}
        <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center font-bold text-sm font-data-tabular">
            40%
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#191c1e]">Pureza & Auditorías</h3>
            <p className="text-xs text-[#76777d] mt-1">
              Testeo de metales pesados, ausencia de sustancias prohibidas WADA y patentes farmacéuticas (Creapure®, IFOS, TRAACS®).
            </p>
          </div>
        </div>

        {/* Pillar 2: 30% */}
        <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#6cf8bb] text-[#002113] flex items-center justify-center font-bold text-sm font-data-tabular">
            30%
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#191c1e]">Eficacia & Biodisponibilidad</h3>
            <p className="text-xs text-[#76777d] mt-1">
              Dosis clínicas respaldadas por meta-análisis contra subdosificaciones comerciales ("fairy dusting").
            </p>
          </div>
        </div>

        {/* Pillar 3: 20% */}
        <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#dae2fd] text-[#131b2e] flex items-center justify-center font-bold text-sm font-data-tabular">
            20%
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#191c1e]">Transparencia de Etiqueta</h3>
            <p className="text-xs text-[#76777d] mt-1">
              Penalización severa por mezclas propietarias u opacas y desglose al 100% de cada miligramo.
            </p>
          </div>
        </div>

        {/* Pillar 4: 10% */}
        <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#eceef0] text-[#191c1e] flex items-center justify-center font-bold text-sm font-data-tabular">
            10%
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#191c1e]">Relación Precio / Dosis Real</h3>
            <p className="text-xs text-[#76777d] mt-1">
              Evaluación del coste monetario por gramo de compuesto biológicamente activo, no por volumen de bote.
            </p>
          </div>
        </div>

      </div>

      {/* Interactive NutriScore Simulator */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e0e3e5] shadow-xs">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-4 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c49] font-label-caps flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#006c49]" />
              Simulador Clínico en Tiempo Real
            </span>
            <h2 className="text-xl font-bold text-[#191c1e] mt-0.5">
              Calcula el NutriScore de Cualquier Suplemento
            </h2>
          </div>
          <button
            onClick={() => setCalcInput({
              category: 'Creatina',
              price: 24.99,
              servings: 83,
              activeIngredientAmount: 3.0,
              purityPct: 99.9,
              hasQualitySeal: true,
              isLowQualityForm: false,
              transparencyLevel: 3,
              certificationsCount: 2,
              additivePenaltyScore: 0,
            })}
            className="text-xs text-[#006c49] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restablecer Valores
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Controls Form */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#191c1e] block mb-1">
                  Categoría de Suplemento
                </label>
                <select
                  value={calcInput.category}
                  onChange={(e) => setCalcInput({ ...calcInput, category: e.target.value as any })}
                  className="w-full bg-[#f2f4f6] text-xs font-medium rounded-xl p-2.5 border border-transparent focus:border-[#006c49] focus:bg-white focus:outline-none"
                >
                  <option value="Creatina">Creatina</option>
                  <option value="Proteína">Proteína (Whey/Isolate)</option>
                  <option value="Pre-Entreno">Pre-Entreno</option>
                  <option value="Magnesio">Magnesio</option>
                  <option value="Multivitamínico">Multivitamínico</option>
                  <option value="Omega-3">Omega-3</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c1e] block mb-1">
                  Precio Total (€ / $)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={calcInput.price}
                  onChange={(e) => setCalcInput({ ...calcInput, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#f2f4f6] text-xs font-medium rounded-xl p-2.5 border border-transparent focus:border-[#006c49] focus:bg-white focus:outline-none font-data-tabular"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#191c1e] block mb-1">
                  Tomas / Servicios por Bote
                </label>
                <input
                  type="number"
                  value={calcInput.servings}
                  onChange={(e) => setCalcInput({ ...calcInput, servings: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#f2f4f6] text-xs font-medium rounded-xl p-2.5 border border-transparent focus:border-[#006c49] focus:bg-white focus:outline-none font-data-tabular"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c1e] block mb-1">
                  Pureza Estimada / Testada (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  max="100"
                  value={calcInput.purityPct}
                  onChange={(e) => setCalcInput({ ...calcInput, purityPct: parseFloat(e.target.value) || 90 })}
                  className="w-full bg-[#f2f4f6] text-xs font-medium rounded-xl p-2.5 border border-transparent focus:border-[#006c49] focus:bg-white focus:outline-none font-data-tabular"
                />
              </div>
            </div>

            {/* Checkboxes & Selectors */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#191c1e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={calcInput.hasQualitySeal}
                  onChange={(e) => setCalcInput({ ...calcInput, hasQualitySeal: e.target.checked })}
                  className="rounded text-[#006c49] focus:ring-[#006c49]"
                />
                <span>Tiene Patente Oficial (ej. Creapure®, TRAACS®, IFOS, Kyowa®)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-[#191c1e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={calcInput.isLowQualityForm}
                  onChange={(e) => setCalcInput({ ...calcInput, isLowQualityForm: e.target.checked })}
                  className="rounded text-[#ba1a1a] focus:ring-[#ba1a1a]"
                />
                <span className="text-[#ba1a1a]">Usa materia prima de baja biodisponibilidad (ej. Óxido de Magnesio)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-[#191c1e] block mb-1">
                  Nivel de Transparencia
                </label>
                <select
                  value={calcInput.transparencyLevel}
                  onChange={(e) => setCalcInput({ ...calcInput, transparencyLevel: parseInt(e.target.value) as any })}
                  className="w-full bg-[#f2f4f6] text-xs font-medium rounded-xl p-2.5 border border-transparent focus:border-[#006c49] focus:bg-white focus:outline-none"
                >
                  <option value={3}>3 - 100% Desglose Completo</option>
                  <option value={2}>2 - Parcialmente Desglosado</option>
                  <option value={1}>1 - Mezcla Patentada Opaca</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#191c1e] block mb-1">
                  Certificaciones Externas ({calcInput.certificationsCount})
                </label>
                <select
                  value={calcInput.certificationsCount}
                  onChange={(e) => setCalcInput({ ...calcInput, certificationsCount: parseInt(e.target.value) })}
                  className="w-full bg-[#f2f4f6] text-xs font-medium rounded-xl p-2.5 border border-transparent focus:border-[#006c49] focus:bg-white focus:outline-none"
                >
                  <option value={0}>0 - Sin sellos de laboratorio</option>
                  <option value={1}>1 - Testado por 1 laboratorio</option>
                  <option value={2}>2 - Informed Choice / Informed Sport</option>
                  <option value={3}>3 - NSF Sport + LGC Doble Testeo</option>
                </select>
              </div>
            </div>

          </div>

          {/* Real-time Output Score Card */}
          <div className="lg:col-span-5 bg-[#f8fafc] rounded-3xl p-6 border border-[#e0e3e5] text-center space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#76777d] font-label-caps">
                Puntuación Algorítmica Calculada
              </span>
              
              <div className="my-4">
                <div className={`w-24 h-24 mx-auto rounded-3xl ${scoreStyle.bg} ${scoreStyle.text} flex flex-col items-center justify-center font-bold shadow-md transition-all`}>
                  <span className="text-3xl font-data-tabular leading-none">
                    {calculatedResult.totalScore.toFixed(1)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider mt-1 opacity-90">
                    NutriScore
                  </span>
                </div>
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-white border border-[#e0e3e5] text-xs font-bold text-[#191c1e] shadow-2xs">
                {calculatedResult.grade}
              </span>
            </div>

            {/* Metric Breakdown Progress */}
            <div className="space-y-2 text-left pt-2 border-t border-[#e0e3e5]">
              <div className="flex justify-between text-xs">
                <span className="text-[#45464d]">Pureza Química (40%):</span>
                <span className="font-bold font-data-tabular text-[#191c1e]">{calculatedResult.breakdown.pureza}/10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#45464d]">Relación Precio / Dosis (25%):</span>
                <span className="font-bold font-data-tabular text-[#191c1e]">{calculatedResult.breakdown.precioValor}/10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#45464d]">Transparencia de Etiqueta (20%):</span>
                <span className="font-bold font-data-tabular text-[#191c1e]">{calculatedResult.breakdown.transparencia}/10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#45464d]">Sellos de Seguridad (15%):</span>
                <span className="font-bold font-data-tabular text-[#191c1e]">{calculatedResult.breakdown.certificaciones}/10</span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
