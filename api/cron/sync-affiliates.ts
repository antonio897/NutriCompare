/**
 * api/cron/sync-affiliates.ts
 * 
 * Vercel Serverless Function (Node.js) compatible directamente con proyectos Vite en Vercel.
 * Se expone en: GET /api/cron/sync-affiliates
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { dispatchSyncAlert } from '../../lib/alert-webhook';
import { syncAmazonPrices } from '../../lib/amazon-api';

const prisma = new PrismaClient();

interface FeedItem {
  ean?: string;
  sku?: string;
  vendorName: string;
  title: string;
  price: number;
  currency: string;
  affiliateUrl: string;
  inStock: boolean;
}

function parseCsvFeed(csvContent: string, vendorName: string): FeedItem[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const eanIdx = headers.findIndex((h) => h === 'ean' || h === 'barcode' || h === 'gtin');
  const skuIdx = headers.findIndex((h) => h === 'sku' || h === 'product_id' || h === 'id');
  const priceIdx = headers.findIndex((h) => h === 'price' || h === 'current_price' || h === 'precio');
  const urlIdx = headers.findIndex((h) => h === 'link' || h === 'url' || h === 'affiliate_url' || h === 'deeplink');
  const stockIdx = headers.findIndex((h) => h === 'stock' || h === 'in_stock' || h === 'availability');
  const titleIdx = headers.findIndex((h) => h === 'title' || h === 'name' || h === 'nombre');

  const items: FeedItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    const ean = eanIdx !== -1 ? cols[eanIdx] : undefined;
    const sku = skuIdx !== -1 ? cols[skuIdx] : undefined;
    const rawPrice = priceIdx !== -1 ? cols[priceIdx] : '0';
    const price = parseFloat(rawPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));
    const affiliateUrl = urlIdx !== -1 ? cols[urlIdx] : '';
    const title = titleIdx !== -1 ? cols[titleIdx] : '';
    const stockVal = stockIdx !== -1 ? cols[stockIdx].toLowerCase() : 'in stock';
    const inStock = stockVal.includes('in') || stockVal === '1' || stockVal === 'true' || stockVal === 'disponible';

    if ((ean || sku) && price > 0 && affiliateUrl) {
      items.push({
        ean,
        sku,
        vendorName,
        title,
        price,
        currency: 'EUR',
        affiliateUrl,
        inStock,
      });
    }
  }

  return items;
}

function parseXmlFeed(xmlContent: string, vendorName: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>|<product>([\s\S]*?)<\/product>/gi;
  let match;

  while ((match = itemRegex.exec(xmlContent)) !== null) {
    const block = match[1] || match[2];

    const getTag = (tag: string) => {
      const tagMatch = new RegExp(`<(?:g:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:g:)?${tag}>`, 'i').exec(block);
      return tagMatch ? tagMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined;
    };

    const ean = getTag('gtin') || getTag('ean') || getTag('barcode');
    const sku = getTag('id') || getTag('sku') || getTag('g:id');
    const title = getTag('title') || getTag('name') || '';
    const rawPrice = getTag('price') || getTag('g:price') || '0';
    const price = parseFloat(rawPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));
    const affiliateUrl = getTag('link') || getTag('url') || getTag('g:link') || '';
    const availability = (getTag('availability') || getTag('g:availability') || 'in stock').toLowerCase();
    const inStock = availability.includes('in stock') || availability.includes('disponible');

    if ((ean || sku) && price > 0 && affiliateUrl) {
      items.push({
        ean,
        sku,
        vendorName,
        title,
        price,
        currency: 'EUR',
        affiliateUrl,
        inStock,
      });
    }
  }

  return items;
}

async function syncFeedOffers(feedItems: FeedItem[]) {
  let matched = 0;
  let updated = 0;

  for (const item of feedItems) {
    if (!item.ean && !item.sku) continue;

    let product = null;
    if (item.ean) {
      product = await prisma.product.findUnique({
        where: { ean: item.ean },
        select: { id: true },
      });
    }

    if (!product) continue;
    matched++;

    const offer = await prisma.vendorOffer.upsert({
      where: {
        productId_vendorName: {
          productId: product.id,
          vendorName: item.vendorName,
        },
      },
      update: {
        currentPrice: item.price,
        affiliateUrl: item.affiliateUrl,
        inStock: item.inStock,
        vendorSku: item.sku || null,
        lastUpdated: new Date(),
      },
      create: {
        productId: product.id,
        vendorName: item.vendorName,
        vendorSku: item.sku || null,
        currentPrice: item.price,
        currency: item.currency,
        affiliateUrl: item.affiliateUrl,
        inStock: item.inStock,
        lastUpdated: new Date(),
      },
    });

    await prisma.priceHistory.create({
      data: {
        vendorOfferId: offer.id,
        price: item.price,
        date: new Date(),
      },
    });

    updated++;
  }

  return { matched, updated };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  // 1. Verificación de Token Bearer
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'No autorizado. Token de seguridad inválido o ausente.' });
  }

  const feedsConfig = [
    {
      name: 'HSN Store',
      url: process.env.FEED_URL_HSN || 'https://raw.githubusercontent.com/example/feeds/main/hsn_sample.csv',
      type: 'csv',
    },
    {
      name: 'Prozis',
      url: process.env.FEED_URL_PROZIS || 'https://raw.githubusercontent.com/example/feeds/main/prozis_sample.xml',
      type: 'xml',
    },
  ];

  const results: Record<string, unknown>[] = [];

  try {
    for (const feed of feedsConfig) {
      console.log(`[Cron] Descargando feed de ${feed.name}...`);
      
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': 'NutriCompare-SyncEngine/1.0' },
      });

      if (!response.ok) {
        results.push({
          vendor: feed.name,
          status: 'error',
          message: `HTTP Error: ${response.status}`,
        });
        continue;
      }

      const content = await response.text();
      const parsedItems =
        feed.type === 'csv'
          ? parseCsvFeed(content, feed.name)
          : parseXmlFeed(content, feed.name);

      const stats = await syncFeedOffers(parsedItems);

      results.push({
        vendor: feed.name,
        status: 'success',
        itemsInFeed: parsedItems.length,
        matchedInDB: stats.matched,
        offersUpdated: stats.updated,
      });
    }

    // 2. Amazon PA-API
    if (process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY) {
      console.log('[Cron] Consultando Amazon PA-API...');
      const amazonResult = await syncAmazonPrices({ limit: 100 });
      results.push({
        vendor: 'Amazon',
        status: amazonResult.success ? 'success' : 'warning',
        offersUpdated: amazonResult.updatedCount || 0,
      });
    }

    const duration = Date.now() - startTime;
    const totalUpdated = results.reduce((acc, r) => acc + (typeof r.offersUpdated === 'number' ? r.offersUpdated : 0), 0);

    // 3. Notificación a Discord/Telegram
    await dispatchSyncAlert({
      title: 'Sincronización de Precios Completada',
      status: 'success',
      summaryText: `Se han actualizado con éxito **${totalUpdated} ofertas** en la base de datos.`,
      durationMs: duration,
      details: {
        'Proveedores procesados': results.length,
        'Total ofertas actualizadas': totalUpdated,
      },
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: duration,
      summary: results,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido durante la sincronización';
    console.error('[Cron Sync Error]:', error);

    await dispatchSyncAlert({
      title: 'Fallo en Sincronización de Precios',
      status: 'error',
      summaryText: `Ocurrió un error crítico durante el Cron Job: ${errorMsg}`,
      durationMs: Date.now() - startTime,
    });

    return res.status(500).json({
      success: false,
      error: errorMsg,
    });
  } finally {
    await prisma.$disconnect();
  }
}
