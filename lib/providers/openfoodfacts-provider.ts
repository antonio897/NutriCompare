/**
 * lib/providers/openfoodfacts-provider.ts
 * 
 * Implementación del proveedor Open Food Facts para NutriCompare.
 * Permite reutilizar la API abierta de Open Food Facts cuando se desee
 * sin cambiar una sola línea del código de negocio o del comparador.
 */

import { ProductProvider, FitnessCategory, RawRainforestProduct, ProviderSearchOptions } from './types';

export class OpenFoodFactsProvider implements ProductProvider {
  readonly name = 'OPENFOODFACTS' as const;
  private baseUrl = 'https://world.openfoodfacts.org';

  async fetchBestsellers(category: FitnessCategory, limit: number = 20): Promise<RawRainforestProduct[]> {
    return this.search(category, { category, limit });
  }

  async search(query: string, options: ProviderSearchOptions = {}): Promise<RawRainforestProduct[]> {
    const limit = options.limit || 20;
    const url = `${this.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,image_url,ingredients_text,nutriments,nova_group,ecoscore_grade`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'NutriCompare - Fitness Supplement Comparator - contact@nutricompare.dev' },
      });

      if (!res.ok) throw new Error(`OpenFoodFacts HTTP ${res.status}`);
      const data: any = await res.json();
      const products: any[] = data.products || [];

      return products.map((item: any, idx: number) => ({
        title: item.product_name || `Suplemento ${idx + 1}`,
        asin: item.code, // Usamos el código de barras como identificador único
        link: `${this.baseUrl}/product/${item.code}`,
        image: item.image_url,
        brand: item.brands?.split(',')[0]?.trim() || 'Marca Desconocida',
        bestseller: idx === 0,
        bestseller_rank: idx + 1,
        feature_bullets: item.ingredients_text ? [item.ingredients_text] : [],
        ingredients: item.ingredients_text,
        price: {
          value: 19.99, // OpenFoodFacts no tiene precios fiables de mercado
          currency: 'EUR',
          symbol: '€',
        },
      }));
    } catch (err) {
      console.error('[OpenFoodFactsProvider] Error en búsqueda:', err);
      return [];
    }
  }

  async getProductDetails(code: string): Promise<RawRainforestProduct> {
    const url = `${this.baseUrl}/api/v2/product/${code}.json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NutriCompare - Fitness Supplement Comparator' },
    });

    if (!res.ok) throw new Error(`OpenFoodFacts HTTP ${res.status}`);
    const data: any = await res.json();
    const p = data.product;

    return {
      title: p.product_name,
      asin: p.code,
      link: `${this.baseUrl}/product/${p.code}`,
      image: p.image_url,
      brand: p.brands,
      ingredients: p.ingredients_text,
      feature_bullets: p.ingredients_text ? [p.ingredients_text] : [],
      price: {
        value: 19.99,
        currency: 'EUR',
        symbol: '€',
      },
    };
  }

  async getQuotaRemaining(): Promise<number | null> {
    return null; // OpenFoodFacts es ilimitada y gratuita
  }
}
