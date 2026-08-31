/**
 * scripts/seed-openfoodfacts-v2.ts
 * 
 * Pipeline de ingestión estática ULTRA-RÁPIDO para Open Food Facts (OFF)
 * 
 * Mejoras de rendimiento v2:
 * 1. 🚀 Concurrencia en paralelo (20 productos simultáneos con Promise.all).
 * 2. ⚡ Caché en memoria de Marcas y Categorías (evita miles de consultas repetidas).
 * 3. 🛡️ Sistema de auto-reintentos exponenciales (máximo 3 intentos por producto ante micro-cortes).
 * 4. ⏩ Reanudación instantánea con flag `--start-line <número>`.
 * 
 * Uso:
 *   npx tsx scripts/seed-openfoodfacts-v2.ts data/openfoodfacts-products.jsonl.gz
 *   npx tsx scripts/seed-openfoodfacts-v2.ts data/openfoodfacts-products.jsonl.gz --start-line 501202
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { PrismaClient } from '@prisma/client';
import { calculateClinicalScore } from '../lib/nutriscore-engine';

const prisma = new PrismaClient();

// Caché en memoria de IDs de marcas y categorías para no hacer queries redundantes a Neon
const brandCache = new Map<string, string>();     // slug -> brandId
const categoryCache = new Map<string, string>();  // slug -> categoryId

// Patrones Regex de detección de suplementos fitness (multilingüe: es, en, fr, de, it, pt)
const FITNESS_PATTERNS: RegExp[] = [
  /supplement/i,
  /suplemento/i,
  /suppl[eé]ment/i,
  /nahrungserg[aä]nzung/i,
  /prote[ií]n/i,
  /whey/i,
  /suero\s+de/i,
  /lactos[eé]rum/i,
  /cr[eé]atin/i,
  /omega[\s\-_]?3/i,
  /vitamin/i,
  /mineral/i,
  /amino[\s\-]?acid/i,
  /amino[aá]cido/i,
  /acide\s+amin[eé]/i,
  /\bbcaa\b/i,
  /\beaa\b/i,
  /glutamin/i,
  /magn[eé]sium/i,
  /magnesio/i,
  /zinc/i,
  /cinc\b/i,
  /carnitin/i,
  /pre[\s\-_]?workout/i,
  /pre[\s\-_]?entreno/i,
  /citrulin/i,
  /beta[\s\-_]?alanin/i,
  /mass\s+gainer/i,
  /electrolyte/i,
  /electrolito/i,
  /casein/i,
  /case[ií]na/i,
  /isolate/i,
  /aislado/i,
];

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fat_100g?: number;
  'saturated-fat_100g'?: number;
  salt_100g?: number;
  sodium_100g?: number;
  fiber_100g?: number;
  magnesium_100g?: number;
  potassium_100g?: number;
  zinc_100g?: number;
  calcium_100g?: number;
  iron_100g?: number;
  caffeine_100g?: number;
  caffeine_serving?: number;
  'vitamin-c_100g'?: number;
  'vitamin-d_100g'?: number;
  'vitamin-b12_100g'?: number;
  'vitamin-b6_100g'?: number;
  'vitamin-a_100g'?: number;
  'vitamin-e_100g'?: number;
  'vitamin-b9_100g'?: number; // Ácido fólico
  [key: string]: number | undefined;
}

interface OFFProduct {
  code?: string; // EAN / Barcode
  product_name?: string;
  product_name_es?: string;
  product_name_en?: string;
  brands?: string;
  categories_tags?: string[];
  categories?: string;
  labels_tags?: string[];
  allergens_tags?: string[];
  additives_tags?: string[];
  nova_group?: number;
  ecoscore_grade?: string;
  quantity?: string;
  url?: string;
  link?: string;
  // Diccionario de imágenes del volcado JSONL: { "front_en": { "rev": "10", ... }, ... }
  images?: Record<string, { rev?: string | number; sizes?: Record<string, unknown> } | unknown>;
  selected_images?: {
    front?: { display?: Record<string, string>; small?: Record<string, string>; thumb?: Record<string, string> };
    nutrition?: { display?: Record<string, string>; small?: Record<string, string> };
    ingredients?: { display?: Record<string, string>; small?: Record<string, string> };
    packaging?: { display?: Record<string, string>; small?: Record<string, string> };
  };
  // Campos directos de URL de imagen en el volcado
  image_url?: string;
  image_front_url?: string;              // 400px con rev
  image_front_display_url?: string;      // tamaño display con rev
  image_front_small_url?: string;        // 200px con rev
  image_front_thumb_url?: string;
  image_display_url?: string;
  image_small_url?: string;
  image_thumb_url?: string;
  image_nutrition_url?: string;
  image_nutrition_display_url?: string;
  image_ingredients_url?: string;
  image_packaging_url?: string;
  countries_tags?: string[];
  origins?: string;
  serving_size?: string;
  ingredients_text?: string;
  ingredients_text_es?: string;
  nutriments?: OFFNutriments;
  nutriscore_score?: number;
}

/**
 * Obtiene el número de revisión de una entrada del mapa images de Open Food Facts.
 */
