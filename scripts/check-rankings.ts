/**
 * scripts/check-rankings.ts
 * 
 * Script de verificación rápida para consultar el estado del catálogo y del ranking en Neon.
 * Uso: npx tsx scripts/check-rankings.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n======================================================');
  console.log('🔍 [NutriCompare] Verificación de Catálogo y Rankings');
  console.log('======================================================\n');

  try {
    // 1. Conteo total de productos y marcas
    const totalProducts: any = await prisma.$queryRawUnsafe('SELECT count(*) as count FROM products;');
    const totalOffers: any = await prisma.$queryRawUnsafe('SELECT count(*) as count FROM vendor_offers;');
    const totalBrands: any = await prisma.$queryRawUnsafe('SELECT count(*) as count FROM brands;');

    console.log(`📦 Total Productos en Neon: ${totalProducts[0]?.count}`);
    console.log(`🏷️ Total Ofertas (Precios Amazon): ${totalOffers[0]?.count}`);
    console.log(`🏢 Total Marcas registradas: ${totalBrands[0]?.count}\n`);

    // 2. Comprobar tabla category_rankings
    try {
      const rankingCount: any = await prisma.$queryRawUnsafe('SELECT count(*) as count FROM category_rankings;');
      console.log(`🏆 Total Registros en category_rankings: ${rankingCount[0]?.count}`);

      const topRankings: any = await prisma.$queryRawUnsafe(`
        SELECT 
          cr.position as "Pos",
          c.name as "Categoría",
          p.name as "Producto",
          p.asin as "ASIN",
          p.rating as "Rating",
          p.ratings_total as "Reviews",
          vo.current_price as "Precio (€)"
        FROM category_rankings cr
        JOIN categories c ON c.id = cr.category_id
        JOIN products p ON p.id = cr.product_id
        LEFT JOIN vendor_offers vo ON vo.product_id = p.id AND vo.vendor_name = 'Amazon'
        ORDER BY cr.position ASC
        LIMIT 10;
      `);

      console.log('\n🔝 Top 10 del Ranking en Neon:');
      console.table(topRankings);
    } catch (rkErr: any) {
      console.log('ℹ️ category_rankings aún no existe o está vacía. Mostrando Top por bestseller_rank de products:');
      const topProducts: any = await prisma.$queryRawUnsafe(`
        SELECT 
          p.bestseller_rank as "Rank",
          p.name as "Producto",
          p.asin as "ASIN",
          p.rating as "Rating",
          p.ratings_total as "Reviews"
        FROM products p
        WHERE p.bestseller_rank IS NOT NULL
        ORDER BY p.bestseller_rank ASC
        LIMIT 10;
      `);
      console.table(topProducts);
    }

  } catch (err: any) {
    console.error('❌ Error consultando la base de datos:', err.message || err);
  } finally {
    await prisma.$disconnect();
    console.log('\n======================================================\n');
  }
}

main();
