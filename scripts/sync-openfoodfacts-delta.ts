/**
 * scripts/sync-openfoodfacts-delta.ts
 * 
 * Pipeline de sincronización incremental ligera (Fase 6).
 * Consulta la API Delta de Open Food Facts para descargar SOLO los productos
 * modificados o añadidos recientemente sin requerir el volcado de 11 GB.
 * 
 * Uso:
 *   npx tsx scripts/sync-openfoodfacts-delta.ts               # Últimas 24 horas
 *   npx tsx scripts/sync-openfoodfacts-delta.ts --days 7     # Últimos 7 días
 */

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

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
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


interface OFFDeltaProduct {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
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
  nutriments?: {
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
  };
}

async function syncDelta() {
  const args = process.argv.slice(2);
  let days = 1;
  const daysIdx = args.indexOf('--days');
  if (daysIdx !== -1 && args[daysIdx + 1]) {
    days = parseInt(args[daysIdx + 1], 10) || 1;
  }

  const timestampFrom = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  console.log(`📡 [Fase 6: Delta Sync] Buscando suplementos modificados en los últimos ${days} días (desde timestamp ${timestampFrom})...`);

  let page = 1;
  let totalSaved = 0;
  let hasMore = true;

  while (hasMore && page <= 10) {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&last_modified_time_from=${timestampFrom}&page=${page}&page_size=100&json=true`;
    console.log(`🔄 Descargando página delta ${page}...`);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'NutriCompare - Open Source Supplement Indexer (https://nutricompare.es)' },
      });

      if (!response.ok) {
        console.error(`❌ Error en respuesta HTTP: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const products: OFFDeltaProduct[] = data.products || [];

      if (products.length === 0) {
        console.log('ℹ️ No hay más productos modificados en este intervalo.');
        break;
      }

      let fitnessInPage = 0;
      for (const item of products) {
        if (!item.code || (!item.product_name && !item.product_name_es && !item.product_name_en)) {
          continue;
        }

        const combinedText = [
          item.product_name || '',
          item.product_name_es || '',
          item.product_name_en || '',
          item.categories || '',
          (item.categories_tags || []).join(' '),
        ].join(' ').toLowerCase();

        const isFitness = FITNESS_PATTERNS.some((pattern) => pattern.test(combinedText));
        if (!isFitness) continue;

        fitnessInPage++;
        const ean = item.code.trim();
        const name = (item.product_name_es || item.product_name || item.product_name_en || 'Suplemento').trim();
        const brandName = (item.brands?.split(',')[0] || 'Genérica').trim();
        const categoryName = detectCategory(name, item.categories || '');
        const imageUrl = item.image_front_url || item.image_url || null;

        const brandSlug = slugify(brandName);
        const categorySlug = slugify(categoryName);
        const productSlug = `${slugify(name)}-${ean.slice(-4)}`;

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
        const salt = item.nutriments?.salt_100g ?? 0;
        const fiber = item.nutriments?.fiber_100g ?? 0;
        const magnesium = item.nutriments?.magnesium_100g ? item.nutriments.magnesium_100g * 1000 : null;
        const potassium = item.nutriments?.potassium_100g ? item.nutriments.potassium_100g * 1000 : null;
        const zinc = item.nutriments?.zinc_100g ? item.nutriments.zinc_100g * 1000 : null;
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

        const brand = await prisma.brand.upsert({
          where: { slug: brandSlug },
          update: {},
          create: { name: brandName, slug: brandSlug },
        });

        const category = await prisma.category.upsert({
          where: { slug: categorySlug },
          update: {},
          create: { name: categoryName, slug: categorySlug },
        });

        const product = await prisma.product.upsert({
          where: { ean },
          update: { name, imageUrl, brandId: brand.id, categoryId: category.id, isActive: true },
          create: { ean, name, slug: productSlug, imageUrl, brandId: brand.id, categoryId: category.id, isActive: true },
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

        totalSaved++;
      }

      console.log(`  ✓ Página ${page}: ${fitnessInPage} suplementos fitness actualizados.`);
      if (products.length < 100) hasMore = false;
      page++;
    } catch (err) {
      console.error(`❌ Error en delta sync página ${page}:`, err);
      break;
    }
  }

  console.log(`\n🎉 [Fase 6 Completada] ${totalSaved} suplementos sincronizados incrementalmente con éxito.`);
  await prisma.$disconnect();
}

syncDelta().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