function getImageRev(entry: unknown): string | null {
  if (entry && typeof entry === 'object') {
    const rev = (entry as Record<string, unknown>).rev;
    if (rev !== undefined && rev !== null && rev !== '') return String(rev);
  }
  return null;
}

/**
 * Extrae la revisión de una imagen de Open Food Facts soportando tanto:
 * 1. Formato nuevo: item.images.selected[type][lang].rev
 * 2. Formato clásico: item.images[`${type}_${lang}`].rev
 */
function findImageRev(images: Record<string, any> | undefined, type: string, langPreferences: string[] = ['es', 'en', 'fr', 'de', 'it', 'pt']): { rev: string; lang: string } | null {
  if (!images || typeof images !== 'object') return null;

  // 1. Formato moderno (images.selected[type][lang])
  const selectedObj = images.selected;
  if (selectedObj && typeof selectedObj === 'object' && selectedObj[type]) {
    const typeObj = selectedObj[type];
    for (const lang of langPreferences) {
      if (typeObj[lang]) {
        const rev = getImageRev(typeObj[lang]);
        if (rev) return { rev, lang };
      }
    }
    // Si no coincide con las preferencias de idioma, tomar el primer idioma disponible
    for (const lang of Object.keys(typeObj)) {
      const rev = getImageRev(typeObj[lang]);
      if (rev) return { rev, lang };
    }
  }

  // 2. Formato clásico (images[`${type}_${lang}`])
  for (const lang of langPreferences) {
    const key = `${type}_${lang}`;
    if (images[key]) {
      const rev = getImageRev(images[key]);
      if (rev) return { rev, lang };
    }
  }
  if (images[type]) {
    const rev = getImageRev(images[type]);
    if (rev) return { rev, lang: '' };
  }

  return null;
}

/**
 * Construye la URL oficial de imagen frontal (400px)
 */
function resolveOFFFrontImageUrl(barcode: string, item: OFFProduct): string | null {
  const directUrl =
    item.image_front_url ||
    item.image_front_display_url ||
    item.selected_images?.front?.display?.es ||
    item.selected_images?.front?.display?.en ||
    item.selected_images?.front?.display?.fr ||
    item.image_display_url ||
    item.image_url;

  if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
    return directUrl;
  }

  const barcodeStr = (barcode || item.code || '').trim();
  if (!barcodeStr || !item.images || Object.keys(item.images).length === 0) return null;

  const padded = barcodeStr.length < 13 && /^\d+$/.test(barcodeStr) ? barcodeStr.padStart(13, '0') : barcodeStr;
  const basePath = padded.length === 13
    ? `https://images.openfoodfacts.org/images/products/${padded.slice(0, 3)}/${padded.slice(3, 6)}/${padded.slice(6, 9)}/${padded.slice(9)}/`
    : `https://images.openfoodfacts.org/images/products/${barcodeStr}/`;

  // Buscar en selected / clásico
  const found = findImageRev(item.images, 'front', ['es', 'en', 'fr', 'de', 'it', 'pt']);
  if (found) {
    const key = found.lang ? `front_${found.lang}` : 'front';
    return `${basePath}${key}.${found.rev}.400.jpg`;
  }

  // Fallback: fotos brutas en uploaded o claves numéricas
  const uploaded = (item.images.uploaded as Record<string, any>) || item.images;
  const numericKeys = Object.keys(uploaded).filter((k) => /^\d+$/.test(k)).sort();
  for (const num of numericKeys) {
    const entry = uploaded[num];
    const rev = getImageRev(entry);
    if (rev) return `${basePath}${num}.${rev}.400.jpg`;
    return `${basePath}${num}.400.jpg`;
  }

  return null;
}

