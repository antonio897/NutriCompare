/**
 * api/products/compare.ts
 * 
 * Vercel Serverless Function con Edge Caching para el comparador de suplementos.
 * Permite consultar la comparativa de hasta 4 productos y devuelve los datos
 * con cabeceras de caché perimetral (s-maxage=3600) para coste 0€ absoluto en BD.
 * 
 * Endpoint:
 *   GET /api/products/compare?ids=creature-creapure,micronized-creatine-bulk
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getComparisonData } from '../../lib/comparison-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { ids } = req.query;

  if (!ids || typeof ids !== 'string') {
    return res.status(400).json({
      error: 'Parámetro ?ids= es requerido (ej: ?ids=prod1,prod2,prod3)',
    });
  }

  const productIds = ids.split(',').map((id) => id.trim()).filter(Boolean);

  if (productIds.length === 0) {
    return res.status(400).json({ error: 'Debes especificar al menos 1 ID de producto.' });
  }

  try {
    const data = await getComparisonData(productIds);

    // Cache-Control: Caché en el CDN de Vercel (Edge) durante 1 hora y revalidación en segundo plano (24 horas)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return res.status(200).json({
      success: true,
      count: data.length,
      products: data,
    });
  } catch (error) {
    console.error('[API Compare Error]:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error consultando comparativa',
    });
  }
}
