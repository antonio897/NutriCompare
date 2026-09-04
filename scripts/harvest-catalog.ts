/**
 * scripts/harvest-catalog.ts
 * 
 * Paso 1: Cosechar el catálogo de productos para una categoría fitness en Amazon España.
 * - Realiza búsquedas paginadas (page=1, 2, 3...) en Rainforest API hasta acumular N productos (por defecto 200).
 * - Consume ~1 crédito por cada ~30-40 productos (aprox 5 a 7 créditos en total para 200 productos).
 * - Registra los productos básicos en la base de datos Neon (tabla `Product`).
 * - Registra la posición correlativa en la tabla `CategoryRanking` (orden de ranking 1..200).
 * 
 * Uso:
 *   npx tsx scripts/harvest-catalog.ts --category=Proteína --target=200
 *   npx tsx scripts/harvest-catalog.ts --category=Creatina --target=100
 *   npx tsx scripts/harvest-catalog.ts --category=Proteína --target=20 --mock
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { RainforestProvider } from '../lib/providers/rainforest-provider';
import { FitnessCategory, RawRainforestProduct } from '../lib/providers/types';
import { normalizeRainforestProduct } from '../lib/providers/product-normalizer';

const prisma = new PrismaClient();

const CATEGORY_SEARCH_TERMS: Record<FitnessCategory, string> = {
  'Proteína': 'proteina whey',
  'Creatina': 'creatina monohidrato',
  'BCAA': 'bcaa aminoacidos',
  'Magnesio': 'bisglicinato magnesio',
  'Omega-3': 'omega 3',
  'Pre-Entreno': 'pre entreno',
  'Multivitamínico': 'multivitaminico',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const isMock = args.includes('--mock') || !process.env.RAINFOREST_API_KEY;
  const isDryRun = args.includes('--dry-run');

  let category: FitnessCategory = 'Proteína';
  const catArg = args.find(a => a.startsWith('--category='));
  if (catArg) {
    category = catArg.split('=')[1].trim() as FitnessCategory;
  }

  let customQuery: string | undefined;
  const queryArg = args.find(a => a.startsWith('--query='));
  if (queryArg) {
    customQuery = queryArg.split('=')[1].trim();
  }

  let target = 200;
  const targetArg = args.find(a => a.startsWith('--target='));
  if (targetArg) {
    target = parseInt(targetArg.split('=')[1], 10) || 200;
  }

  return { isMock, isDryRun, category, customQuery, target };
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
  const { isMock, isDryRun, category, customQuery, target } = parseArgs();
  const searchTerm = customQuery || CATEGORY_SEARCH_TERMS[category] || category;

  console.log('\n================================================================');
  console.log('🌾 [NutriCompare] Cosechador de Catálogo (Harvest Catalog)');
  console.log(`   Categoría objetivo: ${category}`);
  console.log(`   Término de búsqueda: "${searchTerm}" (Ordenado por: Más Vendidos en Amazon.es)`);
  console.log(`   Cantidad objetivo: ${target} productos`);
  console.log(`   Modo: ${isMock ? '🧪 Mock / Fixture (0 créditos)' : '🌐 Rainforest API Real (Amazon.es)'}`);
  console.log(`   Dry Run: ${isDryRun ? 'Activado (No escribe en DB)' : 'Desactivado'}`);
  console.log('================================================================\n');

  const provider = new RainforestProvider({
    apiKey: process.env.RAINFOREST_API_KEY,
    isMock,
  });

  // Asegurar o crear la categoría en DB de forma resiliente
  const categorySlug = slugify(category);
  let dbCategory: any = null;
  if (!isDryRun) {
    dbCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: category, mode: 'insensitive' } },
          { slug: categorySlug }
        ]
      }
    });

    if (!dbCategory) {
      dbCategory = await prisma.category.create({
        data: { name: category, slug: categorySlug },
      });
    }

    // Asegurar que la tabla category_rankings existe en Neon
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS category_rankings (
        id VARCHAR(64) PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        source VARCHAR(50) DEFAULT 'AMAZON_ES',
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_category_position UNIQUE (category_id, position),
        CONSTRAINT uq_category_product UNIQUE (category_id, product_id)
      );
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_category_rankings_pos ON category_rankings(category_id, position);
    `).catch(() => {});
  }
  const harvestDir = path.resolve(process.cwd(), 'data', 'harvest');
  if (!fs.existsSync(harvestDir)) {
    fs.mkdirSync(harvestDir, { recursive: true });
  }

  // Comprobar si ya tenemos un archivo local de cosecha para esta categoría
  const latestLocalFile = fs.readdirSync(harvestDir)
    .filter(f => f.startsWith(`${categorySlug}-harvest-`) && f.endsWith('.json'))
    .pop();

  let gatheredProducts: RawRainforestProduct[] = [];
  const seenAsins = new Set<string>();

  const forceFresh = process.argv.includes('--fresh');
  if (latestLocalFile && !forceFresh && !isMock) {
    const cachedData = JSON.parse(fs.readFileSync(path.join(harvestDir, latestLocalFile), 'utf-8'));
    if (Array.isArray(cachedData) && cachedData.length > 0) {
      console.log(`⚡ [Caché Local Detectada] Cargando ${cachedData.length} productos ya descargados de: ${latestLocalFile}`);
      console.log(`   (Cero créditos consumidos. Si deseas forzar llamada a la API usa --fresh)\n`);
      gatheredProducts = cachedData.slice(0, target);
      for (const p of gatheredProducts) {
        if (p.asin) seenAsins.add(p.asin);
      }
    }
  }

  let currentPage = 1;
  const maxPages = Math.ceil(target / 25) + 3; // Límite de seguridad de páginas

  while (gatheredProducts.length < target && currentPage <= maxPages) {
    console.log(`📄 Solicitando página ${currentPage}... (Llevamos ${gatheredProducts.length}/${target})`);

    const pageResults = await provider.search(searchTerm, {
      category,
      page: currentPage,
      limit: 50,
    });

    if (!pageResults || pageResults.length === 0) {
      console.log('⚠️ No se recibieron más productos de la búsqueda.');
      break;
    }

    let addedFromPage = 0;
    for (const item of pageResults) {
      if (!item.asin || seenAsins.has(item.asin)) continue;
      seenAsins.add(item.asin);
      gatheredProducts.push(item);
      addedFromPage++;

      if (gatheredProducts.length >= target) break;
    }

    console.log(`   -> Añadidos ${addedFromPage} productos nuevos de la página ${currentPage}. Total acumulado: ${gatheredProducts.length}`);
    currentPage++;

    if (isMock) {
      // En modo mock duplicamos los fixtures con asins sintéticos si se piden más de los que hay
      while (gatheredProducts.length < target) {
        const copy = { ...pageResults[gatheredProducts.length % pageResults.length] };
        copy.asin = `${copy.asin}_MOCK_${gatheredProducts.length + 1}`;
        copy.title = `${copy.title} (Variante #${gatheredProducts.length + 1})`;
        gatheredProducts.push(copy);
      }
      break;
    }
  }

  // 1. Guardar de forma inmediata en local (Cero pérdida de créditos si falla la BD)
  const harvestFile = path.join(harvestDir, `${categorySlug}-harvest-${gatheredProducts.length}.json`);
  fs.writeFileSync(harvestFile, JSON.stringify(gatheredProducts, null, 2), 'utf-8');
  console.log(`\n💾 [Copia Local Guardada] ${gatheredProducts.length} productos respaldados en: ${harvestFile}`);
  console.log(`💾 Guardando catálogo y orden de ranking 1..${gatheredProducts.length} en Neon...`);

  let savedCount = 0;
  for (let rankIndex = 0; rankIndex < gatheredProducts.length; rankIndex++) {
    const raw = gatheredProducts[rankIndex];
    const position = rankIndex + 1;
    const normalized = normalizeRainforestProduct(raw, category);
    const productSlug = `${slugify(normalized.name).slice(0, 80)}-${normalized.asin}`;

    if (isDryRun) {
      console.log(`   [#${position}] ${normalized.brandName} - ${normalized.name} (${normalized.asin})`);
      continue;
    }

    try {
      // 1. Marca
      const brandSlug = slugify(normalized.brandName || 'Generico');
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        create: { name: normalized.brandName || 'Genérico', slug: brandSlug },
        update: {},
      });

      // 2. Producto (UPSERT directo en PostgreSQL con fallback)
      let productId: string;
      try {
        const rawRes: any = await prisma.$queryRawUnsafe(`
          INSERT INTO products (
            id, asin, name, slug, brand_id, category_id,
            image_url, front_image_url, package_quantity, source_url,
            source_provider, source_id, is_bestseller, bestseller_rank,
            rating, ratings_total, raw_payload, is_active, created_at, updated_at
          ) VALUES (
            'p_' || md5(random()::text),
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            'RAINFOREST', $1, $10, $11,
            $12, $13, $14::jsonb, true, NOW(), NOW()
          )
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            asin = COALESCE(EXCLUDED.asin, products.asin),
            rating = EXCLUDED.rating,
            ratings_total = EXCLUDED.ratings_total,
            image_url = COALESCE(EXCLUDED.image_url, products.image_url),
            bestseller_rank = EXCLUDED.bestseller_rank,
            is_bestseller = EXCLUDED.is_bestseller,
            raw_payload = EXCLUDED.raw_payload,
            updated_at = NOW()
          RETURNING id;
        `,
          normalized.asin,
          normalized.name,
          productSlug,
          brand.id,
          dbCategory.id,
          normalized.imageUrl,
          normalized.imageUrl,
          normalized.packageQuantity || null,
          normalized.sourceUrl,
          position <= 10,
          position,
          normalized.rating || null,
          normalized.ratingsTotal || null,
          JSON.stringify({ ...raw, isEnriched: false, harvestRank: position })
        );

        productId = rawRes[0]?.id;
      } catch (sqlErr: any) {
        // Si el esquema antiguo no tiene la columna asin, fallback al esquema base
        const fallbackRes: any = await prisma.$queryRawUnsafe(`
          INSERT INTO products (
            id, ean, name, slug, brand_id, category_id,
            image_url, front_image_url, package_quantity, source_url,
            is_active, created_at, updated_at
          ) VALUES (
            'p_' || md5(random()::text),
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            true, NOW(), NOW()
          )
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            image_url = COALESCE(EXCLUDED.image_url, products.image_url),
            updated_at = NOW()
          RETURNING id;
        `,
          normalized.asin,
          normalized.name,
          productSlug,
          brand.id,
          dbCategory.id,
          normalized.imageUrl,
          normalized.imageUrl,
          normalized.packageQuantity || null,
          normalized.sourceUrl
        );
        productId = fallbackRes[0]?.id;
      }

      // 3. Oferta básica de precio
      if (normalized.currentPrice > 0) {
        await prisma.vendorOffer.upsert({
          where: {
            productId_vendorName: {
              productId: productId,
              vendorName: 'Amazon',
            },
          },
          create: {
            productId: productId,
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
            inStock: true,
            lastUpdated: new Date(),
          },
        });
      }

      // 4. Guardar orden en CategoryRanking (modelo de rankings para la web)
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO category_rankings (id, category_id, product_id, position, source, updated_at)
          VALUES (
            'cr_' || md5(random()::text),
            $1,
            $2,
            $3,
            'AMAZON_ES',
            NOW()
          )
          ON CONFLICT (category_id, position)
          DO UPDATE SET product_id = EXCLUDED.product_id, updated_at = NOW();
        `, dbCategory.id, productId, position);
      } catch (rkErr: any) {
        // En caso de que la tabla aún se esté sincronizando
      }

      savedCount++;
      if (position % 25 === 0 || position === gatheredProducts.length) {
        console.log(`   -> Progreso: ${position}/${gatheredProducts.length} productos procesados.`);
      }
    } catch (err: any) {
      console.error(`   ❌ Error guardando [#${position}] ${normalized.asin}:`, err.message || err);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 Cosecha completada con éxito!`);
  console.log(`   Categoría: ${category}`);
  console.log(`   Productos guardados en catálogo: ${savedCount}`);
  console.log(`   Peticiones de Rainforest consumidas: ${provider.getRequestsCount()} crédito(s)`);
  console.log('================================================================\n');
}

main()
  .catch(e => {
    console.error('Fatal error en harvest:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