/**
 * Construye la URL oficial de miniatura frontal (200px / small)
 */
function resolveOFFFrontSmallImageUrl(barcode: string, item: OFFProduct): string | null {
  const directUrl =
    item.image_front_small_url ||
    item.image_front_thumb_url ||
    item.selected_images?.front?.small?.es ||
    item.selected_images?.front?.small?.en ||
    item.image_small_url ||
    item.image_thumb_url;

  if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
    return directUrl;
  }

  const barcodeStr = (barcode || item.code || '').trim();
  if (!barcodeStr || !item.images || Object.keys(item.images).length === 0) return null;

  const padded = barcodeStr.length < 13 && /^\d+$/.test(barcodeStr) ? barcodeStr.padStart(13, '0') : barcodeStr;
  const basePath = padded.length === 13
    ? `https://images.openfoodfacts.org/images/products/${padded.slice(0, 3)}/${padded.slice(3, 6)}/${padded.slice(6, 9)}/${padded.slice(9)}/`
    : `https://images.openfoodfacts.org/images/products/${barcodeStr}/`;

  const found = findImageRev(item.images, 'front', ['es', 'en', 'fr', 'de', 'it', 'pt']);
  if (found) {
    const key = found.lang ? `front_${found.lang}` : 'front';
    return `${basePath}${key}.${found.rev}.200.jpg`;
  }

  return null;
}

/**
 * Construye la URL oficial de la tabla nutricional
 */
function resolveOFFNutritionUrl(barcode: string, item: OFFProduct): string | null {
  const directUrl =
    item.image_nutrition_url ||
    item.image_nutrition_display_url ||
    item.selected_images?.nutrition?.display?.es ||
    item.selected_images?.nutrition?.display?.en ||
    item.selected_images?.nutrition?.display?.fr;

  if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
    return directUrl;
  }

  const barcodeStr = (barcode || item.code || '').trim();
  if (!barcodeStr || !item.images) return null;

  const padded = barcodeStr.length < 13 && /^\d+$/.test(barcodeStr) ? barcodeStr.padStart(13, '0') : barcodeStr;
  const basePath = padded.length === 13
    ? `https://images.openfoodfacts.org/images/products/${padded.slice(0, 3)}/${padded.slice(3, 6)}/${padded.slice(6, 9)}/${padded.slice(9)}/`
    : `https://images.openfoodfacts.org/images/products/${barcodeStr}/`;

  const found = findImageRev(item.images, 'nutrition', ['es', 'en', 'fr', 'de', 'it', 'pt']);
  if (found) {
    const key = found.lang ? `nutrition_${found.lang}` : 'nutrition';
    return `${basePath}${key}.${found.rev}.400.jpg`;
  }

  return null;
}

/**
 * Construye la URL de la foto del envase/packaging
 */
