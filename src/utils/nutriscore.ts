import { SupplementProduct } from '../types';

export interface NutriScoreInput {
  category: 'Creatina' | 'Proteína' | 'Omega-3' | 'Magnesio' | 'Pre-Entreno' | 'Multivitamínico';
  price: number;
  servings: number;
  activeIngredientAmount: number; // in grams or mg
  purityPct: number; // e.g. 99.9 or 95.0
  hasQualitySeal: boolean; // Creapure, IFOS, Kyowa, etc.
  isLowQualityForm: boolean; // Magnesium Oxide, poor creatine form, etc.
  transparencyLevel: 1 | 2 | 3; // 1: Blends, 2: Partial, 3: Full Disclosure
  certificationsCount: number; // count of independent lab tests
  additivePenaltyScore: number; // 0 to 5 (0 is clean, 5 is full of artificial fillers)
}

/**
 * NutriScore Algorithm for NutriCompare
 * Calculates a weighted clinical score from 0.0 to 10.0
 */
export function calculateNutriScore(input: NutriScoreInput): {
  totalScore: number;
  breakdown: {
    pureza: number;
    precioValor: number;
    transparencia: number;
    certificaciones: number;
    aditivos: number;
  };
  grade: string;
} {
  // 1. Pureza y Materia Prima (30%)
  let purityPoints = 0;
  if (input.hasQualitySeal) purityPoints += 4;
  if (input.purityPct) {
    purityPoints += (input.purityPct / 100) * 6;
  } else {
    purityPoints += 3;
  }
  if (input.isLowQualityForm) purityPoints -= 4;
  purityPoints = Math.max(0, Math.min(10, purityPoints));
  const scorePureza = purityPoints * 0.3;

  // 2. Relación Precio / Dosis Real (25%)
  const costPerDose = input.servings > 0 ? input.price / input.servings : 1;
  const costPerGramActive = input.activeIngredientAmount > 0 ? costPerDose / input.activeIngredientAmount : costPerDose;

  const benchmarks: Record<string, number> = {
    'Creatina': 0.08,
    'Proteína': 0.04,
    'Omega-3': 0.25,
    'Magnesio': 0.1,
    'Pre-Entreno': 0.07,
    'Multivitamínico': 0.15,
  };
  const benchmark = benchmarks[input.category] || 0.1;
  let pricePoints = (benchmark / (costPerGramActive || 0.01)) * 6.5;
  pricePoints = Math.max(1, Math.min(10, pricePoints));
  const scorePrecio = pricePoints * 0.25;

  // 3. Transparencia del Etiquetado (20%)
  const transparencyMap: Record<number, number> = { 1: 3, 2: 7, 3: 10 };
  const transparencyPoints = transparencyMap[input.transparencyLevel] || 6;
  const scoreTransparencia = transparencyPoints * 0.2;

  // 4. Certificaciones y Seguridad (15%)
  const certPoints = Math.min(10, input.certificationsCount * 3.33);
  const scoreCert = certPoints * 0.15;

  // 5. Perfil de Aditivos y Alérgenos (10%)
  const additivePoints = Math.max(0, 10 - (input.additivePenaltyScore * 2));
  const scoreAditivos = additivePoints * 0.1;

  const rawScore = scorePureza + scorePrecio + scoreTransparencia + scoreCert + scoreAditivos;
  const totalScore = Math.max(1.0, Math.min(9.9, Math.round(rawScore * 10) / 10));

  let grade = 'Grado C';
  if (totalScore >= 9.5) grade = 'Grado A+';
  else if (totalScore >= 9.0) grade = 'Grado A';
  else if (totalScore >= 8.0) grade = 'Grado B+';
  else if (totalScore >= 7.0) grade = 'Grado B';
  else if (totalScore >= 5.0) grade = 'Grado C';
  else grade = 'No Recomendado';

  return {
    totalScore,
    breakdown: {
      pureza: Math.round(purityPoints * 10) / 10,
      precioValor: Math.round(pricePoints * 10) / 10,
      transparencia: Math.round(transparencyPoints * 10) / 10,
      certificaciones: Math.round(certPoints * 10) / 10,
      aditivos: Math.round(additivePoints * 10) / 10,
    },
    grade,
  };
}

export function getNutriScoreColorClass(score: number): {
  bg: string;
  text: string;
  border?: string;
  badgeBg: string;
  badgeText: string;
} {
  if (score >= 9.0) {
    return {
      bg: 'bg-[#006c49]',
      text: 'text-white',
      badgeBg: 'bg-[#006c49]',
      badgeText: 'text-white',
      border: 'border-[#006c49]',
    };
  }
  if (score >= 8.0) {
    return {
      bg: 'bg-[#4edea3]',
      text: 'text-[#002113]',
      badgeBg: 'bg-[#6cf8bb]',
      badgeText: 'text-[#00714d]',
      border: 'border-[#4edea3]',
    };
  }
  if (score >= 6.0) {
    return {
      bg: 'bg-[#ffb95f]',
      text: 'text-[#2a1700]',
      badgeBg: 'bg-[#ffddb8]',
      badgeText: 'text-[#653e00]',
      border: 'border-[#ffb95f]',
    };
  }
  return {
    bg: 'bg-[#e0e3e5]',
    text: 'text-[#191c1e]',
    badgeBg: 'bg-[#e0e3e5]',
    badgeText: 'text-[#45464d]',
    border: 'border-[#76777d]',
  };
}

export function formatCurrency(amount: number, currency = '€'): string {
  return `${currency}${amount.toFixed(2)}`;
}
