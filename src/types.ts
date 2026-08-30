export type CategoryType = 'Creatina' | 'Proteína' | 'Pre-Entreno' | 'Multivitamínico' | 'Magnesio' | 'Omega-3';

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
  allergens: string; // e.g. "Libre de gluten, soja y lácteos"
  certifications: string[]; // e.g. ["Creapure®", "Informed Sport", "Third-Party Tested"]
  transparencyLevel: 1 | 2 | 3; // 1: Blends, 2: Partial, 3: Full Disclosure
  isPurityCertified: boolean;
  dietaryTags: string[]; // ["Sin Gluten", "Vegano", "Sin Lactosa", "Cero Azúcar"]
  description: string;
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
  };
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
  dietaryNeed?: string;
  minScore: number;
  searchQuery: string;
  sortBy: 'popular' | 'score' | 'priceAsc' | 'purity';
}
