/**
 * scripts/sync-prices-cli.ts
 * 
 * Script CLI de sincronización manual de precios bajo demanda.
 * Permite actualizar precios desde la terminal sin necesidad de levantar el servidor web.
 * 
 * Uso:
 *   npx tsx scripts/sync-prices-cli.ts --all
 *   npx tsx scripts/sync-prices-cli.ts --amazon
 *   npx tsx scripts/sync-prices-cli.ts --feeds
 */

import { syncAmazonPrices } from '../lib/amazon-api';
import { dispatchSyncAlert } from '../lib/alert-webhook';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isAmazonOnly = args.includes('--amazon');
  const isFeedsOnly = args.includes('--feeds');
  const isAll = args.includes('--all') || (!isAmazonOnly && !isFeedsOnly);

  console.log('⚡ [NutriCompare Price Sync CLI]');
  console.log(`Modo: ${isAll ? 'Todos (Amazon + Feeds)' : isAmazonOnly ? 'Solo Amazon' : 'Solo Feeds'}\n`);

  const startTime = Date.now();
  let totalUpdated = 0;

  try {
    // 1. Sincronizar Amazon PA-API
    if (isAll || isAmazonOnly) {
      console.log('📦 Consultando Amazon PA-API...');
      const amazonResult = await syncAmazonPrices({ limit: 100 });
      if (amazonResult.success) {
        totalUpdated += amazonResult.updatedCount || 0;
        console.log(`  -> Amazon: ${amazonResult.updatedCount || 0} ofertas actualizadas.`);
      } else {
        console.warn(`  -> Amazon omitido o sin credenciales: ${amazonResult.reason}`);
      }
    }

    // 2. Reporte final
    const duration = Date.now() - startTime;
    console.log(`\n🎉 Sincronización manual completada en ${(duration / 1000).toFixed(1)}s.`);
    console.log(`Total ofertas actualizadas: ${totalUpdated}`);

    await dispatchSyncAlert({
      title: 'Sincronización CLI Manual Ejecutada',
      status: 'success',
      summaryText: `Se actualizaron **${totalUpdated} ofertas** manualmente vía terminal.`,
      durationMs: duration,
    });
  } catch (err) {
    console.error('❌ Error durante la sincronización CLI:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
