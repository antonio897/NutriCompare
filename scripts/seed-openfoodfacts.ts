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
import zlib from 'nodestandard:zlib' in globalThis ? undefined : require('node:zlib');
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  fat_100g?: number;
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
  image_url?: string;
  image_front_url?: string;
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
  ]
    .join(' ')
    .toLowerCase();

  return FITNESS_KEYWORDS.some((kw) => combinedText.includes(kw));
}

function detectCategory(name: string, categories: string): string {
  const text = `${name} ${categories}`.toLowerCase();
  if (text.includes('creatin')) return 'Creatina';
  if (text.includes('whey') || text.includes('protein') || text.includes('proteina') || text.includes('proteína') || text.includes('casein')) return 'Proteína';
  if (text.includes('pre-workout') || text.includes('preworkout') || text.includes('pre-entreno')) return 'Pre-Entreno';
  if (text.includes('magnesio') || text.includes('magnesium')) return 'Magnesio';
  if (text.includes('vitamin') || text.includes('mineral')) return 'Multivitamínico';
  return 'Suplementos Deportivos';
}

function calculateNutriScore(protein: number = 0, calories: number = 0, fat: number = 0): number {
  // Algoritmo clínico simplificado de pureza para suplementos (0 - 100)
  let score = 50;
  if (protein > 75) score += 35;
  else if (protein > 50) score += 20;
  else if (protein > 20) score += 10;

  if (fat < 3) score += 10;
  else if (fat > 10) score -= 15;

  if (calories > 400 && protein < 50) score -= 10; // Penaliza gainers con azúcar

  return Math.min(100, Math.max(10, score));
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

      // 4. Upsert Información Nutricional
      const protein = item.nutriments?.proteins_100g ?? 0;
      const carbs = item.nutriments?.carbohydrates_100g ?? 0;
      const fat = item.nutriments?.fat_100g ?? 0;
      const calories = item.nutriments?.['energy-kcal_100g'] ?? 0;
      const ingredients = item.ingredients_text_es || item.ingredients_text || null;
      const calculatedScore = calculateNutriScore(protein, calories, fat);

      await prisma.nutritionalInfo.upsert({
        where: { productId: product.id },
        update: {
          servingSize: item.serving_size || null,
          proteinPer100g: protein,
          carbsPer100g: carbs,
          fatPer100g: fat,
          caloriesPer100g: calories,
          ingredientsList: ingredients,
          nutriscoreCalculated: calculatedScore,
        },
        create: {
          productId: product.id,
          servingSize: item.serving_size || null,
          proteinPer100g: protein,
          carbsPer100g: carbs,
          fatPer100g: fat,
          caloriesPer100g: calories,
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
  const filePath = process.argv[2] || path.join(process.cwd(), 'data', 'openfoodfacts-products.jsonl');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado en: ${filePath}`);
    console.log(`💡 Descarga el volcado desde Open Food Facts y colócalo en /data/openfoodfacts-products.jsonl`);
    console.log(`Ejemplo de comando:`);
    console.log(`  curl -O https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz`);
    process.exit(1);
  }

  console.log(`🚀 Iniciando ingesta en streaming desde: ${filePath}`);

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
    if (!line.trim()) continue;

    try {
      const product: OFFProduct = JSON.parse(line);
      if (isFitnessProduct(product)) {
        batch.push(product);

        if (batch.length >= BATCH_SIZE) {
          await processProductBatch(batch);
          totalImported += batch.length;
          console.log(`📦 Procesados: ${totalImported} productos fitness (Líneas leídas: ${totalRead})`);
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
