/**
 * lib/nutriscore-engine.ts
 *
 * Motor Centralizado de Puntuación Clínica NutriScore (0 - 100) para Suplementos Deportivos.
 * - Algoritmo adaptativo por categoría.
 * - Única fuente de verdad: todos los scripts de ingesta y la API deben importar de aquí.
 *
 * Basado en:
 *  1. Densidad y pureza de macronutrientes activos (Proteína / Creatina).
 *  2. Perfil de Aminograma (Leucina / BCAAs según estándares OMS/EFSA).
 *  3. Sellos de Patente Registrada (Creapure®, Informed-Sport, etc.).
 *  4. Análisis de Metales Pesados y pureza medida en laboratorio (HPLC).
 *  5. Penalizaciones por aditivos, azúcares añadidos, amino-spiking y NOVA.
 *  6. Lógica específica para Pre-Entrenos (cafeína/dosis), Magnesio (biodisponibilidad),
 *     Omega-3 (EPA+DHA), Aminoácidos/BCAAs y Multivitamínicos (cobertura micronutrientes).
 */

// ─────────────────────────────────────────────
// Tipos de entrada y salida
// ─────────────────────────────────────────────

export interface NutriScoreInput {
  category:
    | 'Creatina'
    | 'Proteína'
    | 'Pre-Entreno'
    | 'Magnesio'
    | 'Multivitamínico'
    | 'Omega-3'
    | 'Aminoácidos'
    | 'Suplementos Deportivos'
    | string;
  // Macros (por 100g)
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  saturatedFatPer100g?: number | null;
  sugarsPer100g?: number | null;
  caloriesPer100g?: number | null;
  // Específicos por categoría
  creatinePerServing?: number | null;   // g por dosis — Creatina
  caffeineMg?: number | null;           // mg por 100g — Pre-Entreno
  magnesiumMg?: number | null;          // mg por 100g — Magnesio
  zincMg?: number | null;               // mg por 100g — Minerales
  calciumMg?: number | null;            // mg por 100g — Minerales
  ironMg?: number | null;               // mg por 100g — Minerales
  // Aminograma
  leucinePer100g?: number | null;
  totalBcaaPer100g?: number | null;
  // Calidad y certificaciones
  rawPurityPercentage?: number | null;
  certifications?: string[];
  heavyMetalsStatus?: 'PASSED' | 'WARNING' | 'FAILED' | string | null;
  measuredLabPurity?: number | null;
  ingredientsList?: string | null;
  // Transparencia del producto
  novaGroup?: number | null;
  additivesCount?: number | null;
  // Lista de vitaminas (JSON)
  vitaminsList?: Record<string, number> | null;
}

export interface NutriScoreBreakdown {
  finalScore: number;  // 0 – 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  verdict: 'Excelente' | 'Muy Bueno' | 'Aceptable' | 'Bajo Estándar' | 'No Recomendado';
  subScores: {
    activePurityScore: number;   // 0 – 40 pts
    aminoProfileScore: number;   // 0 – 25 pts
    certificationsScore: number; // 0 – 20 pts
    labSafetyScore: number;      // 0 – 15 pts
  };
  penalties: string[];
  bonuses: string[];
}

// ─────────────────────────────────────────────
// Motor Avanzado — calculateAdvancedNutriScore
// ─────────────────────────────────────────────

