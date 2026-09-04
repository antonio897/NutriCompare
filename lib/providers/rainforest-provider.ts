/**
 * lib/providers/rainforest-provider.ts
 * 
 * Implementación del proveedor Rainforest API para Amazon España.
 * - Soporte para Bestsellers (`type=bestsellers`), Búsquedas (`type=search`) y Detalle (`type=product`).
 * - Control de presupuesto (Budget Tracker) para nunca exceder la cuota gratuita (100 peticiones).
 * - Modo Mock/Fixture automático si no se define API Key o si se solicita en CLI (`--mock`).
 * - Soporte multi-cuenta: lee `RAINFOREST_API_KEY` dinámicamente.
 */

import { ProductProvider, FitnessCategory, RawRainforestProduct, ProviderSearchOptions } from './types';
import { RAINFOREST_FIXTURES } from './fixtures/rainforest-fixtures';

export interface RainforestConfig {
  apiKey?: string;
  amazonDomain?: string;
  isMock?: boolean;
  maxRequestsBudget?: number;
}

export class RainforestProvider implements ProductProvider {
  readonly name = 'RAINFOREST' as const;
  private apiKey: string;
  private amazonDomain: string;
  private isMock: boolean;
  private requestsMade: number = 0;
  private maxRequestsBudget: number;

  constructor(config: RainforestConfig = {}) {
    this.apiKey = config.apiKey || process.env.RAINFOREST_API_KEY || '';
    this.amazonDomain = config.amazonDomain || 'amazon.es';
    this.isMock = config.isMock || !this.apiKey;
    this.maxRequestsBudget = config.maxRequestsBudget || 90; // Margen de seguridad de 90 sobre 100

    if (this.isMock) {
      console.info('⚡ [RainforestProvider] Modo Simulación/Mock activado (Consumo: 0 créditos de API).');
    } else {
      console.info(`🌿 [RainforestProvider] Conectado a Rainforest API (${this.amazonDomain}). Límite de presupuesto: ${this.maxRequestsBudget} reqs.`);
    }
  }

  /**
   * Obtiene la lista de Más Vendidos para una categoría fitness
   */
  async fetchBestsellers(category: FitnessCategory, limit: number = 20): Promise<RawRainforestProduct[]> {
    if (this.isMock) {
      const fixtures = RAINFOREST_FIXTURES[category] || [];
      return fixtures.slice(0, limit);
    }

    this.checkBudget();

    // Mapping de términos de búsqueda de superventas en Amazon.es
    const searchTerms: Record<FitnessCategory, string> = {
      'Proteína': 'proteina whey aislada isolate',
      'Creatina': 'creatina creapure monohidrato',
      'BCAA': 'bcaa aminoacidos 2:1:1',
      'Magnesio': 'bisglicinato magnesio quelado puro',
      'Omega-3': 'omega 3 ifos alta concentracion',
      'Pre-Entreno': 'pre entreno pre workout',
      'Multivitamínico': 'multivitaminico deportivo'
    };

    const term = searchTerms[category] || category;
    return this.search(term, { category, limit });
  }

  /**
   * Búsqueda en Amazon mediante Rainforest API
   */
  async search(query: string, options: ProviderSearchOptions = {}): Promise<RawRainforestProduct[]> {
    if (this.isMock) {
      const cat = options.category as string;
      const fixtures = (cat && RAINFOREST_FIXTURES[cat]) || Object.values(RAINFOREST_FIXTURES).flat();
      return fixtures.slice(0, options.limit || 20);
    }

    this.checkBudget();
    const page = options.page || 1;
    const params = new URLSearchParams({
      api_key: this.apiKey,
      type: 'search',
      amazon_domain: this.amazonDomain,
      search_term: query,
      page: page.toString(),
      language: 'es_ES',
    });

    if (options.sortBy && options.sortBy !== 'bestseller') {
      params.append('sort_by', options.sortBy);
    }

    try {
      console.info(`[Rainforest API] Ejecutando búsqueda para: "${query}" (Página ${page})... (Consumo: 1 crédito)`);
      this.requestsMade++;

      const res = await fetch(`https://api.rainforestapi.com/request?${params.toString()}`);
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Rainforest API HTTP Error ${res.status}: ${res.statusText} - ${errBody}`);
      }

      const data: any = await res.json();
      const results: any[] = data.search_results || [];

      return results.map((item: any, idx: number) => ({
        title: item.title,
        asin: item.asin,
        link: item.link,
        image: item.image,
        rating: item.rating,
        ratings_total: item.ratings_total,
        price: item.price ? {
          value: item.price.value,
          currency: item.price.currency || 'EUR',
          symbol: item.price.symbol || '€',
          raw: item.price.raw,
        } : undefined,
        brand: item.brand,
        bestseller: item.is_best_seller || idx === 0,
        bestseller_rank: item.is_best_seller ? 1 : idx + 1,
      }));
    } catch (err) {
      console.error(`[Rainforest API] Error en búsqueda "${query}":`, err);
      // Fallback a fixture si falla la red
      const cat = options.category as string;
      return (cat && RAINFOREST_FIXTURES[cat]) || [];
    }
  }

  /**
   * Obtiene la ficha de detalle profundo con ingredientes y especificaciones
   */
  async getProductDetails(asin: string): Promise<RawRainforestProduct> {
    if (this.isMock) {
      const all = Object.values(RAINFOREST_FIXTURES).flat();
      const found = all.find(p => p.asin === asin);
      if (found) return found;
      // Generar uno genérico si no está en fixture
      return all[0];
    }

    this.checkBudget();

    const params = new URLSearchParams({
      api_key: this.apiKey,
      type: 'product',
      amazon_domain: this.amazonDomain,
      asin,
      language: 'es_ES',
    });

    console.info(`[Rainforest API] Obteniendo ficha profunda para ASIN: ${asin}... (Consumo: 1 crédito)`);
    this.requestsMade++;

    const res = await fetch(`https://api.rainforestapi.com/request?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Rainforest API Error ${res.status}: ${res.statusText}`);
    }

    const data: any = await res.json();
    const product = data.product;

    return {
      title: product.title,
      asin: product.asin,
      link: product.link,
      image: product.main_image?.link,
      images: product.images?.map((img: any) => ({ link: img.link })),
      rating: product.rating,
      ratings_total: product.ratings_total,
      price: product.buybox_winner?.price ? {
        value: product.buybox_winner.price.value,
        currency: product.buybox_winner.price.currency || 'EUR',
        symbol: '€',
        raw: product.buybox_winner.price.raw,
      } : undefined,
      brand: product.brand,
      bestseller: product.bestseller || false,
      feature_bullets: product.feature_bullets,
      description: product.description,
      attributes: product.attributes,
      specifications: product.specifications,
      ingredients: product.ingredients,
      important_information: product.important_information,
    };
  }

  /**
   * Comprueba el límite de presupuesto para no pasarse de la cuota gratuita
   */
  private checkBudget(): void {
    if (this.requestsMade >= this.maxRequestsBudget) {
      throw new Error(
        `🚨 [RainforestProvider] Límite de seguridad alcanzado (${this.requestsMade}/${this.maxRequestsBudget} peticiones). Deteniendo ingesta para preservar la cuota gratuita.`
      );
    }
  }

  getRequestsCount(): number {
    return this.requestsMade;
  }

  async getQuotaRemaining(): Promise<number | null> {
    if (this.isMock) return 100;
    return Math.max(0, 100 - this.requestsMade);
  }
}
