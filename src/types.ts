export type CategoryType =
  | 'Creatina'
  | 'Proteína'
  | 'BCAA'
  | 'Magnesio'
  | 'Omega-3'
  | 'Pre-Entreno'
  | 'Multivitamínico'
  | 'Aminoácidos'
  | 'Suplementos Deportivos'
  | (string & {});

export interface SupplementProduct {
  id: string;
  name: string;
  brand: string;
  category: CategoryType;
  nutriScore: number;
  scoreGrade?: string;
  image: string;
  gallery: string[];
  price: number;
  currency: string;
  servings: number;
  servingSize: string; // e.g. "3.4g"
  costPerDose: number; // e.g. 0.32
  activeIngredientAmount: string; // e.g. "3.0g Creatina pura"
  purityPct: number; // e.g. 99.9
  format: string; // e.g. "Polvo sin sabor", "Cápsulas"
  flavour?: string; // e.g. "Chocolate", "Neutro"
  allergens: string; // e.g. "Libre de gluten, soja y lácteos"
  certifications: string[]; // e.g. ["Creapure®", "Informed Sport", "Third-Party Tested"]
  transparencyLevel: 1 | 2 | 3 | number; // 1: Blends, 2: Partial, 3: Full Disclosure
  isPurityCertified: boolean;
  dietaryTags: string[]; // ["Sin Gluten", "Vegano", "Sin Lactosa", "Cero Azúcar"]
  description: string;
  isBestseller?: boolean;
  bestsellerRank?: number;
  rating?: number;
  ratingsTotal?: number;
  sourceProvider?: string;
  specs: {
    mainIngredient: string;
    recommendedDose: string;
    activePerDose: string;
    format: string;
    allergens: string;
    certifications: string[];
    proteinPct?: number; // for proteins
    leucinePerDose?: string;
    creapureOfficial?: boolean;
    heavyMetalsTested?: boolean;
    aminogram?: {
      leucine?: number;
      isoleucine?: number;
      valine?: number;
      totalBcaa?: number;
      glutamine?: number;
    };
    rawPurityPct?: number;
    heavyMetalsStatus?: 'PASSED' | 'WARNING' | 'FAILED';
    latestLabReport?: {
      labName: string;
      measuredPurity: number;
      leadPpm?: number;
      isCompliant: boolean;
      verdictNotes?: string;
    };
    nutritionImageUrl?: string | null;
    manufacturingCountry?: string | null;
    novaGroup?: number;
    sugarsPer100g?: number;
    qualitySeals?: Array<{
      name: string;
      issuer?: string;
      badgeUrl?: string;
      websiteUrl?: string;
    }>;
    priceHistory?: Array<{
      date: string;
      price: number;
      vendor: string;
    }>;
  };
  novaGroup?: number;
  sugarsPer100g?: number;
  saltPer100g?: number;
  additivesCount?: number;
  additivesTags?: string[];
  nutritionImageUrl?: string | null;
  ingredientsImageUrl?: string | null;
  frontImageUrl?: string | null;
  frontSmallImageUrl?: string | null;
  packagingImageUrl?: string | null;
  packageQuantity?: string | null;
  sourceUrl?: string | null;
  caffeineMg?: number | null;
  saturatedFatPer100g?: number | null;
  calciumMg?: number | null;
  ironMg?: number | null;
  vitaminsList?: Record<string, number> | null;
  ecoscoreGrade?: string | null;
  manufacturingCountry?: string | null;
  ingredientsList?: string | null;
  radarScores: {
    pureza: number; // 0-10
    valor: number; // 0-10
    perfil: number; // 0-10
    seguridad: number; // 0-10
    transparencia: number; // 0-10
  };
  breakdown: {
    label: string;
    percentage: number;
    colorClass?: string;
  }[];
  pros: string[];
  contras: string[];
  purchaseLinks: {
    store: string;
    url: string;
    price: number;
    highlight?: boolean;
  }[];
  algorithmSummary?: {
    plus: string;
    minus: string;
  };
  rank?: number;
  asin?: string | null;
  magnesiumMg?: number | null;
  potassiumMg?: number | null;
  zincMg?: number | null;
}

export interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  categoryTag: string;
  readTime: string;
  date: string;
  image: string;
  featured?: boolean;
  author: string;
  keyTakeaways?: string[];
}

export interface ActiveFilters {
  category?: CategoryType | 'All';
  purityCertifiedOnly: boolean;
  bestsellersOnly?: boolean;
  dietaryNeed?: string;
  novaGroup?: number;
  minScore: number;
  searchQuery: string;
  sortBy: 'popular' | 'score' | 'priceAsc' | 'purity' | 'bestsellers';
}
