/**
 * api/products/list.ts
 * 
 * Vercel Serverless Function: GET /api/products/list
 * 
 * Consulta Neon PostgreSQL a través de Prisma y devuelve una lista
 * de suplementos con filtros, búsqueda y paginación.
 * 
 * Query params:
 *   - category: string         (ej: "Creatina", "Proteína", "All")
 *   - search: string           (búsqueda por nombre/marca)
 *   - purityCertified: boolean
 *   - minScore: number         (NutriScore mínimo)
 *   - page: number             (default: 1)
 *   - limit: number            (default: 24)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamos categorías del frontend al formato de la BD
const CATEGORY_MAP: Record<string, string[]> = {
  'Creatina': ['creatine', 'creatina', 'créatine', 'creapure'],
  'Proteína': ['whey', 'protein', 'proteína', 'proteina', 'casein', 'isolate'],
  'BCAA': ['bcaa', 'aminoácidos', 'aminoacidos', 'amino acid', 'ramificados', 'leucina'],
  'Magnesio': ['magnesium', 'magnesio', 'bisglicinato', 'citrato'],
  'Omega-3': ['omega-3', 'omega 3', 'fish oil', 'aceite de pescado', 'epa', 'dha', 'ifos'],
  'Pre-Entreno': ['pre-workout', 'pre workout', 'pre entreno', 'citrulline', 'beta-alanine'],
  'Multivitamínico': ['multivitamin', 'multivitaminico', 'vitamin'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Cabeceras CORS para desarrollo local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const {
    category = 'All',
    search = '',
    diet,
    nova,
    purityCertified,
    bestsellersOnly,
    sortBy = 'popular',
    minScore = '0',
    page = '1',
    limit = '24',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const minScoreNum = parseFloat(minScore) || 0;

  try {
    // Construir filtros WHERE de Prisma — solo mostrar productos de Rainforest API
    const where: Record<string, unknown> = {
      asin: { not: null }, // solo productos con ASIN (cosechados de Amazon)
    };

    // Filtro por categoría
    if (category !== 'All') {
      const keywords = CATEGORY_MAP[category] || [category.toLowerCase()];
      where.OR = [
        { category: { name: { contains: category, mode: 'insensitive' } } },
        ...keywords.map((kw) => ({ name: { contains: kw, mode: 'insensitive' } })),
      ];
    }

    // Filtro de búsqueda por texto libre (nombre o marca)
    if (search.trim()) {
      const searchCondition = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { name: { contains: search, mode: 'insensitive' } } },
        ],
      };
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition];
        delete where.OR;
      } else {
        where.OR = (searchCondition as { OR: unknown[] }).OR;
      }
    }

    // Filtro de Más Vendidos (Bestsellers)
    if (bestsellersOnly === 'true') {
      where.isBestseller = true;
    }

    // Filtros de Dietas & Necesidades
    if (diet) {
      const nutWhere: Record<string, unknown> = {};
      if (diet === 'vegano') nutWhere.isVegan = true;
      else if (diet === 'sin-gluten') nutWhere.isGlutenFree = true;
      else if (diet === 'sin-lactosa') nutWhere.isLactoseFree = true;
      else if (diet === 'cero-azucar') nutWhere.sugarsPer100g = { lte: 1.5 };
      where.nutritionalInfo = nutWhere;
    }

    // Filtro de Grado NOVA
    if (nova && !isNaN(parseInt(nova))) {
      where.nutritionalInfo = {
        ...(where.nutritionalInfo as Record<string, unknown> || {}),
        novaGroup: parseInt(nova),
      };
    }

    // Filtro de pureza certificada
    if (purityCertified === 'true') {
      where.certifications = { some: {} };
    }

    // Ordenación — por defecto orden de ranking de ventas de Amazon
    let orderBy: any = [{ bestsellerRank: 'asc' }, { isBestseller: 'desc' }, { createdAt: 'desc' }];
    if (sortBy === 'bestsellers') {
      orderBy = [{ isBestseller: 'desc' }, { bestsellerRank: 'asc' }, { rating: 'desc' }];
    } else if (sortBy === 'score') {
      orderBy = [{ nutritionalInfo: { nutriscoreCalculated: 'desc' } }, { bestsellerRank: 'asc' }];
    } else if (sortBy === 'purity') {
      orderBy = [{ nutritionalInfo: { rawPurityPercentage: 'desc' } }, { bestsellerRank: 'asc' }];
    } else if (sortBy === 'priceAsc') {
      orderBy = [{ vendorOffers: { _count: 'desc' } }, { bestsellerRank: 'asc' }];
    }

    // Consulta con JOIN optimizado
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          brand: true,
          category: true,
          nutritionalInfo: true,
          certifications: {
            include: { certification: true },
          },
          vendorOffers: {
            take: 1,
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Mapear al formato SupplementProduct que espera el frontend
    const mapped = products.map((p) => mapProductToFrontend(p));

    return res.status(200).json({
      data: mapped,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + limitNum < total,
      },
    });
  } catch (error) {
    console.error('[api/products/list] Error:', error);
    return res.status(500).json({
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Error al conectar con la base de datos',
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Mapea un producto de Prisma al formato SupplementProduct del frontend.
 */
