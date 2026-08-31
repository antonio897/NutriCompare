/**
 * scripts/seed-openfoodfacts.ts
 * 
 * Pipeline de ingestión estática para Open Food Facts (OFF)
 * Diseñado con Streaming (Node.js readline + zlib) para procesar volcados masivos
 * (JSONL / JSONL.GZ) con uso mínimo de memoria RAM (< 80 MB) y cero coste.
 * 
 * Uso:
 *   npx tsx scripts/seed-openfoodfacts.ts ./data/openfoodfacts-products.jsonl
 *   o con archivo comprimido:
 *   npx tsx scripts/seed-openfoodfacts.ts ./data/openfoodfacts-products.jsonl.gz
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { PrismaClient } from '@prisma/client';
import { calculateClinicalScore } from '../lib/nutriscore-engine';

const prisma = new PrismaClient();

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
  /amino[aá]cid/i,
  /amino\s+acido/i,
  /acide\s+amin[eé]/i,
  /\bbcaa\b/i,
  /\beaa\b/i,
  /glutamin/i,
  /magn[eé]s/i,
  /zinc|cinc/i,
  /carnitin/i,
  /pre[\s\-_]?workout/i,
  /pre[\s\-_]?entreno/i,
];

// Categorías y palabras clave de fitness permitidas para filtrado selectivo
const FITNESS_KEYWORDS = [
  'creatine',
  'creatina',
  'whey',
  'protein',
  'proteina',
  'proteína',
  'bcaa',
  'pre-workout',
  'preworkout',
  'pre-entreno',
  'magnesium',
  'magnesio',
  'glutamine',
  'casein',
  'caseina',
  'mass gainer',
  'electrolytes',
];

interface OFFNutriments {
  proteins_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fat_100g?: number;
  salt_100g?: number;
  fiber_100g?: number;
  magnesium_100g?: number;
  potassium_100g?: number;
  zinc_100g?: number;
  'energy-kcal_100g'?: number;
  [key: string]: unknown;
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
  image_url?: string;
  image_front_url?: string;
  image_nutrition_url?: string;
  image_ingredients_url?: string;
  countries_tags?: string[];
  origins?: string;
  serving_size?: string;
  ingredients_text?: string;
  ingredients_text_es?: string;
  nutriments?: OFFNutriments;
  nutriscore_score?: number;
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


async function processProductBatch(batch: OFFProduct[]) {
  for (const item of batch) {
    if (!item.code || (!item.product_name && !item.product_name_es && !item.product_name_en)) {
      continue;
    }

    const ean = item.code.trim();
    const name = (item.product_name_es || item.product_name || item.product_name_en || 'Suplemento Sin Nombre').trim();
    const brandName = (item.brands?.split(',')[0] || 'Genérica').trim();
    const categoryName = detectCategory(name, item.categories || '');
    const imageUrl = item.image_front_url || item.image_url || null;

    const brandSlug = slugify(brandName);
    const categorySlug = slugify(categoryName);
    const productSlug = `${slugify(name)}-${ean.slice(-4)}`;

    // Extracción de etiquetas dietéticas
    const labels = (item.labels_tags || []).map((l) => l.toLowerCase());
    const isVegan = labels.some((l) => l.includes('vegan') || l.includes('vegano'));
    const isVegetarian = isVegan || labels.some((l) => l.includes('vegetarian') || l.includes('vegetariano'));
    const isGlutenFree = labels.some((l) => l.includes('gluten-free') || l.includes('sin-gluten'));
    const isLactoseFree = labels.some((l) => l.includes('lactose-free') || l.includes('sin-lactosa'));

    // Extracción de alérgenos y aditivos
    const allergensList = (item.allergens_tags || []).map((a) => a.replace(/^[a-z]{2}:/, ''));
    const additivesTags = (item.additives_tags || []).map((a) => a.replace(/^[a-z]{2}:/, ''));
    const additivesCount = additivesTags.length;

    // Origen de fabricación
    const countryTag = item.countries_tags?.[0]?.replace(/^[a-z]{2}:/, '') || item.origins || null;

    try {
      // 1. Upsert Marca
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: {},
        create: {
          name: brandName,
          slug: brandSlug,
        },
      });

      // 2. Upsert Categoría
      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        update: {},
        create: {
          name: categoryName,
          slug: categorySlug,
        },
      });

      // 3. Upsert Producto
      const product = await prisma.product.upsert({
        where: { ean },
        update: {
          name,
          imageUrl,
          brandId: brand.id,
          categoryId: category.id,
        },
        create: {
          ean,
          name,
          slug: productSlug,
          imageUrl,
          brandId: brand.id,
          categoryId: category.id,
        },
      });

      // 4. Upsert Información Nutricional Enriquecida
      const protein = item.nutriments?.proteins_100g ?? 0;
      const carbs = item.nutriments?.carbohydrates_100g ?? 0;
      const sugars = item.nutriments?.sugars_100g ?? 0;
      const fat = item.nutriments?.fat_100g ?? 0;
      const salt = item.nutriments?.salt_100g ?? 0;
      const fiber = item.nutriments?.fiber_100g ?? 0;
      const magnesium = item.nutriments?.magnesium_100g ? item.nutriments.magnesium_100g * 1000 : null; // mg
      const potassium = item.nutriments?.potassium_100g ? item.nutriments.potassium_100g * 1000 : null; // mg
      const zinc = item.nutriments?.zinc_100g ? item.nutriments.zinc_100g * 1000 : null; // mg
      const calories = item.nutriments?.['energy-kcal_100g'] ?? 0;
      const nova = item.nova_group || (additivesCount > 3 ? 4 : additivesCount === 0 ? 1 : 2);
      const ingredients = item.ingredients_text_es || item.ingredients_text || null;
      const { score: calculatedScore } = calculateClinicalScore({
        category: categoryName,
        protein,
        calories,
        fat,
        sugars,
        novaGroup: nova,
        additivesCount,
        magnesiumMg: magnesium ?? undefined,
        ingredientsList: ingredients,
      });

      await prisma.nutritionalInfo.upsert({
        where: { productId: product.id },
        update: {
          servingSize: item.serving_size || null,
          proteinPer100g: protein,
          carbsPer100g: carbs,
          sugarsPer100g: sugars,
          fatPer100g: fat,
          saltPer100g: salt,
          fiberPer100g: fiber,
          magnesiumMg: magnesium,
          potassiumMg: potassium,
          zincMg: zinc,
          caloriesPer100g: calories,
          novaGroup: nova,
          additivesCount,
          additivesTags,
          isVegan,
          isVegetarian,
          isGlutenFree,
          isLactoseFree,
          allergensList,
          nutritionImageUrl: item.image_nutrition_url || null,
          ingredientsImageUrl: item.image_ingredients_url || null,
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
          saltPer100g: salt,
          fiberPer100g: fiber,
          magnesiumMg: magnesium,
          potassiumMg: potassium,
          zincMg: zinc,
          caloriesPer100g: calories,
          novaGroup: nova,
          additivesCount,
          additivesTags,
          isVegan,
          isVegetarian,
          isGlutenFree,
          isLactoseFree,
          allergensList,
          nutritionImageUrl: item.image_nutrition_url || null,
          ingredientsImageUrl: item.image_ingredients_url || null,
          manufacturingCountry: countryTag,
          ingredientsList: ingredients,
          nutriscoreCalculated: calculatedScore,
        },
      });
    } catch (err) {
      console.error(`[Error procesando EAN ${ean}]:`, err instanceof Error ? err.message : err);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  let filePath = path.join(process.cwd(), 'data', 'openfoodfacts-products.jsonl');
  let startLine = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start-line' || args[i] === '-s') {
      startLine = parseInt(args[i + 1], 10) || 0;
      i++;
    } else if (!args[i].startsWith('-')) {
      filePath = args[i];
    }
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado en: ${filePath}`);
    console.log(`💡 Descarga el volcado desde Open Food Facts y colócalo en /data/openfoodfacts-products.jsonl`);
    console.log(`Ejemplo de comando:`);
    console.log(`  curl -O https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz`);
    process.exit(1);
  }

  console.log(`🚀 Iniciando ingesta en streaming desde: ${filePath}`);
  if (startLine > 0) {
    console.log(`⏩ Reanudando a partir de la línea: ${startLine.toLocaleString('es-ES')}`);
  }

  const isGz = filePath.endsWith('.gz');
  const fileStream = fs.createReadStream(filePath);
  const inputStream = isGz ? fileStream.pipe(zlib.createGunzip()) : fileStream;

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  const BATCH_SIZE = 50;
  let batch: OFFProduct[] = [];
  let totalRead = 0;
  let totalImported = 0;

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

        if (batch.length >= BATCH_SIZE) {
          await processProductBatch(batch);
          totalImported += batch.length;
          console.log(`📦 Procesados: ${totalImported} suplementos nuevos (Línea actual: ${totalRead.toLocaleString('es-ES')})`);
          batch = [];
        }
      }
    } catch {
      // Ignora líneas mal formateadas en el volcado
      continue;
    }
  }

  // Procesar remanentes
  if (batch.length > 0) {
    await processProductBatch(batch);
    totalImported += batch.length;
  }

  console.log(`\n✅ Ingesta finalizada con éxito:`);
  console.log(`- Total líneas analizadas: ${totalRead}`);
  console.log(`- Suplementos fitness importados/actualizados: ${totalImported}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