function resolveOFFPackagingUrl(barcode: string, item: OFFProduct): string | null {
  const directUrl =
    item.image_packaging_url ||
    item.selected_images?.packaging?.display?.es ||
    item.selected_images?.packaging?.display?.en;

  if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
    return directUrl;
  }

  const barcodeStr = (barcode || item.code || '').trim();
  if (!barcodeStr || !item.images) return null;

  const padded = barcodeStr.length < 13 && /^\d+$/.test(barcodeStr) ? barcodeStr.padStart(13, '0') : barcodeStr;
  const basePath = padded.length === 13
    ? `https://images.openfoodfacts.org/images/products/${padded.slice(0, 3)}/${padded.slice(3, 6)}/${padded.slice(6, 9)}/${padded.slice(9)}/`
    : `https://images.openfoodfacts.org/images/products/${barcodeStr}/`;

  const found = findImageRev(item.images, 'packaging', ['es', 'en', 'fr', 'de', 'it', 'pt']);
  if (found) {
    const key = found.lang ? `packaging_${found.lang}` : 'packaging';
    return `${basePath}${key}.${found.rev}.400.jpg`;
  }

  return null;
}

/**
 * Extrae y formatea el desglose de vitaminas y minerales como JSON estructurado
 */
function extractVitaminsList(nutriments?: OFFNutriments): Record<string, number> | null {
  if (!nutriments) return null;

  const vitamins: Record<string, number> = {};
  const vitaminKeys: Array<[string, string, number]> = [
    ['vitamin-c_100g', 'vitaminaC_mg', 1000],
    ['vitamin-d_100g', 'vitaminaD_ug', 1000000],
    ['vitamin-b12_100g', 'vitaminaB12_ug', 1000000],
    ['vitamin-b6_100g', 'vitaminaB6_mg', 1000],
    ['vitamin-a_100g', 'vitaminaA_ug', 1000000],
    ['vitamin-e_100g', 'vitaminaE_mg', 1000],
    ['vitamin-b9_100g', 'acidoFolico_ug', 1000000],
  ];

  for (const [offKey, label, multiplier] of vitaminKeys) {
    const val = nutriments[offKey];
    if (val !== undefined && val !== null && val > 0) {
      vitamins[label] = +(val * multiplier).toFixed(2);
    }
  }

  return Object.keys(vitamins).length > 0 ? vitamins : null;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function isFitnessProduct(product: OFFProduct): boolean {
  const combinedText = [
    product.product_name || '',
    product.product_name_es || '',
    product.product_name_en || '',
    product.categories || '',
    (product.categories_tags || []).join(' '),
    (product.labels_tags || []).join(' '),
  ].join(' ');

  return FITNESS_PATTERNS.some((pattern) => pattern.test(combinedText));
}

function detectCategory(name: string, categories: string): string {
  const text = `${name} ${categories}`.toLowerCase();
  if (/cr[eé]atin/i.test(text)) return 'Creatina';
  if (/whey|prote[ií]n|casein|case[ií]na|suero\s+de/i.test(text)) return 'Proteína';
  if (/pre[\s\-_]?workout|pre[\s\-_]?entreno/i.test(text)) return 'Pre-Entreno';
  if (/magn[eé]sio|magn[eé]sium/i.test(text)) return 'Magnesio';
  if (/omega[\s\-_]?3/i.test(text)) return 'Omega-3';
  if (/vitamin|mineral/i.test(text)) return 'Multivitamínico';
  if (/\bbcaa\b|\beaa\b|amino[aá]cido|glutamin/i.test(text)) return 'Aminoácidos';
  return 'Suplementos Deportivos';
}

/**
 * Obtiene o crea la marca usando caché en memoria para máxima velocidad
 */
async function getOrCreateBrand(brandName: string, brandSlug: string): Promise<string> {
  if (brandCache.has(brandSlug)) {
    return brandCache.get(brandSlug)!;
  }

  const brand = await prisma.brand.upsert({
    where: { slug: brandSlug },
    update: {},
    create: { name: brandName, slug: brandSlug },
  });

  brandCache.set(brandSlug, brand.id);
  return brand.id;
}

/**
 * Obtiene o crea la categoría usando caché en memoria para máxima velocidad
 */
async function getOrCreateCategory(categoryName: string, categorySlug: string): Promise<string> {
  if (categoryCache.has(categorySlug)) {
    return categoryCache.get(categorySlug)!;
  }

  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    update: {},
    create: { name: categoryName, slug: categorySlug },
  });

  categoryCache.set(categorySlug, category.id);
  return category.id;
}