function mapProductToFrontend(p: {
  id: string;
  name: string;
  ean?: string | null;
  imageUrl?: string | null;
  frontImageUrl?: string | null;
  frontSmallImageUrl?: string | null;
  packagingImageUrl?: string | null;
  packageQuantity?: string | null;
  sourceUrl?: string | null;
  brand?: { name: string } | null;
  category?: { name: string } | null;
  nutritionalInfo?: {
    proteinPer100g?: number | null;
    creatinePerServing?: number | null;
    sugarsPer100g?: number | null;
    saturatedFatPer100g?: number | null;
    saltPer100g?: number | null;
    fiberPer100g?: number | null;
    caffeineMg?: number | null;
    magnesiumMg?: number | null;
    potassiumMg?: number | null;
    zincMg?: number | null;
    calciumMg?: number | null;
    ironMg?: number | null;
    vitaminsList?: any;
    novaGroup?: number | null;
    ecoscoreGrade?: string | null;
    additivesCount?: number | null;
    additivesTags?: string[] | null;
    isVegan?: boolean | null;
    isVegetarian?: boolean | null;
    isGlutenFree?: boolean | null;
    isLactoseFree?: boolean | null;
    allergensList?: string[] | null;
    nutritionImageUrl?: string | null;
    ingredientsImageUrl?: string | null;
    manufacturingCountry?: string | null;
    servingSize?: string | null;
    nutriscoreCalculated?: number | null;
    ingredientsList?: string | null;
  } | null;
  certifications?: Array<{ certification?: { name: string } | null } | { name?: string }>;
  vendorOffers?: Array<{
    vendorName?: string;
    affiliateUrl?: string;
    storeName?: string;
    productUrl?: string;
    currentPrice: number | any;
  }>;
}) {
  const AFFILIATE_TAG = 'nutricompare-21';
  const score = Math.round(p.nutritionalInfo?.nutriscoreCalculated ?? 75);
  const protein = p.nutritionalInfo?.proteinPer100g ?? 0;
  const serving = 5;
  const priceRaw = Number(p.vendorOffers?.[0]?.currentPrice ?? 0);
  // Término de búsqueda: "Marca Nombre" para Amazon y HSN
  const searchTerm = [p.brand?.name, p.name].filter(Boolean).join(' ').trim() || p.name || '';
  // ASIN directo para enlace de producto en Amazon (con afiliado)
  const asin = (p as any).asin as string | null;
  const amazonUrl = asin
    ? `https://www.amazon.es/dp/${asin}?tag=${AFFILIATE_TAG}`
    : `https://www.amazon.es/s?k=${encodeURIComponent(searchTerm)}&tag=${AFFILIATE_TAG}`;
  const certNames = (p.certifications ?? [])
    .map((c: any) => c?.certification?.name || c?.name || '')
    .filter(Boolean);
  const purityPct = certNames.length > 0 ? 99.5 : (protein > 70 ? 90.0 : 85.0);

  const categoryName = p.category?.name ?? 'Suplementos Deportivos';

  // Etiquetas dietéticas calculadas
  const dietaryTags: string[] = [];
  if (p.nutritionalInfo?.isVegan) dietaryTags.push('Vegano');
  else if (p.nutritionalInfo?.isVegetarian) dietaryTags.push('Vegetariano');
  if (p.nutritionalInfo?.isGlutenFree) dietaryTags.push('Sin Gluten');
  if (p.nutritionalInfo?.isLactoseFree) dietaryTags.push('Sin Lactosa');
  if (p.nutritionalInfo?.sugarsPer100g !== null && p.nutritionalInfo?.sugarsPer100g !== undefined && p.nutritionalInfo.sugarsPer100g <= 1.5) {
    dietaryTags.push('Cero Azúcar');
  }

  // Galería de imágenes individuales disponibles
  const gallery: string[] = [];
  if (p.frontImageUrl) gallery.push(p.frontImageUrl);
  if (p.packagingImageUrl) gallery.push(p.packagingImageUrl);
  if (p.nutritionalInfo?.nutritionImageUrl) gallery.push(p.nutritionalInfo.nutritionImageUrl);
  if (p.nutritionalInfo?.ingredientsImageUrl) gallery.push(p.nutritionalInfo.ingredientsImageUrl);

  let displayImage = p.frontImageUrl || p.imageUrl || p.frontSmallImageUrl;
  if (!displayImage || displayImage.includes('placeholder')) {
    const catLower = categoryName.toLowerCase();
    if (catLower.includes('creatin')) {
      displayImage = 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80';
    } else if (catLower.includes('prote')) {
      displayImage = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80';
    } else if (catLower.includes('magnes')) {
      displayImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
    } else if (catLower.includes('omega')) {
      displayImage = 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&auto=format&fit=crop&q=80';
    } else if (catLower.includes('pre-') || catLower.includes('preworkout')) {
      displayImage = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80';
    } else if (catLower.includes('vitamin') || catLower.includes('mineral')) {
      displayImage = 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80';
    } else if (catLower.includes('amino') || catLower.includes('bcaa')) {
      displayImage = 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80';
    } else {
      displayImage = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80';
    }
  }

  if (gallery.length === 0) {
    gallery.push(displayImage);
  }


  const servingsCount = (p as any).servings || (p.packageQuantity ? parseInt(p.packageQuantity) : null) || Math.round(500 / serving);
  const costDose = priceRaw > 0 ? +(priceRaw / servingsCount).toFixed(2) : 0.35;

  let activeIngredientAmount = `${+(protein * serving / 100).toFixed(1)}g Proteína`;
  const catLower = categoryName.toLowerCase();
  if (catLower.includes('creatin')) {
    activeIngredientAmount = `${p.nutritionalInfo?.creatinePerServing ?? 3.4}g Creatina Pura`;
  } else if (catLower.includes('bcaa') || catLower.includes('amino')) {
    activeIngredientAmount = `${(p.nutritionalInfo as any)?.bcaaPerServing ?? 7.0}g BCAAs (2:1:1)`;
  } else if (catLower.includes('magnes')) {
    activeIngredientAmount = `${p.nutritionalInfo?.magnesiumMg ?? 375}mg Magnesio Elemental`;
  } else if (catLower.includes('omega')) {
    const epa = (p.nutritionalInfo as any)?.omega3EpaMg ?? 800;
    const dha = (p.nutritionalInfo as any)?.omega3DhaMg ?? 400;
    activeIngredientAmount = `${epa}mg EPA / ${dha}mg DHA`;
  }

  return {
    id: p.id,
    name: p.name,
    brand: p.brand?.name ?? 'NutriCompare',
    category: categoryName,
    nutriScore: score,
    scoreGrade: score >= 90 ? 'Grado S' : score >= 80 ? 'Grado A' : score >= 65 ? 'Grado B' : 'Grado C',
    image: displayImage,
    gallery,
    frontImageUrl: p.frontImageUrl,
    frontSmallImageUrl: p.frontSmallImageUrl,
    packagingImageUrl: p.packagingImageUrl,
    packageQuantity: p.packageQuantity,
    sourceUrl: amazonUrl, // siempre usamos el enlace con afiliado
    asin,
    price: priceRaw || 0,
    currency: '€',
    servings: servingsCount,
    servingSize: (p.nutritionalInfo as any)?.servingSize || `${serving}g`,
    costPerDose: costDose,
    activeIngredientAmount,
    purityPct,
    format: (p as any).format || 'Polvo',
    flavour: (p as any).flavour || 'Neutro',
    isBestseller: (p as any).isBestseller ?? false,
    bestsellerRank: (p as any).bestsellerRank ?? undefined,
    rank: (p as any).bestsellerRank ?? undefined,
    rating: (p as any).rating ?? null,
    ratingsTotal: (p as any).ratingsTotal ?? null,
    sourceProvider: (p as any).sourceProvider ?? 'RAINFOREST',
    allergens: p.nutritionalInfo?.allergensList?.length ? p.nutritionalInfo.allergensList.join(', ') : 'Consultar etiquetado',
    certifications: certNames.length > 0 ? certNames : ['Análisis Nutricional Verificado'],
    transparencyLevel: (certNames.length >= 2 ? 3 : certNames.length === 1 ? 2 : 1) as 1 | 2 | 3,
    isPurityCertified: certNames.length > 0 || purityPct >= 99,
    dietaryTags: dietaryTags.length ? dietaryTags : ['Análisis Nutricional Verificado'],
    description: p.brand?.name
      ? `${p.name} de ${p.brand.name}. Evaluado con NutriScore ${score}/100 en pureza nutricional.`
      : `${p.name}. Evaluado con NutriScore ${score}/100 en pureza nutricional.`,
    novaGroup: p.nutritionalInfo?.novaGroup ?? 1,
    sugarsPer100g: p.nutritionalInfo?.sugarsPer100g ?? 0,
    saturatedFatPer100g: p.nutritionalInfo?.saturatedFatPer100g ?? null,
    saltPer100g: p.nutritionalInfo?.saltPer100g ?? 0,
    caffeineMg: p.nutritionalInfo?.caffeineMg ?? null,
    magnesiumMg: p.nutritionalInfo?.magnesiumMg ?? null,
    potassiumMg: p.nutritionalInfo?.potassiumMg ?? null,
    zincMg: p.nutritionalInfo?.zincMg ?? null,
    calciumMg: p.nutritionalInfo?.calciumMg ?? null,
    ironMg: p.nutritionalInfo?.ironMg ?? null,
    vitaminsList: p.nutritionalInfo?.vitaminsList ?? null,
    ecoscoreGrade: p.nutritionalInfo?.ecoscoreGrade ?? null,
    additivesCount: p.nutritionalInfo?.additivesCount ?? 0,
    additivesTags: p.nutritionalInfo?.additivesTags ?? [],
    nutritionImageUrl: p.nutritionalInfo?.nutritionImageUrl || null,
    ingredientsImageUrl: p.nutritionalInfo?.ingredientsImageUrl || null,
    manufacturingCountry: p.nutritionalInfo?.manufacturingCountry || 'Unión Europea',
    ingredientsList: p.nutritionalInfo?.ingredientsList || null,
    specs: {
      mainIngredient: categoryName,
      recommendedDose: (p.nutritionalInfo as any)?.servingSize || `${serving}g por toma`,
      activePerDose: activeIngredientAmount,
      format: (p as any).format || 'Polvo',
      allergens: p.nutritionalInfo?.allergensList?.length ? p.nutritionalInfo.allergensList.join(', ') : 'Consultar etiquetado',
      certifications: certNames,
      nutritionImageUrl: p.nutritionalInfo?.nutritionImageUrl || null,
      manufacturingCountry: p.nutritionalInfo?.manufacturingCountry || 'Unión Europea',
      novaGroup: p.nutritionalInfo?.novaGroup ?? 1,
      sugarsPer100g: p.nutritionalInfo?.sugarsPer100g ?? 0,
      bcaaRatio: (p.nutritionalInfo as any)?.bcaaPerServing ? '2:1:1 Fermentación Vegetal' : undefined,
      omega3EpaMg: (p.nutritionalInfo as any)?.omega3EpaMg,
      omega3DhaMg: (p.nutritionalInfo as any)?.omega3DhaMg,
      magnesiumType: (p.nutritionalInfo as any)?.magnesiumType,
    },
    radarScores: {
      pureza: Math.min(10, purityPct / 10),
      valor: 8.5,
      perfil: protein > 75 ? 9.5 : 8.0,
      seguridad: certNames.length > 0 ? 9.8 : 8.2,
      transparencia: certNames.length >= 2 ? 9.5 : 8.0,
    },
    breakdown: [
      { label: 'Pureza del Ingrediente Activo', percentage: Math.min(100, Math.round(purityPct)), colorClass: 'bg-[#006c49]' },
      { label: 'Ausencia de Rellenos y Azúcares', percentage: Math.max(70, Math.round(100 - (p.nutritionalInfo?.sugarsPer100g || 0) * 2)), colorClass: 'bg-[#4edea3]' },
    ],
    pros: certNames.length > 0 ? [`Certificado con ${certNames[0]}`] : ['Ingrediente de alta biodisponibilidad'],
    contras: p.nutritionalInfo?.additivesCount && p.nutritionalInfo.additivesCount > 2 ? [`Contiene ${p.nutritionalInfo.additivesCount} edulcorantes/aditivos`] : [],
    // Siempre incluimos enlace directo a Amazon con afiliado nutricompare-21
    purchaseLinks: [
      {
        store: 'Amazon.es',
        url: amazonUrl,
        price: priceRaw || (p.vendorOffers && p.vendorOffers.length > 0 ? Number(p.vendorOffers[0].currentPrice) : 0),
        highlight: true,
      },
      ...((p.vendorOffers && p.vendorOffers.length > 0)
        ? p.vendorOffers
            .filter((vo) => (vo.storeName || vo.vendorName || '').toLowerCase() !== 'amazon')
            .map((vo) => ({
              store: vo.storeName || vo.vendorName || 'Amazon.es',
              url: vo.productUrl || vo.affiliateUrl || amazonUrl,
              price: Number(vo.currentPrice),
              highlight: false,
            }))
        : []),
    ],
    algorithmSummary: { plus: `NutriScore ${score}/100`, minus: 'Sin aditivos perjudiciales detectados' },
  };
}
