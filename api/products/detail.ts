/**
 * api/products/detail.ts
 *
 * Endpoint serverless para obtener el detalle enriquecido de un suplemento
 * con su desglose nutricional, certificaciones, análisis de laboratorio y
 * mejores ofertas comerciales con el tag de afiliado de Amazon.
 *
 * Endpoint:
 *   GET /api/products/detail?id=p_12345 (o por slug/asin)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AFFILIATE_TAG = 'nutricompare-21';

function formatAffiliateUrl(url: string | null | undefined, asin?: string | null): string {
  if (asin) {
    return https://www.amazon.es/dp/?tag=;
  }
  if (!url) return '#';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('amazon.')) {
      parsed.searchParams.set('tag', AFFILIATE_TAG);
      return parsed.toString();
    }
  } catch {
    if (url.includes('amazon.')) {
      const sep = url.includes('?') ? '&' : '?';
      return ${url}tag=;
    }
  }
  return url;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, asin, slug } = req.query;

  if (!id && !asin && !slug) {
    return res.status(400).json({
      error: 'Debes proporcionar al menos un parámetro: ?id=, ?asin= o ?slug=',
    });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          id ? { id: String(id) } : undefined,
          asin ? { asin: String(asin) } : undefined,
          slug ? { slug: String(slug) } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        brand: true,
        category: true,
        nutritionalInfo: true,
        certifications: {
          include: {
            certification: true,
          },
        },
        labReports: {
          orderBy: { testDate: 'desc' },
          take: 3,
        },
        vendorOffers: {
          include: {
            vendor: true,
            priceHistory: {
              orderBy: { recordedAt: 'desc' },
              take: 30,
            },
          },
        },
        categoryRankings: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
    }

    const offers = (product.vendorOffers || []).map((o) => ({
      vendorName: o.vendor?.name || 'Amazon.es',
      price: Number(o.price),
      currency: o.currency || '€',
      url: formatAffiliateUrl(o.url, product.asin),
      inStock: o.inStock,
      isAmazon: o.vendor?.name?.toLowerCase().includes('amazon') || !!product.asin,
      priceHistory: (o.priceHistory || []).map((h) => ({
        price: Number(h.price),
        date: h.recordedAt,
      })),
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return res.status(200).json({
      success: true,
      product: {
        ...product,
        offers,
        amazonAffiliateUrl: product.asin
          ? https://www.amazon.es/dp/?tag=
          : null,
      },
    });
  } catch (error) {
    console.error('[API Product Detail Error]:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno obteniendo producto',
    });
  }
}
