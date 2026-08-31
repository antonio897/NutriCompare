import React, { useState } from 'react';
import { 
  Award, 
  Trophy, 
  Crown, 
  Medal, 
  ExternalLink, 
  Info, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck,
  Scale
} from 'lucide-react';
import { SupplementProduct, CategoryType } from '../types';
import { getNutriScoreColorClass } from '../utils/nutriscore';

interface RankingsViewProps {
  products: SupplementProduct[];
  onSelectProduct: (id: string) => void;
  onToggleCompare: (id: string) => void;
  comparisonIds: string[];
}

export const RankingsView: React.FC<RankingsViewProps> = ({
  products,
  onSelectProduct,
  onToggleCompare,
  comparisonIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Proteína');

  const categories: CategoryType[] = ['Proteína', 'Creatina', 'Pre-Entreno', 'Multivitamínico', 'Magnesio', 'Omega-3', 'Aminoácidos'];

  // Filter and sort by NutriScore descending
  const categoryProducts = products
    .filter((p) => p.category === selectedCategory)
    .sort((a, b) => b.nutriScore - a.nutriScore);

  const top3 = categoryProducts.slice(0, 3);
  const remaining = categoryProducts.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e0e3e5] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c49] bg-[#6cf8bb]/30 px-2.5 py-0.5 rounded-full font-label-caps flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                Auditoría Algorítmica 2024
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
              NutriScore Rankings Oficiales
            </h1>
            <p className="text-sm text-[#45464d] mt-1 max-w-2xl">
              Suplementos ordenados rigurosamente según pureza química verificada, ausencia de rellenos y coste real por dosis activa.
            </p>
          </div>

          {/* Category Selector Pills */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#f2f4f6] rounded-2xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-[#191c1e] shadow-xs'
                    : 'text-[#45464d] hover:text-[#191c1e]'
                }`}
              >
                {cat === 'Proteína' ? 'Proteínas (Whey)' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#76777d] font-label-caps flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#006c49]" />
              Podio de Excelencia Clínica ({selectedCategory})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            {/* Rank #1 Card (Center / Highlighted) */}
            {top3[0] && (
              <div className="md:order-1 bg-white rounded-3xl p-6 border-2 border-[#006c49] shadow-md relative overflow-hidden flex flex-col justify-between h-full group hover:shadow-lg transition-all">
                <div className="absolute top-0 right-0 bg-[#006c49] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl font-label-caps flex items-center gap-1">
                  <Crown className="w-3 h-3 text-[#6cf8bb]" />
                  #1 GLOBAL
                </div>

                <div>
                  <div className="w-28 h-28 mx-auto my-3 rounded-2xl bg-[#f8fafc] p-3 flex items-center justify-center">
                    <img 
                      src={top3[0].image} 
                      alt={top3[0].name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#76777d] uppercase tracking-wider">
                      {top3[0].brand}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#006c49] text-white font-bold text-xs font-data-tabular">
                      Score {top3[0].nutriScore}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#191c1e] line-clamp-2">
                    {top3[0].name}
                  </h3>

                  <p className="text-xs text-[#45464d] mt-2 line-clamp-3 leading-relaxed">
                    {top3[0].description}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-[#6cf8bb]/15 border border-[#6cf8bb]/30 text-xs text-[#005236] space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {top3[0].algorithmSummary?.plus || 'Máxima pureza evaluada'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e0e3e5] space-y-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#76777d]">Precio mercado:</span>
                    <span className="font-bold text-sm text-[#191c1e] font-data-tabular">
                      {top3[0].currency}{top3[0].price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectProduct(top3[0].id)}
                      className="flex-1 py-2 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Ver Ficha</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleCompare(top3[0].id)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        comparisonIds.includes(top3[0].id)
                          ? 'bg-[#dae2fd] text-[#131b2e] border-[#bec6e0]'
                          : 'bg-[#f2f4f6] text-[#45464d] hover:bg-[#eceef0] border-[#e0e3e5]'
                      }`}
                      title="Comparar"
                    >
                      <Scale className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rank #2 Card */}
            {top3[1] && (
              <div className="md:order-2 bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-xs relative flex flex-col justify-between h-full group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 bg-[#e0e3e5] text-[#191c1e] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl font-label-caps">
                  #2 SELECCIÓN
                </div>

                <div>
                  <div className="w-24 h-24 mx-auto my-3 rounded-2xl bg-[#f8fafc] p-2 flex items-center justify-center">
                    <img 
                      src={top3[1].image} 
                      alt={top3[1].name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#76777d] uppercase tracking-wider">
                      {top3[1].brand}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#4edea3] text-[#002113] font-bold text-xs font-data-tabular">
                      Score {top3[1].nutriScore}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#191c1e] line-clamp-2">
                    {top3[1].name}
                  </h3>

                  <p className="text-xs text-[#45464d] mt-2 line-clamp-3">
                    {top3[1].description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e0e3e5] space-y-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#76777d]">Precio mercado:</span>
                    <span className="font-bold text-sm text-[#191c1e] font-data-tabular">
                      {top3[1].currency}{top3[1].price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectProduct(top3[1].id)}
                      className="flex-1 py-2 rounded-xl bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Ver Ficha</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleCompare(top3[1].id)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        comparisonIds.includes(top3[1].id)
                          ? 'bg-[#dae2fd] text-[#131b2e] border-[#bec6e0]'
                          : 'bg-[#f2f4f6] text-[#45464d] hover:bg-[#eceef0] border-[#e0e3e5]'
                      }`}
                      title="Comparar"
                    >
                      <Scale className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rank #3 Card */}
            {top3[2] && (
              <div className="md:order-3 bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-xs relative flex flex-col justify-between h-full group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 bg-[#f2f4f6] text-[#76777d] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl font-label-caps">
                  #3 SELECCIÓN
                </div>

                <div>
                  <div className="w-24 h-24 mx-auto my-3 rounded-2xl bg-[#f8fafc] p-2 flex items-center justify-center">
                    <img 
                      src={top3[2].image} 
                      alt={top3[2].name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#76777d] uppercase tracking-wider">
                      {top3[2].brand}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#6cf8bb] text-[#00714d] font-bold text-xs font-data-tabular">
                      Score {top3[2].nutriScore}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#191c1e] line-clamp-2">
                    {top3[2].name}
                  </h3>

                  <p className="text-xs text-[#45464d] mt-2 line-clamp-3">
                    {top3[2].description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e0e3e5] space-y-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#76777d]">Precio mercado:</span>
                    <span className="font-bold text-sm text-[#191c1e] font-data-tabular">
                      {top3[2].currency}{top3[2].price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectProduct(top3[2].id)}
                      className="flex-1 py-2 rounded-xl bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Ver Ficha</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleCompare(top3[2].id)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        comparisonIds.includes(top3[2].id)
                          ? 'bg-[#dae2fd] text-[#131b2e] border-[#bec6e0]'
                          : 'bg-[#f2f4f6] text-[#45464d] hover:bg-[#eceef0] border-[#e0e3e5]'
                      }`}
                      title="Comparar"
                    >
                      <Scale className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Rankings Table (Rank 4, 5, etc.) */}
      {remaining.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#e0e3e5] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#e0e3e5]">
            <h3 className="text-base font-bold text-[#191c1e]">
              Posiciones Siguientes en la Clasificación
            </h3>
            <p className="text-xs text-[#76777d] mt-0.5">
              Productos analizados que completan la categoría con sus respectivas notas algorítmicas
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#f8fafc] text-xs font-bold text-[#76777d] uppercase tracking-wider font-label-caps">
                  <th className="p-4 w-14 text-center">Rank</th>
                  <th className="p-4">Producto & Marca</th>
                  <th className="p-4 text-center">NutriScore</th>
                  <th className="p-4">Pureza / Activo</th>
                  <th className="p-4">Precio / Dosis</th>
                  <th className="p-4">Evaluación Algorítmica</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3e5] text-xs">
                {remaining.map((item, idx) => {
                  const rankNum = idx + 4;
                  return (
                    <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="p-4 text-center font-bold font-data-tabular text-[#76777d]">
                        #{rankNum}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-10 h-10 object-contain rounded-lg bg-[#f2f4f6] p-1"
                          />
                          <div>
                            <p className="font-bold text-[#191c1e]">{item.name}</p>
                            <p className="text-[11px] text-[#76777d]">{item.brand} • {item.format}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[#f2f4f6] text-[#191c1e] font-bold font-data-tabular">
                          {item.nutriScore}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[#191c1e]">
                        {item.activeIngredientAmount}
                      </td>
                      <td className="p-4 font-data-tabular font-bold text-[#006c49]">
                        {item.currency}{item.costPerDose.toFixed(2)} / toma
                      </td>
                      <td className="p-4 text-[#45464d]">
                        <span className="text-[#006c49] font-medium block">
                          + {item.algorithmSummary?.plus || 'Buenas especificaciones'}
                        </span>
                        <span className="text-[#ba1a1a] block">
                          - {item.algorithmSummary?.minus || 'Sin patentes'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onSelectProduct(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Ver Info
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
