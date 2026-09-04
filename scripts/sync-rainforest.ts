/**
 * scripts/sync-rainforest.ts
 * 
 * Pipeline CLI para la sincronización de suplementos fitness desde Amazon (Rainforest API)
 * hacia Neon PostgreSQL.
 * 
 * Características:
 *  - Categorías soportadas: Proteína, Creatina, BCAA, Magnesio y Omega-3.
 *  - Control estricto de cuota gratuita (100 peticiones en Rainforest API).
 *  - Soporte de simulación con `--mock` o `--dry-run` para pruebas sin consumo de créditos.
 *  - Extracción de Bestsellers, ratings, fotos oficiales, marcas, precios y sellos de calidad.
 *  - Normalización automática de NutriScore, pureza y coste por dosis.
 * 
 * Ejemplos de uso:
 *  npx tsx scripts/sync-rainforest.ts --mock
 *  npx tsx scripts/sync-rainforest.ts --limit=5
 *  npx tsx scripts/sync-rainforest.ts --categories="Creatina,Proteína"
 *  npx tsx scripts/sync-rainforest.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';
import { RainforestProvider } from '../lib/providers/rainforest-provider';
import { normalizeRainforestProduct } from '../lib/providers/product-normalizer';
import { FitnessCategory } from '../lib/providers/types';

const prisma = new PrismaClient();

// Categorías fitness prioritarias solicitadas por el usuario
const TARGET_CATEGORIES: FitnessCategory[] = [
  'Proteína',
  'Creatina',
  'BCAA',
  'Magnesio',
  'Omega-3',
];

function parseArgs(): {
  isMock: boolean;
  isDryRun: boolean;
  limit: number;
  categories: FitnessCategory[];
} {
  const args = process.argv.slice(2);
  const isMock = args.includes('--mock') || !process.env.RAINFOREST_API_KEY;
  const isDryRun = args.includes('--dry-run');

  let limit = 5;
  const limitArg = args.find(a => a.startsWith('--limit='));
  if (limitArg) {
    limit = parseInt(limitArg.split('=')[1], 10) || 5;
  }

  let categories = TARGET_CATEGORIES;
  const catArg = args.find(a => a.startsWith('--categories='));
  if (catArg) {
    const rawList = catArg.split('=')[1].split(',').map(c => c.trim()) as FitnessCategory[];
    categories = rawList.filter(c => TARGET_CATEGORIES.includes(c));
  }

  return { isMock, isDryRun, limit, categories };
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
  const { isMock, isDryRun, limit, categories } = parseArgs();

  console.log('\n======================================================');
  console.log('🚀 [NutriCompare] Sincronización de Productos Fitness');
  console.log('   Fuente: Rainforest API (Amazon.es)');
  console.log(`   Modo: ${isMock ? '🧪 Mock / Fixture (0 créditos)' : '🌐 Rainforest API Real'}`);
  console.log(`   Dry Run: ${isDryRun ? 'Activado (No escribe en BD)' : 'Desactivado (Escribe en Neon)'}`);
  console.log(`   Categorías: ${categories.join(', ')}`);
  console.log(`   Límite por categoría: ${limit}`);
  console.log('======================================================\n');

  const provider = new RainforestProvider({
    apiKey: process.env.RAINFOREST_API_KEY,
    isMock,
  });

  let totalProcessed = 0;
  let totalSaved = 0;

  for (const category of categories) {
    console.log(`\n📦 Obteniendo Bestsellers para categoría: [${category}]...`);

    try {
      const rawProducts = await provider.fetchBestsellers(category, limit);
      console.log(`   -> Encontrados ${rawProducts.length} productos.`);

      for (let i = 0; i < rawProducts.length; i++) {
        const raw = rawProducts[i];
        totalProcessed++;

        // Normalizar producto
        const normalized = normalizeRainforestProduct(raw, category);

        console.log(`   [#${i + 1}] ${normalized.brandName} - ${normalized.name}`);
        console.log(`       Precio: ${normalized.currentPrice}€ | Rating: ${normalized.rating}⭐ (${normalized.ratingsTotal} revs)`);
        console.log(`       NutriScore: ${normalized.nutritionalInfo.nutriscoreCalculated} | Pureza: ${normalized.nutritionalInfo.purityPercentage}% | Bestseller: ${normalized.isBestseller ? 'SÍ' : 'NO'}`);

        if (isDryRun) continue;

        try {
          // 1. Upsert Marca
          const brandSlug = slugify(normalized.brandName);
          const brand = await prisma.brand.upsert({
            where: { slug: brandSlug },
            create: {
              name: normalized.brandName,
              slug: brandSlug,
            },
            update: {
              name: normalized.brandName,
            },
          });

          // 2. Upsert Categoría
          const categorySlug = slugify(normalized.categoryName);
          const catRecord = await prisma.category.upsert({
            where: { slug: categorySlug },
            create: {
              name: normalized.categoryName,
              slug: categorySlug,
            },
            update: {
              name: normalized.categoryName,
            },
          });

          // 3. Upsert Producto en Neon
          // Buscamos si ya existe por ASIN o slug
          let existingProduct = normalized.asin ? await prisma.product.findUnique({
            where: { asin: normalized.asin },
          }) : null;

          if (!existingProduct) {
            existingProduct = await prisma.product.findUnique({
              where: { slug: normalized.slug },
            });
          }

          const productData: any = {
            asin: normalized.asin,
            sourceProvider: normalized.sourceProvider,
            sourceId: normalized.sourceId,
            name: normalized.name,
            slug: normalized.slug,
            brandId: brand.id,
            categoryId: catRecord.id,
            imageUrl: normalized.imageUrl,
            frontImageUrl: normalized.imageUrl,
            packageQuantity: normalized.packageQuantity,
            sourceUrl: normalized.sourceUrl,
            isBestseller: normalized.isBestseller,
            bestsellerRank: normalized.bestsellerRank,
            rating: normalized.rating,
            ratingsTotal: normalized.ratingsTotal,
            format: normalized.format,
            flavour: normalized.flavour,
            servings: normalized.servings,
            rawPayload: normalized.rawPayload,
            isActive: true,
          };

          let savedProduct;
          if (existingProduct) {
            savedProduct = await prisma.product.update({
              where: { id: existingProduct.id },
              data: productData,
            });
          } else {
            savedProduct = await prisma.product.create({
              data: productData,
            });
          }

          // 4. Upsert Información Nutricional
          const nutData: any = {
            productId: savedProduct.id,
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
            ingredientsList: normalized.nutritionalInfo.ingredientsList,
            purityCertified: normalized.nutritionalInfo.purityCertified || false,
            nutriscoreCalculated: normalized.nutritionalInfo.nutriscoreCalculated,
            rawPurityPercentage: normalized.nutritionalInfo.purityPercentage,
          };

          await prisma.nutritionalInfo.upsert({
            where: { productId: savedProduct.id },
            create: nutData,
            update: nutData,
          });

          // 5. Upsert Oferta de Amazon (VendorOffer)
          const offer = await prisma.vendorOffer.upsert({
            where: {
              productId_vendorName: {
                productId: savedProduct.id,
                vendorName: 'Amazon',
              },
            },
            create: {
              productId: savedProduct.id,
              vendorName: 'Amazon',
              vendorSku: normalized.asin,
              currentPrice: normalized.currentPrice,
              currency: normalized.currency,
              affiliateUrl: normalized.affiliateUrl,
              inStock: true,
            },
            update: {
              currentPrice: normalized.currentPrice,
              affiliateUrl: normalized.affiliateUrl,
              vendorSku: normalized.asin,
              inStock: true,
              lastUpdated: new Date(),
            },
          });

          // 6. Guardar punto en histórico de precios si procede
          await prisma.priceHistory.create({
            data: {
              vendorOfferId: offer.id,
              price: normalized.currentPrice,
            },
          });

          totalSaved++;
        } catch (dbErr) {
          console.error(`       ❌ Error guardando en base de datos:`, dbErr);
        }
      }
    } catch (catErr) {
      console.error(`   ❌ Error procesando categoría ${category}:`, catErr);
    }
  }

  console.log('\n======================================================');
  console.log(`✅ Sincronización Finalizada`);
  console.log(`   Total procesados: ${totalProcessed}`);
  console.log(`   Total guardados en Neon: ${totalSaved}`);
  console.log(`   Peticiones API consumidas: ${provider.getRequestsCount()}`);
  const remaining = await provider.getQuotaRemaining();
  console.log(`   Peticiones restantes en Rainforest: ${remaining !== null ? remaining : 'Ilimitadas/Mock'}`);
  console.log('======================================================\n');
}

main()
  .catch(e => {
    console.error('Fatal error en sincronización:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
