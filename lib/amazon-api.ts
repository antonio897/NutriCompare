/**
 * lib/amazon-api.ts
 * 
 * Servicio de sincronización con Amazon Product Advertising API (PA-API 5.0).
 * - Manejo en lotes (máximo 10 ASINs por petición según especificación oficial de Amazon).
 * - Control de cuotas y Throttling (1 request por segundo para respetar los límites gratuitos de la API).
 * - Actualización de ofertas y registro de histórico de precios en PostgreSQL.
 */

import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AmazonItemResult {
  asin: string;
  price: number;
  currency: string;
  url: string;
  inStock: boolean;
  title?: string;
}

interface AmazonApiConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  region: string;
  host: string;
}

function getAmazonConfig(): AmazonApiConfig {
  return {
    accessKey: process.env.AMAZON_ACCESS_KEY || '',
    secretKey: process.env.AMAZON_SECRET_KEY || '',
    partnerTag: process.env.AMAZON_PARTNER_TAG || 'nutricompare-21',
    region: process.env.AMAZON_REGION || 'eu-west-1',
    host: process.env.AMAZON_HOST || 'webservices.amazon.es',
  };
}

/**
 * Generador de firma AWS SigV4 para autenticación segura en PA-API 5.0
 */
function createAwsSigV4Headers(
  config: AmazonApiConfig,
  payload: string,
  target: string = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
): Record<string, string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  const service = 'ProductAdvertisingAPI';

  const canonicalUri = '/paapi5/getitems';
  const canonicalQueryString = '';
  const canonicalHeaders = `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${config.host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

  const kDate = crypto.createHmac('sha256', `AWS4${config.secretKey}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(config.region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorizationHeader = `${algorithm} Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    host: config.host,
    'x-amz-date': amzDate,
    'x-amz-target': target,
    Authorization: authorizationHeader,
  };
}

/**
 * Consulta un lote de hasta 10 ASINs a la API de Amazon
 */
async function fetchAmazonBatch(asins: string[], config: AmazonApiConfig): Promise<AmazonItemResult[]> {
  const payload = JSON.stringify({
    ItemIds: asins,
    ItemIdType: 'ASIN',
    Resources: [
      'Offers.Listings.Price',
      'Offers.Listings.Availability.Message',
      'ItemInfo.Title',
    ],
    PartnerTag: config.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.es',
  });

  const headers = createAwsSigV4Headers(config, payload);
  const endpoint = `https://${config.host}/paapi5/getitems`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Amazon PA-API Error HTTP ${response.status}]:`, errorText);
    return [];
  }

  const data = await response.json();
  const items = data.ItemsResult?.Items || [];
  const results: AmazonItemResult[] = [];

  for (const item of items) {
    const asin = item.ASIN;
    const title = item.ItemInfo?.Title?.DisplayValue || '';
    const detailPageUrl = item.DetailPageURL || `https://www.amazon.es/dp/${asin}?tag=${config.partnerTag}`;

    const listing = item.Offers?.Listings?.[0];
    const price = listing?.Price?.Amount ?? 0;
    const currency = listing?.Price?.Currency ?? 'EUR';
    const availability = listing?.Availability?.Message || '';
    const inStock = !availability.toLowerCase().includes('no disponible');

    if (asin && price > 0) {
      results.push({
        asin,
        title,
        price,
        currency,
        url: detailPageUrl,
        inStock,
      });
    }
  }

  return results;
}

/**
 * Sincroniza ofertas de Amazon para una lista de productos en la base de datos
 */
export async function syncAmazonPrices(options?: { limit?: number }) {
  const config = getAmazonConfig();

  if (!config.accessKey || !config.secretKey) {
    console.warn('[Amazon Sync] Variables AMAZON_ACCESS_KEY o AMAZON_SECRET_KEY no configuradas.');
    return { success: false, reason: 'Missing credentials' };
  }

  // 1. Obtener ofertas de Amazon registradas que tengan SKU/ASIN
  const amazonOffers = await prisma.vendorOffer.findMany({
    where: {
      vendorName: 'Amazon',
      vendorSku: { not: null },
    },
    take: options?.limit || 100,
    select: {
      id: true,
      productId: true,
      vendorSku: true,
      currentPrice: true,
    },
  });

  if (amazonOffers.length === 0) {
    console.log('[Amazon Sync] No hay productos con ASIN de Amazon pendientes de sincronizar.');
    return { success: true, updatedCount: 0 };
  }

  // 2. Agrupar en lotes de 10 ASINs (límite oficial de Amazon PA-API)
  const BATCH_SIZE = 10;
  const batches: (typeof amazonOffers)[] = [];
  for (let i = 0; i < amazonOffers.length; i += BATCH_SIZE) {
    batches.push(amazonOffers.slice(i, i + BATCH_SIZE));
  }

  let totalUpdated = 0;

  for (const batch of batches) {
    const asinMap = new Map<string, typeof amazonOffers[0]>();
    batch.forEach((o) => {
      if (o.vendorSku) asinMap.set(o.vendorSku, o);
    });

    const asins = Array.from(asinMap.keys());
    console.log(`[Amazon Sync] Consultando lote de ${asins.length} ASINs...`);

    const results = await fetchAmazonBatch(asins, config);

    for (const res of results) {
      const existingOffer = asinMap.get(res.asin);
      if (!existingOffer) continue;

      // Actualizar oferta
      await prisma.vendorOffer.update({
        where: { id: existingOffer.id },
        data: {
          currentPrice: res.price,
          currency: res.currency,
          affiliateUrl: res.url,
          inStock: res.inStock,
          lastUpdated: new Date(),
        },
      });

      // Guardar histórico si el precio cambió
      if (Math.abs(existingOffer.currentPrice - res.price) > 0.01) {
        await prisma.priceHistory.create({
          data: {
            vendorOfferId: existingOffer.id,
            price: res.price,
            date: new Date(),
          },
        });
      }

      totalUpdated++;
    }

    // Rate Limiting Throttling (Espera 1.1 segundos entre lotes para no exceder cuotas gratuitas)
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log(`✅ [Amazon Sync] Finalizado: ${totalUpdated} ofertas actualizadas.`);
  return { success: true, updatedCount: totalUpdated };
}
