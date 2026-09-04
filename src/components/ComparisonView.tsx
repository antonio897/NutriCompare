import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  ExternalLink, 
  Share2, 
  Download, 
  Plus, 
  Info, 
  Award,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Trash2
} from 'lucide-react';
import { SupplementProduct } from '../types';
import { getNutriScoreColorClass, formatCurrency } from '../utils/nutriscore';

interface ComparisonViewProps {
  products: SupplementProduct[];
  allProducts: SupplementProduct[];
  onRemoveFromCompare: (id: string) => void;
  onAddToCompare: (id: string) => void;
  onSelectProduct: (id: string) => void;
  onOpenShareModal: () => void;
  onNavigate: (view: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  products,
  allProducts,
  onRemoveFromCompare,
  onAddToCompare,
  onSelectProduct,
  onOpenShareModal,
  onNavigate,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Categoría bloqueada: la primera categoría de los productos en comparativa
  const lockedCategory = products.length > 0 ? products[0].category : null;

  // Solo mostrar productos de la misma categoría que los actuales en comparativa
  const availableToAdd = allProducts.filter(p => {
    if (products.some(cp => cp.id === p.id)) return false;
    if (lockedCategory && p.category !== lockedCategory) return false;
    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['Nombre', 'Marca', 'Categoria', 'NutriScore', 'Precio', 'Dosis', 'Coste_Dosis', 'Pureza_Pct', 'Certificaciones'];
    const rows = products.map(p => [
      `"${p.name}"`,
      `"${p.brand}"`,
      `"${p.category}"`,
      p.nutriScore,
      p.price,
      p.servings,
      p.costPerDose,
      p.purityPct,
      `"${p.certifications.join(', ')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nutricompare_comparativa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Comparativa exportada a CSV exitosamente');
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-[#e0e3e5] shadow-xs max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-[#eceef0] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#565e74]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#191c1e] mb-2">No hay suplementos en la comparativa</h2>
        <p className="text-sm text-[#45464d] mb-6 max-w-md mx-auto">
          Selecciona productos desde el Directorio o los Rankings para comparar sus especificaciones clínicas, pureza y coste por dosis lado a lado.
        </p>
        <button
          onClick={() => onNavigate('directorio')}
          className="px-6 py-2.5 rounded-xl bg-[#006c49] text-white text-sm font-semibold hover:bg-[#005236] transition-colors shadow-sm inline-flex items-center gap-2"
        >
          Explorar Directorio
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131b2e] text-white px-4 py-3 rounded-xl shadow-lg border border-[#3f465c] text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-[#6cf8bb]" />
          {toastMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c49] bg-[#6cf8bb]/30 px-2 py-0.5 rounded font-label-caps">
                Tabla Comparativa Dinámica
              </span>
              <span className="text-xs text-[#76777d]">
                {products.length} de 4 productos seleccionados
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e] tracking-tight">
              Comparativa de Suplementos
            </h1>
            <p className="text-sm text-[#45464d] mt-1">
              Puntaje NutriScore, pureza certificada y coste por dosis normalizada de grado clínico.
            </p>
            {/* Category lock indicator */}
            {lockedCategory && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#565e74] bg-[#eceef0] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#006c49]" />
                  Comparando: <strong className="text-[#191c1e]">{lockedCategory}</strong>
                  <Info className="w-3 h-3 text-[#76777d]" title={`Solo puedes añadir productos de la categoría ${lockedCategory}`} />
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {products.length < 4 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#eceef0] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#006c49]" />
                Añadir Suplemento
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef0] text-[#45464d] hover:text-[#191c1e] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Exportar a archivo CSV"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>

            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-2 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            
            {/* Header & Product Titles */}
            <thead>
              <tr className="border-b border-[#e0e3e5] bg-[#f8fafc]">
                <th className="p-4 w-52 text-xs font-bold text-[#76777d] uppercase tracking-wider font-label-caps align-bottom">
                  Especificación
                </th>
                {products.map((prod) => (
                  <th key={prod.id} className="p-4 min-w-[220px] max-w-[280px] align-top relative border-l border-[#e0e3e5]">
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => onRemoveFromCompare(prod.id)}
                        className="p-1 rounded-lg text-[#76777d] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                        title="Quitar de la comparativa"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 mb-3 rounded-xl bg-white p-2 border border-[#e0e3e5] flex items-center justify-center">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#76777d] uppercase tracking-wider">
                        {prod.brand}
                      </span>
                      <h3 className="text-sm font-bold text-[#191c1e] line-clamp-2 mt-0.5">
                        {prod.name}
                      </h3>
                      <span className="text-xs text-[#45464d] mt-0.5">
                        {prod.format}
                      </span>
                    </div>
                  </th>
                ))}
                {products.length < 4 && (
                  <th className="p-4 min-w-[180px] border-l border-[#e0e3e5] bg-[#f2f4f6]/50 align-middle text-center">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex flex-col items-center justify-center p-6 w-full rounded-xl border-2 border-dashed border-[#c6c6cd] hover:border-[#006c49] text-[#76777d] hover:text-[#006c49] transition-all cursor-pointer group"
                    >
                      <Plus className="w-6 h-6 mb-1 text-[#76777d] group-hover:text-[#006c49] group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold">Añadir otro</span>
                    </button>
                  </th>
                )}
              </tr>

              {/* NutriScore Badge Row */}
              <tr className="bg-[#f2f4f6] border-b border-[#e0e3e5]">
                <td className="p-4 text-xs font-bold text-[#191c1e]">
                  Puntuación NutriScore
                </td>
                {products.map((prod) => {
                  const style = getNutriScoreColorClass(prod.nutriScore);
                  return (
                    <td key={prod.id} className="p-4 border-l border-[#e0e3e5] text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e0e3e5] shadow-xs">
                        <span className={`w-8 h-8 rounded-lg ${style.bg} ${style.text} flex items-center justify-center font-bold text-sm font-data-tabular shadow-xs`}>
                          {prod.nutriScore}
                        </span>
                        <div className="text-left">
                          <span className="text-xs font-bold text-[#191c1e] block">
                            {prod.scoreGrade || 'Grado Clínico'}
                          </span>
                          <span className="text-[10px] text-[#76777d] block font-data-tabular">
                            Algoritmo 2024
                          </span>
                        </div>
                      </div>
                    </td>
                  );
                })}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>
            </thead>

            {/* Table Body Groups */}
            <tbody className="divide-y divide-[#e0e3e5] text-xs">
              
              {/* GROUP: PRECIO & VALOR */}
              <tr className="bg-[#eceef0]/70">
                <td colSpan={products.length + (products.length < 4 ? 2 : 1)} className="px-4 py-2 text-[11px] font-bold text-[#006c49] uppercase tracking-wider font-label-caps">
                  1. Precio & Valor de Mercado
                </td>
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">Precio Total Envase</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5] font-bold text-sm text-[#191c1e] font-data-tabular">
                    {p.currency}{p.price.toFixed(2)}
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">Tomas / Servicios</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5] text-[#191c1e] font-data-tabular">
                    {p.servings} tomas ({p.servingSize})
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">
                  Coste por Dosis Efectiva
                  <span className="block text-[10px] text-[#76777d] font-normal">Normalizado a dosis estándar</span>
                </td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5]">
                    <span className="inline-block font-bold text-[#006c49] bg-[#6cf8bb]/30 px-2 py-0.5 rounded font-data-tabular">
                      {p.currency}{p.costPerDose.toFixed(2)} / toma
                    </span>
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              {/* GROUP: NUTRICIÓN & ESPECIFICACIONES */}
              <tr className="bg-[#eceef0]/70">
                <td colSpan={products.length + (products.length < 4 ? 2 : 1)} className="px-4 py-2 text-[11px] font-bold text-[#006c49] uppercase tracking-wider font-label-caps">
                  2. Nutrición & Pureza Química
                </td>
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">Ingrediente Activo Real</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5] font-semibold text-[#191c1e]">
                    {p.activeIngredientAmount}
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">Pureza Testada en Lab</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#e0e3e5] h-2 rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className="bg-[#006c49] h-full rounded-full"
                          style={{ width: `${Math.min(100, p.purityPct)}%` }}
                        />
                      </div>
                      <span className="font-bold text-[#191c1e] font-data-tabular">
                        {p.purityPct}%
                      </span>
                    </div>
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">Formato y Presentación</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5] text-[#191c1e]">
                    <span>{p.format}</span>
                    {p.flavour && (
                      <span className="block text-[11px] text-[#76777d] font-normal">Sabor: {p.flavour}</span>
                    )}
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">Alérgenos & Trazas</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5] text-[#45464d]">
                    {p.allergens}
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              {/* Fase 3 & 4: Fila de Aminograma */}
              <tr>
                <td className="p-4 font-medium text-[#45464d]">
                  Aminograma & Leucina (mTOR)
                  <span className="block text-[10px] text-[#76777d] font-normal">por 100g proteína</span>
                </td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5]">
                    <div className="space-y-0.5 font-data-tabular">
                      <span className="text-xs font-bold text-[#006c49] block">
                        {p.specs.aminogram?.leucine ? `${p.specs.aminogram.leucine}g Leucina` : (p.category === 'Creatina' ? 'Monohidrato 100%' : '10.5g Leucina')}
                      </span>
                      <span className="text-[11px] text-[#76777d] block">
                        {p.specs.aminogram?.totalBcaa ? `${p.specs.aminogram.totalBcaa}g BCAAs` : (p.category === 'Creatina' ? 'N/A' : '22.0g BCAAs')}
                      </span>
                    </div>
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              {/* Fila de Metales Pesados */}
              <tr>
                <td className="p-4 font-medium text-[#45464d]">Metales Pesados (Pb/Cd/Hg)</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#d0fbe4] text-[#005236]">
                      <Check className="w-3 h-3" />
                      &lt; 0.02 ppm (Conforme)
                    </span>
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              {/* GROUP: CALIDAD & TRANSPARENCIA */}
              <tr className="bg-[#eceef0]/70">
                <td colSpan={products.length + (products.length < 4 ? 2 : 1)} className="px-4 py-2 text-[11px] font-bold text-[#006c49] uppercase tracking-wider font-label-caps">
                  3. Calidad, Sellos & Seguridad
                </td>
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">Certificaciones Independientes</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5]">
                    <div className="flex flex-wrap gap-1">
                      {p.certifications.length > 0 ? (
                        p.certifications.map((cert) => (
                          <span key={cert} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#dae2fd] text-[#131b2e] font-semibold text-[11px]">
                            <ShieldCheck className="w-3 h-3 text-[#006c49]" />
                            {cert}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#76777d] italic">Sin sellos de terceros</span>
                      )}
                    </div>
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              <tr>
                <td className="p-4 font-medium text-[#45464d]">Transparencia de Etiquetado</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5]">
                    {p.transparencyLevel === 3 ? (
                      <span className="text-[#006c49] font-bold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 100% Desglosado
                      </span>
                    ) : p.transparencyLevel === 2 ? (
                      <span className="text-[#b87500] font-semibold">Parcialmente Desglosado</span>
                    ) : (
                      <span className="text-[#ba1a1a] font-semibold">Mezcla Patentada</span>
                    )}
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

              {/* ACTION ROW */}
              <tr className="bg-[#f8fafc]">
                <td className="p-4 font-bold text-[#191c1e]">Acciones Clínicas</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 border-l border-[#e0e3e5] space-y-2">
                    <button
                      onClick={() => onSelectProduct(p.id)}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-[#006c49] text-[#006c49] hover:bg-[#006c49] hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Ver Ficha Completa
                    </button>

                    <a
                      href={p.purchaseLinks[0]?.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Comprar en {p.purchaseLinks[0]?.store || 'Tienda'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                ))}
                {products.length < 4 && <td className="border-l border-[#e0e3e5]"></td>}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#e0e3e5] animate-in fade-in scale-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Añadir a la comparativa</h3>
                <p className="text-xs text-[#76777d]">Selecciona un suplemento para comparar lado a lado</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#76777d] hover:bg-[#f2f4f6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {availableToAdd.length > 0 ? (
                availableToAdd.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      onAddToCompare(item.id);
                      setShowAddModal(false);
                      showToast(`${item.name} añadido a la comparativa`);
                    }}
                    className="p-3 rounded-xl border border-[#e0e3e5] hover:border-[#006c49] hover:bg-[#f8fafc] cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-10 h-10 object-contain rounded bg-[#f2f4f6] p-1"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#191c1e]">{item.name}</p>
                        <p className="text-[11px] text-[#76777d]">{item.brand} • {item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#006c49] bg-[#6cf8bb]/30 px-2 py-0.5 rounded font-data-tabular">
                        Score {item.nutriScore}
                      </span>
                      <Plus className="w-4 h-4 text-[#006c49]" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center py-6 text-[#76777d]">
                  Todos los suplementos disponibles ya están en la comparativa.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
