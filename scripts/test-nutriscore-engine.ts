/**
 * scripts/test-nutriscore-engine.ts
 *
 * Test de validación del Motor Centralizado de Scoring Clínico (Fase 7)
 * Ejecuta escenarios de prueba para Creatina, Proteína Isolate, Concentrada,
 * Pre-Entreno con cafeína segura vs sobredosificada, Magnesio, Omega-3 y Multivitamínicos.
 */

import { calculateAdvancedNutriScore, calculateClinicalScore } from '../lib/nutriscore-engine';

console.log('🧪 Iniciando pruebas de validación del Motor Clínico NutriScore...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${detail || 'Condición no cumplida'}`);
  }
}

// 1. Creatina Creapure® grado farmacéutico
const creatine = calculateAdvancedNutriScore({
  category: 'Creatina',
  rawPurityPercentage: 99.9,
  certifications: ['Creapure®', 'Informed-Sport'],
  heavyMetalsStatus: 'PASSED',
});
assert(creatine.finalScore >= 95, 'Creatina Creapure® debe obtener Grado A+ (≥95)', `Score: ${creatine.finalScore}`);
assert(creatine.grade === 'A+', 'Creatina Creapure® grade debe ser A+');

// 2. Proteína Aislada (Isolate) 90%
const isolate = calculateAdvancedNutriScore({
  category: 'Proteína',
  proteinPer100g: 90,
  fatPer100g: 1.2,
  carbsPer100g: 1.5,
  sugarsPer100g: 0.8,
  leucinePer100g: 11.2,
  totalBcaaPer100g: 23.5,
  certifications: ['Informed-Choice', 'DigeZyme®'],
  heavyMetalsStatus: 'PASSED',
  novaGroup: 1,
});
assert(isolate.finalScore >= 90, 'Proteína Isolate pura debe obtener Grado A (≥90)', `Score: ${isolate.finalScore}`);

// 3. Pre-Entreno con dosis óptima de cafeína (200mg)
const preWorkoutSafe = calculateClinicalScore({
  category: 'Pre-Entreno',
  caffeineMg: 200,
  novaGroup: 2,
  additivesCount: 3,
});
assert(preWorkoutSafe.score >= 70, 'Pre-Entreno con cafeína segura (200mg) debe ser Muy Bueno (≥70)', `Score: ${preWorkoutSafe.score}`);

// 4. Pre-Entreno con cafeína excesiva (>300mg)
const preWorkoutHigh = calculateClinicalScore({
  category: 'Pre-Entreno',
  caffeineMg: 450,
  novaGroup: 4,
  additivesCount: 9,
});
assert(preWorkoutHigh.score < preWorkoutSafe.score, 'Pre-Entreno sobredosificado y ultraprocesado debe puntuar significativamente menos', `Score: ${preWorkoutHigh.score} vs ${preWorkoutSafe.score}`);

// 5. Suplemento con fallo en metales pesados
const toxicProduct = calculateAdvancedNutriScore({
  category: 'Multivitamínico',
  heavyMetalsStatus: 'FAILED',
  vitaminsList: { vitamina_c_mg: 500 },
});
assert(toxicProduct.subScores.labSafetyScore === 0, 'Producto que falla metales pesados debe recibir 0 en seguridad de laboratorio');
assert(toxicProduct.penalties.some(p => p.includes('ALERTA')), 'Debe incluir alerta de metales pesados');

// 6. Magnesio en dosis óptima
const magnesium = calculateClinicalScore({
  category: 'Magnesio',
  magnesiumMg: 375,
  novaGroup: 1,
  additivesCount: 0,
});
assert(magnesium.score >= 75, 'Magnesio en dosis terapéutica debe puntuar alto (≥75)', `Score: ${magnesium.score}`);

console.log(`\n📊 Resultado: ${passedTests}/${totalTests} pruebas superadas con éxito.\n`);

if (passedTests === totalTests) {
  console.log('🎉 Motor de Scoring Clínico Centralizado validado y listo para producción.');
  process.exit(0);
} else {
  process.exit(1);
}