/**
 * Procesa un único producto con hasta 3 reintentos automáticos
 */
async function processSingleProductWithRetry(item: OFFProduct, maxRetries = 3): Promise<boolean> {
  if (!item.code || (!item.product_name && !item.product_name_es && !item.product_name_en)) {
    return false;
  }

  const ean = item.code.trim();
  const name = (item.product_name_es || item.product_name || item.product_name_en || 'Suplemento Sin Nombre').trim();
  const brandName = (item.brands?.split(',')[0] || 'Genérica').trim();
  const categoryName = detectCategory(name, item.categories || '');
  
  // Resolución individual de cada imagen en su campo dedicado
  const frontImageUrl = resolveOFFFrontImageUrl(ean, item);
  const frontSmallImageUrl = resolveOFFFrontSmallImageUrl(ean, item);
  const packagingImageUrl = resolveOFFPackagingUrl(ean, item);
  const nutritionImageUrl = resolveOFFNutritionUrl(ean, item);
  const ingredientsImageUrl = item.image_ingredients_url || null;
  const primaryImageUrl = frontImageUrl || frontSmallImageUrl || null;

  const packageQuantity = item.quantity?.trim() || null;
  const sourceUrl = item.url || item.link || (ean ? `https://world.openfoodfacts.org/product/${ean}` : null);

  const brandSlug = slugify(brandName);
  const categorySlug = slugify(categoryName);
  const productSlug = `${slugify(name)}-${ean}`;

  const labels = (item.labels_tags || []).map((l) => l.toLowerCase());
  const isVegan = labels.some((l) => l.includes('vegan') || l.includes('vegano'));
  const isVegetarian = isVegan || labels.some((l) => l.includes('vegetarian') || l.includes('vegetariano'));
  const isGlutenFree = labels.some((l) => l.includes('gluten-free') || l.includes('sin-gluten'));
  const isLactoseFree = labels.some((l) => l.includes('lactose-free') || l.includes('sin-lactosa'));

  const allergensList = (item.allergens_tags || []).map((a) => a.replace(/^[a-z]{2}:/, ''));
  const additivesTags = (item.additives_tags || []).map((a) => a.replace(/^[a-z]{2}:/, ''));
  const additivesCount = additivesTags.length;
  const countryTag = item.countries_tags?.[0]?.replace(/^[a-z]{2}:/, '') || item.origins || null;

  const protein = item.nutriments?.proteins_100g ?? 0;
  const carbs = item.nutriments?.carbohydrates_100g ?? 0;
  const sugars = item.nutriments?.sugars_100g ?? 0;
  const fat = item.nutriments?.fat_100g ?? 0;
  const saturatedFat = item.nutriments?.['saturated-fat_100g'] ?? null;
  const salt = item.nutriments?.salt_100g ?? 0;
  const fiber = item.nutriments?.fiber_100g ?? 0;
  const caffeine = item.nutriments?.caffeine_100g ? item.nutriments.caffeine_100g * 1000 : item.nutriments?.caffeine_serving ? item.nutriments.caffeine_serving * 1000 : null; // mg
  const magnesium = item.nutriments?.magnesium_100g ? item.nutriments.magnesium_100g * 1000 : null; // mg
  const potassium = item.nutriments?.potassium_100g ? item.nutriments.potassium_100g * 1000 : null; // mg
  const zinc = item.nutriments?.zinc_100g ? item.nutriments.zinc_100g * 1000 : null; // mg
  const calcium = item.nutriments?.calcium_100g ? item.nutriments.calcium_100g * 1000 : null; // mg
  const iron = item.nutriments?.iron_100g ? item.nutriments.iron_100g * 1000 : null; // mg
  const vitaminsList = extractVitaminsList(item.nutriments);
  const ecoscoreGrade = item.ecoscore_grade?.toLowerCase() || null;

  const calories = item.nutriments?.['energy-kcal_100g'] ?? 0;
  const nova = item.nova_group || (additivesCount > 3 ? 4 : additivesCount === 0 ? 1 : 2);
  const ingredients = item.ingredients_text_es || item.ingredients_text || null;
  const { score: calculatedScore } = calculateClinicalScore({
    category: categoryName,
    protein,
    calories,
    fat,
    saturatedFat,
    sugars,
    novaGroup: nova,
    additivesCount,
    caffeineMg: caffeine ?? undefined,
    magnesiumMg: magnesium ?? undefined,
    vitaminsList: vitaminsList as Record<string, number> | null,
    ingredientsList: ingredients,
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const brandId = await getOrCreateBrand(brandName, brandSlug);
      const categoryId = await getOrCreateCategory(categoryName, categorySlug);

      const product = await prisma.product.upsert({
        where: { ean },
        update: {
          name,
          ...(primaryImageUrl ? { imageUrl: primaryImageUrl } : {}),
          ...(frontImageUrl ? { frontImageUrl } : {}),
          ...(frontSmallImageUrl ? { frontSmallImageUrl } : {}),
          ...(packagingImageUrl ? { packagingImageUrl } : {}),
          ...(packageQuantity ? { packageQuantity } : {}),
          ...(sourceUrl ? { sourceUrl } : {}),
          brandId,
          categoryId,
          isActive: true,
        },
        create: {
          ean,
          name,
          slug: productSlug,
          imageUrl: primaryImageUrl,
          frontImageUrl,
          frontSmallImageUrl,
          packagingImageUrl,
          packageQuantity,
          sourceUrl,
          brandId,
          categoryId,
          isActive: true,
        },
      });

      await prisma.nutritionalInfo.upsert({
        where: { productId: product.id },
        update: {
          servingSize: item.serving_size || null,
          proteinPer100g: protein,
          carbsPer100g: carbs,
          sugarsPer100g: sugars,
          fatPer100g: fat,
          ...(saturatedFat !== null ? { saturatedFatPer100g: saturatedFat } : {}),
          saltPer100g: salt,
          fiberPer100g: fiber,
          ...(caffeine !== null ? { caffeineMg: caffeine } : {}),
          ...(magnesium !== null ? { magnesiumMg: magnesium } : {}),
          ...(potassium !== null ? { potassiumMg: potassium } : {}),
          ...(zinc !== null ? { zincMg: zinc } : {}),
          ...(calcium !== null ? { calciumMg: calcium } : {}),
          ...(iron !== null ? { ironMg: iron } : {}),
          ...(vitaminsList ? { vitaminsList } : {}),
          ...(ecoscoreGrade ? { ecoscoreGrade } : {}),
          caloriesPer100g: calories,
          novaGroup: nova,
          additivesCount,
          additivesTags,
          isVegan,
          isVegetarian,
          isGlutenFree,
          isLactoseFree,
          allergensList,
          ...(nutritionImageUrl ? { nutritionImageUrl } : {}),
          ...(ingredientsImageUrl ? { ingredientsImageUrl } : {}),
          manufacturingCountry: countryTag,
          ingredientsList: ingredients,
          nutriscoreCalculated: calculatedScore,
        },
        create: {
          productId: product.id,
          servingSize: item.serving_size || null,
          proteinPer100g: protein,
          carbsPer100g: carbs,
          sugarsPer100g: sugars,
          fatPer100g: fat,
          saturatedFatPer100g: saturatedFat,
          saltPer100g: salt,
          fiberPer100g: fiber,
          caffeineMg: caffeine,
          magnesiumMg: magnesium,
          potassiumMg: potassium,
          zincMg: zinc,
          calciumMg: calcium,
          ironMg: iron,
          vitaminsList: vitaminsList ? (vitaminsList as any) : undefined,
          ecoscoreGrade,
          caloriesPer100g: calories,
          novaGroup: nova,
          additivesCount,
          additivesTags,
          isVegan,
          isVegetarian,
          isGlutenFree,
          isLactoseFree,
          allergensList,
          nutritionImageUrl,
          ingredientsImageUrl,
          manufacturingCountry: countryTag,
          ingredientsList: ingredients,
          nutriscoreCalculated: calculatedScore,
        },
      });

      return true; // Éxito
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`⚠️ [Error definitivo tras 3 intentos en EAN ${ean}]:`, err instanceof Error ? err.message : err);
        return false;
      }
      // Retardo exponencial: 300ms, 900ms
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }

  return false;
}

