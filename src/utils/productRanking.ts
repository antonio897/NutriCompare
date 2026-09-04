import { SupplementProduct } from '../types';

/**
 * Normaliza los rankings de Amazon para que sean estrictamente únicos y secuenciales (1, 2, 3...)
 * por categoría, desempatando por popularidad de ventas real (ratingsTotal), valoración media y NutriScore.
 */
export function normalizeProductRanks(products: SupplementProduct[]): SupplementProduct[] {
  // Agrupar por categoría
  const byCategory = new Map<string, SupplementProduct[]>();

  for (const prod of products) {
    const cat = prod.category || 'General';
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat)!.push(prod);
  }

  const result: SupplementProduct[] = [];

  for (const [, catProducts] of byCategory.entries()) {
    // Ordenar de forma determinista para desempatar:
    // 1. Si tienen bestsellerRank o rank asignado, respetar orden numérico relativo menor
    // 2. Desempatar por número de valoraciones en Amazon (ratingsTotal)
    // 3. Desempatar por valoración (rating)
    // 4. Desempatar por nutriScore
    const sorted = [...catProducts].sort((a, b) => {
      const rankA = a.bestsellerRank ?? a.rank ?? 9999;
      const rankB = b.bestsellerRank ?? b.rank ?? 9999;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      const reviewsA = a.ratingsTotal ?? 0;
      const reviewsB = b.ratingsTotal ?? 0;
      if (reviewsA !== reviewsB) {
        return reviewsB - reviewsA;
      }

      const scoreA = a.rating ?? 0;
      const scoreB = b.rating ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return b.nutriScore - a.nutriScore;
    });

    // Reasignar puestos correlativos estrictamente únicos (1, 2, 3...)
    sorted.forEach((prod, index) => {
      const uniqueRank = index + 1;
      result.push({
        ...prod,
        bestsellerRank: uniqueRank,
        rank: uniqueRank,
        isBestseller: uniqueRank <= 3,
      });
    });
  }

  // Conservar el orden de los productos en la lista devuelta
  const resultMap = new Map(result.map(p => [p.id, p]));
  return products.map(p => resultMap.get(p.id) || p);
}
