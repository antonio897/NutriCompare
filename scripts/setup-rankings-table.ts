/**
 * scripts/setup-rankings-table.ts
 * 
 * Crea la tabla `category_rankings` directamente en Neon PostgreSQL
 * y migra las posiciones del catálogo ya cosechado a dicha tabla.
 * 
 * Uso: npx tsx scripts/setup-rankings-table.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n================================================================');
  console.log('🛠️ [NutriCompare] Creación y Poblado de Tabla: category_rankings');
  console.log('================================================================\n');

  try {
    // 1. Crear tabla en PostgreSQL con IF NOT EXISTS
    console.log('1️⃣ Creando tabla category_rankings e índices en Neon...');
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
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_category_rankings_pos ON category_rankings(category_id, position);
    `);
    console.log('   ✅ Tabla category_rankings asegurada en Neon con éxito.');

    // Asegurar columnas complementarias en products
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS asin VARCHAR(32);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS bestseller_rank INTEGER;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS rating FLOAT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ratings_total INTEGER;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS format VARCHAR(50);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS flavour VARCHAR(100);`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS servings INTEGER;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS raw_payload JSONB;`).catch(() => {});

    // 2. Poblar category_rankings leyendo la copia local de proteina-harvest
    console.log('\n2️⃣ Sincronizando los 152 productos del catálogo con la tabla de rankings...');
    const fs = await import('fs');
    const path = await import('path');
    const harvestDir = path.resolve(process.cwd(), 'data', 'harvest');
    const harvestFiles = fs.existsSync(harvestDir) ? fs.readdirSync(harvestDir).filter(f => f.endsWith('.json')) : [];

    let totalRanked = 0;

    for (const file of harvestFiles) {
      const items: any[] = JSON.parse(fs.readFileSync(path.join(harvestDir, file), 'utf-8'));
      console.log(`   Procesando archivo local: ${file} (${items.length} productos)...`);

      // Obtener la categoría
      const categoryName = file.split('-')[0] === 'proteina' ? 'Proteína' : file.split('-')[0];
      const catRow: any = await prisma.$queryRawUnsafe(`
        SELECT id FROM categories WHERE lower(slug) = lower($1) OR lower(name) = lower($2) LIMIT 1;
      `, categoryName, categoryName);

      const categoryId = catRow[0]?.id;
      if (!categoryId) continue;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const position = i + 1;

        // Buscar producto por ASIN o slug
        const prodRow: any = await prisma.$queryRawUnsafe(`
          SELECT id FROM products WHERE asin = $1 OR slug LIKE $2 OR ean = $1 LIMIT 1;
        `, item.asin, `%${item.asin}%`);

        const productId = prodRow[0]?.id;
        if (productId) {
          // Actualizar bestseller_rank en el producto
          await prisma.$executeRawUnsafe(`
            UPDATE products 
            SET bestseller_rank = $1, is_bestseller = $2, asin = $3, rating = $4, ratings_total = $5
            WHERE id = $6;
          `, position, position <= 10, item.asin, item.rating || null, item.ratings_total || null, productId).catch(() => {});

          // Insertar en category_rankings
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
          `, categoryId, productId, position);

          totalRanked++;
        }
      }
    }

    console.log(`   ✅ Sincronizados ${totalRanked} puestos en category_rankings.`);

    // 3. Verificación
    const count: any = await prisma.$queryRawUnsafe('SELECT count(*) as count FROM category_rankings;');
    console.log(`\n🏆 Total de posiciones activas en category_rankings: ${count[0]?.count}`);

    const top10: any = await prisma.$queryRawUnsafe(`
      SELECT 
        cr.position as "Posición",
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

    console.log('\n🔝 Top 10 Oficial de Ventas en Amazon España:');
    console.table(top10);

  } catch (err: any) {
    console.error('❌ Error configurando tabla:', err.message || err);
  } finally {
    await prisma.$disconnect();
    console.log('\n================================================================\n');
  }
}

main();
