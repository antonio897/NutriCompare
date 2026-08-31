import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';

async function inspectSample() {
  const filePath = path.join(process.cwd(), 'data', 'openfoodfacts-products.jsonl.gz');
  if (!fs.existsSync(filePath)) {
    console.error('No se encuentra el archivo');
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const inputStream = fileStream.pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input: inputStream, crlfDelay: Infinity });

  let found = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      const name = item.product_name || item.product_name_es || item.product_name_en || '';
      
      // Buscar productos que tengan código de barras y algo de imagen o fotos
      if (item.code && (item.images || item.image_front_url || item.selected_images)) {
        found++;
        console.log(`\n================== PRODUCTO #${found} (EAN: ${item.code}) ==================`);
        console.log(`Nombre: ${name}`);
        console.log(`image_front_url directo:`, item.image_front_url);
        console.log(`image_url directo:`, item.image_url);
        console.log(`selected_images:`, JSON.stringify(item.selected_images, null, 2));
        console.log(`images keys:`, item.images ? Object.keys(item.images) : 'null');
        if (item.images) {
          // Mostrar las 2 primeras keys de images
          const sampleKeys = Object.keys(item.images).slice(0, 3);
          for (const k of sampleKeys) {
            console.log(`  images['${k}']:`, JSON.stringify(item.images[k]));
          }
        }
        
        if (found >= 5) break;
      }
    } catch {
      continue;
    }
  }
}

inspectSample().catch(console.error);