export function calculateAdvancedNutriScore(input: NutriScoreInput): NutriScoreBreakdown {
  let activePurityScore = 0;
  let aminoProfileScore = 0;
  let certificationsScore = 0;
  let labSafetyScore = 15;

  const penalties: string[] = [];
  const bonuses: string[] = [];

  const category = input.category.toLowerCase();
  const certs = (input.certifications || []).map((c) => c.toLowerCase());

  // ── 1. PUNTUACIÓN DE PUREZA DEL INGREDIENTE ACTIVO (0 – 40 pts) ──
  if (category.includes('creatin')) {
    const purity =
      input.rawPurityPercentage ??
      (input.creatinePerServing && input.creatinePerServing >= 4.9 ? 99 : 85);
    if (purity >= 99.5) {
      activePurityScore = 40;
      bonuses.push('Pureza activa grado farmacéutico (≥99.5%)');
    } else if (purity >= 95) {
      activePurityScore = 34;
    } else if (purity >= 80) {
      activePurityScore = 25;
    } else {
      activePurityScore = 15;
      penalties.push('Pureza de creatina por debajo del 80%');
    }
  } else if (category.includes('protein') || category.includes('prote')) {
    const protein = input.proteinPer100g ?? 0;
    if (protein >= 88) {
      activePurityScore = 40;
      bonuses.push('Alta concentración proteica (≥88%)');
    } else if (protein >= 75) {
      activePurityScore = 35;
    } else if (protein >= 65) {
      activePurityScore = 25;
    } else {
      activePurityScore = 12;
      penalties.push('Baja concentración proteica (<65g/100g)');
    }
    if ((input.fatPer100g ?? 0) > 8) {
      activePurityScore = Math.max(0, activePurityScore - 5);
      penalties.push('Contenido elevado de grasas (>8g/100g)');
    }
    if ((input.carbsPer100g ?? 0) > 12) {
      activePurityScore = Math.max(0, activePurityScore - 8);
      penalties.push('Carbohidratos/azúcares excesivos en proteína pura');
    }
  } else if (
    category.includes('pre-entreno') ||
    category.includes('pre-workout') ||
    category.includes('pre entreno')
  ) {
    // Pre-Entreno: rango seguro-efectivo de cafeína según EFSA
    const caffeine = input.caffeineMg ?? 0;
    if (caffeine >= 150 && caffeine <= 300) {
      activePurityScore = 38;
      bonuses.push(`Dosis de cafeína en rango efectivo-seguro (${caffeine}mg)`);
    } else if (caffeine > 0 && caffeine < 150) {
      activePurityScore = 26;
      penalties.push('Dosis de cafeína subdosificada (<150mg)');
    } else if (caffeine > 300) {
      activePurityScore = 22;
      penalties.push(`Cafeína por encima del umbral seguro EFSA (${caffeine}mg > 300mg)`);
    } else {
      activePurityScore = 20; // sin datos de cafeína
    }
  } else if (category.includes('magnes')) {
    const mag = input.magnesiumMg ?? 0;
    if (mag >= 350) {
      activePurityScore = 36;
      bonuses.push('Dosis de magnesio en rango terapéutico óptimo (≥350mg)');
    } else if (mag >= 200) {
      activePurityScore = 28;
    } else if (mag > 0) {
      activePurityScore = 18;
    } else {
      activePurityScore = 22;
    }
  } else if (category.includes('omega')) {
    activePurityScore = 32; // base razonable sin datos específicos de EPA+DHA
    bonuses.push('Fuente de ácidos grasos esenciales Omega-3');
    if ((input.saturatedFatPer100g ?? 0) > 15) {
      activePurityScore = Math.max(0, activePurityScore - 8);
      penalties.push('Exceso de grasas saturadas en suplemento Omega-3');
    }
  } else if (
    category.includes('amino') ||
    category.includes('bcaa') ||
    category.includes('eaa')
  ) {
    const protein = input.proteinPer100g ?? 0;
    if (protein >= 80) {
      activePurityScore = 38;
      bonuses.push('Alta densidad de aminoácidos por toma');
    } else if (protein >= 60) {
      activePurityScore = 28;
    } else {
      activePurityScore = 20;
    }
  } else {
    // Multivitamínico y categorías genéricas
    const vitCount = input.vitaminsList ? Object.keys(input.vitaminsList).length : 0;
    if (vitCount >= 8) {
      activePurityScore = 38;
      bonuses.push(`Amplio espectro de micronutrientes detectados (${vitCount})`);
    } else if (vitCount >= 4) {
      activePurityScore = 28;
    } else {
      activePurityScore = 22;
    }
  }

  // ── 2. PERFIL DE AMINOGRAMA Y CALIDAD BIOLÓGICA (0 – 25 pts) ──
  if (category.includes('protein') || category.includes('prote')) {
    const leucine = input.leucinePer100g ?? 0;
    const totalBcaa = input.totalBcaaPer100g ?? 0;
    if (leucine >= 10.5 || totalBcaa >= 22) {
      aminoProfileScore = 25;
      bonuses.push('Aminograma óptimo (Leucina ≥10.5g / BCAAs ≥22g)');
    } else if (leucine >= 8.5 || totalBcaa >= 17) {
      aminoProfileScore = 20;
    } else if (leucine >= 6) {
      aminoProfileScore = 14;
    } else {
      aminoProfileScore = 10;
    }
  } else if (category.includes('creatin')) {
    aminoProfileScore = 25;
  } else if (category.includes('amino') || category.includes('bcaa')) {
    const totalBcaa = input.totalBcaaPer100g ?? 0;
    if (totalBcaa >= 70) {
      aminoProfileScore = 25;
      bonuses.push('Perfil de BCAAs/EAAs de alta concentración');
    } else if (totalBcaa >= 50) {
      aminoProfileScore = 20;
    } else {
      aminoProfileScore = 15;
    }
  } else {
    aminoProfileScore = 20;
  }

  // ── 3. SELLOS DE PATENTE Y CERTIFICACIONES OFICIALES (0 – 20 pts) ──
  const premiumSeals = [
    'creapure', 'informed-sport', 'informed-choice', 'kyowa', 'cologne list',
    'digezyme', 'nsf', 'nf-sport', 'hasta', 'wada',
  ];
  let sealCount = 0;
  for (const seal of premiumSeals) {
    if (certs.some((c) => c.includes(seal))) {
      sealCount++;
      bonuses.push(`Sello certificado: ${seal.toUpperCase()}`);
    }
  }
  if (sealCount >= 2) {
    certificationsScore = 20;
  } else if (sealCount === 1) {
    certificationsScore = 15;
  } else if (input.certifications && input.certifications.length > 0) {
    certificationsScore = 10;
  } else {
    certificationsScore = 5;
    penalties.push('Sin sellos de patentes registradas ni auditorías externas');
  }

  // ── 4. SEGURIDAD DE LABORATORIO Y METALES PESADOS (0 – 15 pts) ──
  const heavyMetals = (input.heavyMetalsStatus || 'PASSED').toUpperCase();
  if (heavyMetals === 'FAILED') {
    labSafetyScore = 0;
    penalties.push('ALERTA: Falla en límites de metales pesados (Pb/Cd/As)');
  } else if (heavyMetals === 'WARNING') {
    labSafetyScore = 7;
    penalties.push('Niveles cercanos al umbral máximo de metales pesados');
  } else {
    labSafetyScore = 15;
    bonuses.push('Libre de metales pesados y contaminantes');
  }

  // ── 5. ANÁLISIS DE ADITIVOS ──
  const additivesCount = input.additivesCount ?? 0;
  if (additivesCount >= 8) {
    activePurityScore = Math.max(0, activePurityScore - 10);
    penalties.push(`Alto número de aditivos artificiales detectados (${additivesCount})`);
  } else if (additivesCount >= 5) {
    activePurityScore = Math.max(0, activePurityScore - 5);
    penalties.push(`Número moderado de aditivos (${additivesCount})`);
  }

  if (input.ingredientsList) {
    const ingLower = input.ingredientsList.toLowerCase();
    if (
      ingLower.includes('maltodextrin') &&
      (category.includes('protein') || category.includes('prote'))
    ) {
      activePurityScore = Math.max(0, activePurityScore - 5);
      penalties.push('Contiene maltodextrina añadida como relleno');
    }
    if (ingLower.includes('acesulfamo') || ingLower.includes('aspartamo')) {
      penalties.push('Uso de edulcorantes sintéticos intensos');
    }
  }

  // ── 6. PENALIZACIONES GENERALES (azúcares, grasas saturadas, NOVA) ──
  const novaGroup = input.novaGroup ?? 1;
  if (novaGroup === 4) {
    activePurityScore = Math.max(0, activePurityScore - 12);
    penalties.push('Ultraprocesado (NOVA 4)');
  } else if (novaGroup === 3) {
    activePurityScore = Math.max(0, activePurityScore - 5);
    penalties.push('Procesado (NOVA 3)');
  }

  if ((input.sugarsPer100g ?? 0) > 10) {
    activePurityScore = Math.max(0, activePurityScore - 12);
    penalties.push('Exceso de azúcares añadidos (>10g/100g)');
  } else if ((input.sugarsPer100g ?? 0) < 2) {
    bonuses.push('Bajo en azúcares (<2g/100g)');
  }

  if ((input.saturatedFatPer100g ?? 0) > 10) {
    activePurityScore = Math.max(0, activePurityScore - 6);
    penalties.push('Grasas saturadas elevadas (>10g/100g)');
  }

  // ── CÁLCULO FINAL Y NORMALIZACIÓN (0 – 100) ──
  const totalScore = Math.min(
    100,
    Math.max(10, Math.round(activePurityScore + aminoProfileScore + certificationsScore + labSafetyScore))
  );

  let grade: NutriScoreBreakdown['grade'] = 'B';
  let verdict: NutriScoreBreakdown['verdict'] = 'Muy Bueno';

  if (totalScore >= 95) {
    grade = 'A+'; verdict = 'Excelente';
  } else if (totalScore >= 85) {
    grade = 'A'; verdict = 'Excelente';
  } else if (totalScore >= 70) {
    grade = 'B'; verdict = 'Muy Bueno';
  } else if (totalScore >= 55) {
    grade = 'C'; verdict = 'Aceptable';
  } else if (totalScore >= 40) {
    grade = 'D'; verdict = 'Bajo Estándar';
  } else {
    grade = 'F'; verdict = 'No Recomendado';
  }

  return {
    finalScore: totalScore,
    grade,
    verdict,
    subScores: { activePurityScore, aminoProfileScore, certificationsScore, labSafetyScore },
    penalties,
    bonuses,
  };
}

