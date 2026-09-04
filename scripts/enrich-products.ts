/**
 * scripts/enrich-products.ts
 * 
 * Paso 2: Enriquecimiento profundo de productos cosechados.
 * - Lee los N productos prioritarios de la categoría ordenados por ranking (1..50).
 * - Realiza una llamada por producto a Rainforest API (`type=product&asin=...`)
 *   para extraer ingredientes, pureza, aminograma, tabla nutricional y sellos.
 * - Calcula el NutriScore para suplementos fitness (0 a 100) y actualiza `NutritionalInfo`.
 * - Marca el producto como `isEnriched: true`.
 * 
 * Uso:
 *   npx tsx scripts/enrich-products.ts --category=Proteína --limit=50
 *   npx tsx scripts/enrich-products.ts --category=Proteína --limit=5 --mock
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { RainforestProvider } from '../lib/providers/rainforest-provider';
import { FitnessCategory } from '../lib/providers/types';
import { normalizeRainforestProduct } from '../lib/providers/product-normalizer';

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const isMock = args.includes('--mock') || !process.env.RAINFOREST_API_KEY;
  const isDryRun = args.includes('--dry-run');

  let category: FitnessCategory = 'Proteína';
  const catArg = args.find(a => a.startsWith('--category='));
  if (catArg) {
    category = catArg.split('=')[1].trim() as FitnessCategory;
  }

  let start = 1;
  const startArg = args.find(a => a.startsWith('--start='));
  if (startArg) {
    start = Math.max(1, parseInt(startArg.split('=')[1], 10) || 1);
  }

  let end = 5; // Por defecto solo los 5 primeros para seguridad
  const endArg = args.find(a => a.startsWith('--end='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  if (endArg) {
    end = parseInt(endArg.split('=')[1], 10) || start + 4;
  } else if (limitArg) {
    end = start + (parseInt(limitArg.split('=')[1], 10) || 5) - 1;
  }

  if (end < start) end = start;

  return { isMock, isDryRun, category, start, end };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  const { isMock, isDryRun, category, start, end } = parseArgs();
  const countToEnrich = end - start + 1;

  console.log('\n================================================================');
  console.log('🔬 [NutriCompare] Enriquecedor Técnico (Enrich Products)');
  console.log(`   Categoría: ${category}`);
  console.log(`   Rango del ranking objetivo: Del #${start} al #${end} (${countToEnrich} productos)`);
  console.log(`   Modo: ${isMock ? '🧪 Mock / Fixture (0 créditos)' : '🌐 Rainforest API Real (type=product)'}`);
  console.log(`   Consumo estimado de créditos: ${isMock ? 0 : countToEnrich}`);
  console.log('================================================================\n');

  const provider = new RainforestProvider({
    apiKey: process.env.RAINFOREST_API_KEY,
    isMock,
    maxRequestsBudget: countToEnrich + 5,
  });

  const categorySlug = slugify(category);
  const catRecord = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: category, mode: 'insensitive' } },
        { slug: categorySlug }
      ]
    },
  });

  if (!catRecord) {
    console.error(`❌ Categoría "${category}" no encontrada en la base de datos.`);
    console.info(`   Por favor, ejecuta primero: npx tsx scripts/harvest-catalog.ts --category=${category}`);
    process.exit(1);
  }

  // 1. Obtener los productos exactos en el rango start..end de category_rankings
  let productsToEnrich: Array<{ id: string; asin: string | null; name: string; bestsellerRank: number | null }> = [];

  try {
    const rawRanks: any = await prisma.$queryRawUnsafe(`
      SELECT p.id, p.asin, p.name, cr.position as "bestsellerRank"
      FROM category_rankings cr
      JOIN products p ON p.id = cr.product_id
      WHERE cr.category_id = $1
        AND cr.position >= $2
        AND cr.position <= $3
      ORDER BY cr.position ASC;
    `, catRecord.id, start, end);

    if (rawRanks && rawRanks.length > 0) {
      productsToEnrich = rawRanks;
    }
  } catch {
    // Fallback si no estuviera category_rankings
  }

  if (productsToEnrich.length === 0) {
    productsToEnrich = await prisma.product.findMany({
      where: {
        categoryId: catRecord.id,
        bestsellerRank: { gte: start, lte: end }
      },
      orderBy: { bestsellerRank: 'asc' },
      select: { id: true, asin: true, name: true, bestsellerRank: true },
    });
  }

  if (productsToEnrich.length === 0) {
    console.warn(`⚠️ No se encontraron productos en el rango #${start}..#${end} para ${category}.`);
    process.exit(0);
  }

  console.log(`📦 Encontrados ${productsToEnrich.length} productos en el rango especificado.\n`);

  let enrichedCount = 0;

  for (let i = 0; i < productsToEnrich.length; i++) {
    const p = productsToEnrich[i];
    const rank = p.bestsellerRank || i + 1;

    if (!p.asin) {
      console.warn(`   [#${rank}] Saltando "${p.name}" (No tiene ASIN de Amazon).`);
      continue;
    }

    console.log(`🔍 [#${rank}/${productsToEnrich.length}] Obteniendo detalle profundo para ASIN ${p.asin}: ${p.name.slice(0, 50)}...`);

    try {
      // 0. Comprobar caché local del producto para no gastar créditos si ya se descargó
      const detailsDir = path.resolve(process.cwd(), 'data', 'details');
      if (!fs.existsSync(detailsDir)) {
        fs.mkdirSync(detailsDir, { recursive: true });
      }
      const localDetailPath = path.join(detailsDir, `${p.asin}.json`);

      let rawDetail: any;
      if (fs.existsSync(localDetailPath) && !process.argv.includes('--fresh')) {
        console.log(`       ⚡ [Caché Local] Usando ficha técnica previamente guardada para ASIN ${p.asin} (0 créditos)`);
        rawDetail = JSON.parse(fs.readFileSync(localDetailPath, 'utf-8'));
      } else {
        rawDetail = await provider.getProductDetails(p.asin);
        // Guardar inmediatamente en disco
        fs.writeFileSync(localDetailPath, JSON.stringify(rawDetail, null, 2), 'utf-8');
        console.log(`       💾 Ficha respaldada en local: data/details/${p.asin}.json`);
      }

      const normalized = normalizeRainforestProduct(rawDetail, category);

      console.log(`       -> NutriScore: ${normalized.nutritionalInfo.nutriscoreCalculated} | Pureza: ${normalized.nutritionalInfo.purityPercentage}% | Dosis: ${normalized.nutritionalInfo.servingSize || 'N/D'}`);

      // Normalizar ingredientsList: asegurar que siempre sea un String plano para la BD
      let cleanIngredients: string | null = null;
      if (Array.isArray(normalized.nutritionalInfo.ingredientsList)) {
        cleanIngredients = (normalized.nutritionalInfo.ingredientsList as any[]).join(', ');
      } else if (typeof normalized.nutritionalInfo.ingredientsList === 'string') {
        cleanIngredients = normalized.nutritionalInfo.ingredientsList;
      }
      console.log(`       -> Ingredientes detectados: ${cleanIngredients?.slice(0, 80) || 'Listado básico'}...`);

      if (isDryRun) continue;

      // 1. Actualizar información técnica en Product (incluyendo todo el JSON crudo en raw_payload)
      await prisma.$executeRawUnsafe(`
        UPDATE products
        SET 
          format = COALESCE($1, format),
          flavour = COALESCE($2, flavour),
          servings = COALESCE($3, servings),
          package_quantity = COALESCE($4, package_quantity),
          raw_payload = $5::jsonb,
          updated_at = NOW()
        WHERE id = $6;
      `,
        normalized.format || null,
        normalized.flavour || null,
        normalized.servings || null,
        normalized.packageQuantity || null,
        JSON.stringify({ ...rawDetail, isEnriched: true, enrichedAt: new Date().toISOString() }),
        p.id
      ).catch(() => {});

      // 2. Upsert NutritionalInfo con cálculo de pureza, aminograma y NutriScore
      const nutData: any = {
        productId: p.id,
        servingSize: normalized.nutritionalInfo.servingSize,
        proteinPer100g: normalized.nutritionalInfo.proteinPer100g,
        creatinePerServing: normalized.nutritionalInfo.creatinePerServing,
        bcaaPerServing: normalized.nutritionalInfo.bcaaPerServing,
        omega3EpaMg: normalized.nutritionalInfo.omega3EpaMg,
        omega3DhaMg: normalized.nutritionalInfo.omega3DhaMg,
        magnesiumMg: normalized.nutritionalInfo.magnesiumMg,
        magnesiumType: normalized.nutritionalInfo.magnesiumType,
        sugarsPer100g: normalized.nutritionalInfo.sugarsPer100g,
        isVegan: normalized.nutritionalInfo.isVegan,
        isVegetarian: normalized.nutritionalInfo.isVegetarian,
        isGlutenFree: normalized.nutritionalInfo.isGlutenFree,
        isLactoseFree: normalized.nutritionalInfo.isLactoseFree,
        ingredientsList: cleanIngredients,
        purityCertified: normalized.nutritionalInfo.purityCertified || false,
        nutriscoreCalculated: normalized.nutritionalInfo.nutriscoreCalculated,
        rawPurityPercentage: normalized.nutritionalInfo.purityPercentage,
      };

      await prisma.nutritionalInfo.upsert({
        where: { productId: p.id },
        create: nutData,
        update: nutData,
      });

      // 3. Actualizar oferta de vendedor y registrar en price_history
      if (normalized.currentPrice > 0) {
        const offer = await prisma.vendorOffer.upsert({
          where: {
            productId_vendorName: {
              productId: p.id,
              vendorName: 'Amazon',
            },
          },
          create: {
            productId: p.id,
            vendorName: 'Amazon',
            vendorSku: p.asin,
            currentPrice: normalized.currentPrice,
            currency: normalized.currency,
            affiliateUrl: normalized.affiliateUrl,
            inStock: true,
          },
          update: {
            currentPrice: normalized.currentPrice,
            affiliateUrl: normalized.affiliateUrl,
            inStock: true,
            lastUpdated: new Date(),
          },
        });

        // Registrar punto en el histórico de precios
        await prisma.priceHistory.create({
          data: {
            vendorOfferId: offer.id,
            price: normalized.currentPrice,
          },
        }).catch(() => {});
      }

      enrichedCount++;

      // Pequeña pausa de 200ms entre llamadas a la API para evitar rate limit
      if (!isMock) {
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err: any) {
      console.error(`       ❌ Error enriqueciendo ASIN ${p.asin}:`, err.message || err);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 Proceso de enriquecimiento completado!`);
  console.log(`   Total productos enriquecidos: ${enrichedCount}/${productsToEnrich.length}`);
  console.log(`   Créditos de Rainforest API consumidos: ${provider.getRequestsCount()}`);
  console.log('================================================================\n');
}

main()
  .catch(e => {
    console.error('Fatal error en enrich:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
