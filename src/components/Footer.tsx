import React from 'react';
import { ShieldCheck, Lock, FileText, FlaskConical } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-16 border-t border-[#e0e3e5] bg-white py-12 text-[#45464d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Clinical Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#006c49] flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-[#191c1e]">
                Nutri<span className="text-[#006c49]">Compare</span>
              </span>
            </div>
            <p className="text-xs text-[#76777d] leading-relaxed">
              Plataforma independiente de análisis clínico y auditoría de suplementación nutricional. Algoritmo abierto y datos contrastados.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#191c1e] font-label-caps">
              Navegación
            </p>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('directorio')} className="hover:text-[#006c49] transition-colors">
                  Directorio de Suplementos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('rankings')} className="hover:text-[#006c49] transition-colors">
                  Rankings Oficiales
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('metodos')} className="hover:text-[#006c49] transition-colors">
                  Metodología NutriScore
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-[#006c49] transition-colors">
                  Artículos & Ciencia
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Transparencia */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#191c1e] font-label-caps">
              Estándares
            </p>
            <ul className="space-y-1.5 text-xs text-[#76777d]">
              <li className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-[#006c49]" />
                Auditorías WADA / AMA
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006c49]" />
                Validación de Sellos Creapure®
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#006c49]" />
                Cero Publicidad Encubierta
              </li>
            </ul>
          </div>

          {/* Col 4: Aviso Legal */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#191c1e] font-label-caps">
              Divulgación Médica
            </p>
            <p className="text-[11px] text-[#76777d] leading-relaxed">
              La información provista por NutriCompare tiene fines puramente educativos e informativos y no sustituye el diagnóstico o prescripción médica profesional.
            </p>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#f2f4f6] flex flex-col sm:flex-row items-center justify-between text-xs text-[#76777d] gap-4">
          <p>© 2024 NutriCompare. Datos de Grado Clínico. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Términos de Servicio</span>
            <span className="hover:underline cursor-pointer">Política de Privacidad</span>
            <span className="hover:underline cursor-pointer">Código Ético</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