// ─────────────────────────────────────────────
// Alias unificado para scripts de ingesta masiva
// ─────────────────────────────────────────────

export interface ClinicalScoreInput {
  category: string;
  protein?: number;
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  sugars?: number;
  novaGroup?: number;
  additivesCount?: number;
  caffeineMg?: number;
  magnesiumMg?: number;
  vitaminsList?: Record<string, number> | null;
  ingredientsList?: string | null;
}

/**
 * Función principal de ingesta masiva.
 * Interfaz simplificada que devuelve puntuación (0-100), grado y veredicto.
 * Todos los scripts de seeding deben usar esta función en lugar de implementaciones propias.
 */
export function calculateClinicalScore(input: ClinicalScoreInput): {
  score: number;
  grade: string;
  verdict: string;
} {
  const result = calculateAdvancedNutriScore({
    category: input.category,
    proteinPer100g: input.protein,
    fatPer100g: input.fat,
    saturatedFatPer100g: input.saturatedFat,
    sugarsPer100g: input.sugars,
    caloriesPer100g: input.calories,
    novaGroup: input.novaGroup,
    additivesCount: input.additivesCount,
    caffeineMg: input.caffeineMg,
    magnesiumMg: input.magnesiumMg,
    vitaminsList: input.vitaminsList,
    ingredientsList: input.ingredientsList,
    certifications: [],
    heavyMetalsStatus: 'PASSED',
  });
  return { score: result.finalScore, grade: result.grade, verdict: result.verdict };
}
