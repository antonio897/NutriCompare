/**
 * lib/comparison-service.ts
 * 
 * Servicio de consulta optimizado para el Comparador Frontend (Side-by-Side Comparison).
 * - Recupera hasta 4 productos simultáneamente en 1 sola consulta Prisma.
 * - Extrae el desglose nutricional completo + aminograma detallado (Leucina, BCAAs).
 * - Cruza sellos oficiales de certificación (Creapure®, Informed-Sport, etc.).
 * - Cruza análisis de laboratorio independientes (pureza HPLC, metales pesados).
 * - Extrae el PRECIO MÁS BAJO disponible y calcula métricas de valor por dosis.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ComparedProductSummary {
  id: string;
  ean: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  brand: {
    name: string;
    logoUrl: string | null;
  } | null;
  category: {
    name: string;
  } | null;
  nutrition: {
    servingSize: string | null;
    proteinPer100g: number | null;
    creatinePerServing: number | null;
    carbsPer100g: number | null;
    fatPer100g: number | null;
    caloriesPer100g: number | null;
    ingredientsList: string | null;
    nutriscore: number;
    purityCertified: boolean;
    // Fase 3: Aminograma y Pureza
    leucinePer100g: number | null;
    totalBcaaPer100g: number | null;
    rawPurityPercentage: number | null;
    heavyMetalsStatus: string | null;
  };
  certifications: Array<{
    name: string;
    issuer: string | null;
    badgeUrl: string | null;
  }>;
  latestLabReport: {
    labName: string;
    measuredPurity: number;
    leadPpm: number | null;
    isCompliant: boolean;
    verdictNotes: string | null;
  } | null;
  bestOffer: {
    vendorName: string;
    price: number;
    currency: string;
    affiliateUrl: string;
    inStock: boolean;
    lastUpdated: Date;
  } | null;
  allOffers: Array<{
    vendorName: string;
    price: number;
    currency: string;
    affiliateUrl: string;
    inStock: boolean;
  }>;
  metrics: {
    costPerServing: number | null;
    costPer100gProtein: number | null;
  };
}

/**
 * Consulta de alta eficiencia para comparar hasta 4 productos enriquecidos
 * @param productIds Array de IDs o slugs de los productos a comparar (máximo 4)
 */
export async function getComparisonData(productIds: string[]): Promise<ComparedProductSummary[]> {
  const targetIds = productIds.slice(0, 4);

  if (targetIds.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { id: { in: targetIds } },
        { slug: { in: targetIds } },
      ],
      isActive: true,
    },
    include: {
      brand: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      nutritionalInfo: true,
      certifications: {
        include: {
          certification: {
            select: {
              name: true,
              issuer: true,
              badgeUrl: true,
            },
          },
        },
      },
      labReports: {
        orderBy: {
          analysisDate: 'desc',
        },
        take: 1, // Obtener el informe de laboratorio más reciente
      },
      vendorOffers: {
        where: {
          inStock: true,
        },
        orderBy: {
          currentPrice: 'asc', // Ordenar de menor a mayor precio
        },
        select: {
          vendorName: true,
          currentPrice: true,
          currency: true,
          affiliateUrl: true,
          inStock: true,
          lastUpdated: true,
        },
      },
    },
  });

  return products.map((prod) => {
    const best = prod.vendorOffers[0] || null;
    const lowestPrice = best ? best.currentPrice : null;
    const lab = prod.labReports[0] || null;

    let costPerServing: number | null = null;
    let costPer100gProtein: number | null = null;

    const protein = prod.nutritionalInfo?.proteinPer100g ?? 0;

    if (lowestPrice && lowestPrice > 0) {
      const estimatedServings = 33;
      costPerServing = Number((lowestPrice / estimatedServings).toFixed(2));

      if (protein > 0) {
        costPer100gProtein = Number(((lowestPrice / (protein * 10)) * 100).toFixed(2));
      }
    }

    return {
      id: prod.id,
      ean: prod.ean,
      name: prod.name,
      slug: prod.slug,
      imageUrl: prod.imageUrl,
      brand: prod.brand,
      category: prod.category,
      nutrition: {
        servingSize: prod.nutritionalInfo?.servingSize || null,
        proteinPer100g: prod.nutritionalInfo?.proteinPer100g || null,
        creatinePerServing: prod.nutritionalInfo?.creatinePerServing || null,
        carbsPer100g: prod.nutritionalInfo?.carbsPer100g || null,
        fatPer100g: prod.nutritionalInfo?.fatPer100g || null,
        caloriesPer100g: prod.nutritionalInfo?.caloriesPer100g || null,
        ingredientsList: prod.nutritionalInfo?.ingredientsList || null,
        nutriscore: prod.nutritionalInfo?.nutriscoreCalculated || 50,
        purityCertified: prod.nutritionalInfo?.purityCertified || false,
        leucinePer100g: prod.nutritionalInfo?.leucinePer100g || null,
        totalBcaaPer100g: prod.nutritionalInfo?.totalBcaaPer100g || null,
        rawPurityPercentage: prod.nutritionalInfo?.rawPurityPercentage || null,
        heavyMetalsStatus: prod.nutritionalInfo?.heavyMetalsStatus || 'PASSED',
      },
      certifications: prod.certifications.map((c) => ({
        name: c.certification.name,
        issuer: c.certification.issuer,
        badgeUrl: c.certification.badgeUrl,
      })),
      latestLabReport: lab
        ? {
            labName: lab.labName,
            measuredPurity: lab.measuredPurity,
            leadPpm: lab.leadPpm,
            isCompliant: lab.isCompliant,
            verdictNotes: lab.verdictNotes,
          }
        : null,
      bestOffer: best
        ? {
            vendorName: best.vendorName,
            price: best.currentPrice,
            currency: best.currency,
            affiliateUrl: best.affiliateUrl,
            inStock: best.inStock,
            lastUpdated: best.lastUpdated,
          }
        : null,
      allOffers: prod.vendorOffers.map((o) => ({
        vendorName: o.vendorName,
        price: o.currentPrice,
        currency: o.currency,
        affiliateUrl: o.affiliateUrl,
        inStock: o.inStock,
      })),
      metrics: {
        costPerServing,
        costPer100gProtein,
      },
    };
  });
}
