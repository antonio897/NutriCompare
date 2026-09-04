/**
 * lib/providers/types.ts
 * 
 * Contratos de interfaz y tipos para la arquitectura agnóstica de proveedores
 * (Provider Pattern) en NutriCompare. Permite alternar fácilmente entre
 * Rainforest API, Open Food Facts, ScraperAPI u otros proveedores sin alterar
 * la lógica de negocio ni la base de datos.
 */

export type ProviderSource = 'RAINFOREST' | 'OPENFOODFACTS' | 'SCRAPERAPI' | 'MANUAL';

export type FitnessCategory =
  | 'Proteína'
  | 'Creatina'
  | 'BCAA'
  | 'Magnesio'
  | 'Omega-3'
  | 'Pre-Entreno'
  | 'Multivitamínico';

export interface ProviderSearchOptions {
  category?: FitnessCategory | string;
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string; // e.g. "bestseller"
  amazonDomain?: string; // e.g. "amazon.es"
}

export interface RawRainforestPrice {
  value: number;
  currency: string;
  symbol?: string;
  raw?: string;
}

export interface RawRainforestProduct {
  title: string;
  asin: string;
  link: string;
  image?: string;
  images?: Array<{ link: string }>;
  rating?: number;
  ratings_total?: number;
  price?: RawRainforestPrice;
  prices?: Array<{
    value: number;
    currency: string;
    is_prime?: boolean;
  }>;
  brand?: string;
  bestseller?: boolean;
  bestseller_rank?: number;
  bestseller_category?: string;
  feature_bullets?: string[];
  description?: string;
  attributes?: Array<{
    name: string;
    value: string;
  }>;
  specifications?: Array<{
    name: string;
    value: string;
  }>;
  ingredients?: string;
  important_information?: {
    sections?: Array<{
      title: string;
      body: string;
    }>;
  };
}

export interface NormalizedNutritionalInfo {
  servingSize?: string;
  servingsCount?: number;
  proteinPer100g?: number;
  creatinePerServing?: number;
  bcaaPerServing?: number;
  omega3EpaMg?: number;
  omega3DhaMg?: number;
  magnesiumMg?: number;
  magnesiumType?: string;
  caffeineMg?: number;
  caloriesPer100g?: number;
  carbsPer100g?: number;
  sugarsPer100g?: number;
  fatPer100g?: number;
  saturatedFatPer100g?: number;
  saltPer100g?: number;
  fiberPer100g?: number;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  allergensList?: string[];
  ingredientsList?: string;
  purityPercentage?: number;
  purityCertified?: boolean;
  certifications?: string[]; // e.g. ["Creapure®", "Informed Sport", "IFOS"]
  nutriscoreCalculated?: number;
}

export interface NormalizedProduct {
  sourceProvider: ProviderSource;
  sourceId: string; // ASIN o EAN
  asin?: string;
  ean?: string;
  name: string;
  slug: string;
  brandName: string;
  categoryName: FitnessCategory | string;
  imageUrl: string;
  galleryImages: string[];
  sourceUrl: string;
  packageQuantity?: string;
  format?: string; // "Polvo", "Cápsulas", "Perlas"
  flavour?: string; // "Neutro", "Chocolate", etc.
  servings?: number;
  isBestseller: boolean;
  bestsellerRank?: number;
  rating?: number;
  ratingsTotal?: number;
  currentPrice: number;
  currency: string;
  affiliateUrl: string;
  costPerDose: number;
  nutritionalInfo: NormalizedNutritionalInfo;
  rawPayload?: any;
}

export interface ProductProvider {
  readonly name: ProviderSource;
  fetchBestsellers(category: FitnessCategory, limit?: number): Promise<RawRainforestProduct[]>;
  search(query: string, options?: ProviderSearchOptions): Promise<RawRainforestProduct[]>;
  getProductDetails(identifier: string): Promise<RawRainforestProduct>;
  getQuotaRemaining(): Promise<number | null>;
}