/**
 * Procesa un lote de productos en PARALELO (concurrencia simultánea)
 */
async function processProductBatchParallel(batch: OFFProduct[]) {
  const results = await Promise.allSettled(
    batch.map((item) => processSingleProductWithRetry(item, 3))
  );
  return results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
}

async function main() {
  const args = process.argv.slice(2);
  let filePath = path.join(process.cwd(), 'data', 'openfoodfacts-products.jsonl');
  let startLine = 0;

  let limit = 0; // 0 = sin límite

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start-line' || args[i] === '-s') {
      startLine = parseInt(args[i + 1], 10) || 0;
      i++;
    } else if (args[i] === '--limit' || args[i] === '-l') {
      limit = parseInt(args[i + 1], 10) || 0;
      i++;
    } else if (!args[i].startsWith('-')) {
      filePath = args[i];
    }
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado en: ${filePath}`);
    console.log(`💡 Coloca el volcado descargado en /data/openfoodfacts-products.jsonl o .gz`);
    process.exit(1);
  }

  console.log(`🚀 [Ingesta v2 Ultra-Rápida] Iniciando streaming desde: ${filePath}`);
  console.log(`⚡ Concurrencia paralela activada (20 items/bloque) + Caché de marcas/categorías.`);
  if (startLine > 0) {
    console.log(`⏩ Reanudando a partir de la línea: ${startLine.toLocaleString('es-ES')}`);
  }
  if (limit > 0) {
    console.log(`🔢 Modo prueba: se importarán un máximo de ${limit} suplementos.`);
  }

  const isGz = filePath.endsWith('.gz');
  const fileStream = fs.createReadStream(filePath);
  const inputStream = isGz ? fileStream.pipe(zlib.createGunzip()) : fileStream;

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  const CONCURRENCY_BATCH = 20; // 20 productos procesados simultáneamente en paralelo
  let batch: OFFProduct[] = [];
  let totalRead = 0;
  let totalImported = 0;
  const startTime = Date.now();

  for await (const line of rl) {
    totalRead++;
    if (totalRead < startLine) {
      if (totalRead % 100000 === 0) {
        console.log(`⏩ Saltando líneas previas: ${totalRead.toLocaleString('es-ES')} / ${startLine.toLocaleString('es-ES')}...`);
      }
      continue;
    }

    if (!line.trim()) continue;

    try {
      const product: OFFProduct = JSON.parse(line);
      if (isFitnessProduct(product)) {
        batch.push(product);

        if (batch.length >= CONCURRENCY_BATCH) {
          const importedCount = await processProductBatchParallel(batch);
          totalImported += importedCount;
          const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
          const rate = elapsedSec > 0 ? (totalImported / elapsedSec).toFixed(1) : '0';
          console.log(`📦 Procesados: ${totalImported} suplementos (${rate}/seg) — Línea actual: ${totalRead.toLocaleString('es-ES')}`);
          batch = [];

          if (limit > 0 && totalImported >= limit) {
            console.log(`\n🔢 Límite alcanzado (${limit} suplementos). Deteniendo.`);
            rl.close();
            break;
          }
        }
      }
    } catch {
      continue;
    }
  }

  // Procesar remanentes
  if (batch.length > 0) {
    const importedCount = await processProductBatchParallel(batch);
    totalImported += importedCount;
  }

  const totalMinutes = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n🎉 [Ingesta v2 Completada con Éxito]`);
  console.log(`- Tiempo total: ${totalMinutes} minutos`);
  console.log(`- Total líneas analizadas: ${totalRead.toLocaleString('es-ES')}`);
  console.log(`- Suplementos fitness importados/actualizados: ${totalImported.toLocaleString('es-ES')}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
