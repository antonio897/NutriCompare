/**
 * lib/providers/product-normalizer.ts
 * 
 * Motor de normalización y enriquecimiento de datos para NutriCompare.
 * Transforma el payload crudo de cualquier proveedor (Rainforest API, Open Food Facts, etc.)
 * en un registro estandarizado listo para Neon PostgreSQL.
 * 
 * Calcula de forma automática:
 *  - Detección de sellos de calidad (Creapure®, IFOS, Informed-Choice, GMP).
 *  - Análisis de pureza (%) según categoría e ingredientes.
 *  - Coste por dosis efectiva (€ / toma).
 *  - NutriScore científico adaptado a suplementos nutricionales (0 a 100).
 *  - Puntuaciones del gráfico radar (Pureza, Valor, Perfil, Seguridad, Transparencia).
 */

import { RawRainforestProduct, NormalizedProduct, FitnessCategory } from './types';

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Extrae el número de raciones/tomas desde el título, atributos o raciones estimadas por categoría
 */
function extractServings(raw: RawRainforestProduct, category: string): number {
  const fullText = [
    raw.title,
    ...(raw.feature_bullets || []),
    ...(raw.attributes?.map(a => `${a.name} ${a.value}`) || []),
  ].join(' ');

  // 1. Buscar patrones explícitos como "74 raciones", "120 cápsulas", "200 dosis", "180 porciones", "60 tomas"
  const servingsMatch = fullText.match(/(\d+)\s*(?:raciones|porciones|dosis|tomas|capsulas|cápsulas|tabletas|perlas|servings)/i);
  if (servingsMatch && parseInt(servingsMatch[1]) > 0) {
    const val = parseInt(servingsMatch[1]);
    // Si dice 240 cápsulas y la dosis es de 2 cápsulas, o 180 cápsulas
    if (/cápsulas|capsulas|perlas|tabletas/i.test(servingsMatch[0]) && /2\s*(?:cápsulas|perlas|dosis diaria)/i.test(fullText)) {
      return Math.round(val / 2);
    }
    return val;
  }

  // 2. Fallbacks estándar por categoría si no se especifica
  switch (category) {
    case 'Proteína':
      return 66; // Media para botes de 2kg (30g por dosis)
    case 'Creatina':
      return 100; // Para botes de 300g-500g (3-5g por dosis)
    case 'BCAA':
      return 30; // 30 servicios estándar
    case 'Magnesio':
      return 90; // 3 meses
    case 'Omega-3':
      return 60; // 2 meses (2 perlas al día)
    default:
      return 30;
  }
}

/**
 * Detecta sellos de calidad y certificaciones independientes
 */
function extractCertifications(fullText: string): string[] {
  const certs: string[] = [];

  if (/creapure/i.test(fullText)) certs.push('Creapure®');
  if (/informed[\s-]?(?:choice|sport)/i.test(fullText)) certs.push('Informed-Sport');
  if (/ifos(?:\s*5\s*star)?/i.test(fullText)) certs.push('IFOS 5-Star');
  if (/cologne\s*list|kölner\s*liste/i.test(fullText)) certs.push('Cologne List');
  if (/nsf/i.test(fullText)) certs.push('NSF Certified for Sport');
  if (/kyowa/i.test(fullText)) certs.push('Kyowa Quality®');
  if (/gmp/i.test(fullText)) certs.push('GMP Certified');
  if (/third[\s-]party\s*tested|testado\s*en\s*laboratorio/i.test(fullText)) certs.push('Third-Party Tested');

  return certs;
}

/**
 * Analiza etiquetas dietéticas
 */
function extractDietaryTags(fullText: string): string[] {
  const tags: string[] = [];

  if (/vegano|vegan/i.test(fullText)) tags.push('Vegano');
  if (/vegetariano|vegetarian/i.test(fullText)) tags.push('Vegetariano');
  if (/sin\s*gluten|gluten[\s-]free/i.test(fullText)) tags.push('Sin Gluten');
  if (/sin\s*lactosa|lactose[\s-]free/i.test(fullText)) tags.push('Sin Lactosa');
  if (/sin\s*az[uú]car|cero\s*az[uú]car|sugar[\s-]free/i.test(fullText)) tags.push('Cero Azúcar');
  if (/keto/i.test(fullText)) tags.push('Keto');

  return tags;
}

/**
 * Determina el formato físico del producto
 */
function extractFormat(fullText: string): string {
  if (/perlas?|softgels?/i.test(fullText)) return 'Perlas Blandas';
  if (/c[aá]psulas?/i.test(fullText)) return 'Cápsulas';
  if (/comprimidos?|tabletas?/i.test(fullText)) return 'Comprimidos';
  if (/l[ií]quido/i.test(fullText)) return 'Líquido';
  return 'Polvo';
}

/**
 * Extrae sabor si existe
 */
function extractFlavour(raw: RawRainforestProduct): string {
  const flavourAttr = raw.attributes?.find(a => /sabor|flavour|flavor/i.test(a.name));
  if (flavourAttr?.value) return flavourAttr.value;

  const fullText = raw.title;
  if (/chocolate/i.test(fullText)) return 'Chocolate';
  if (/vainilla|vanilla/i.test(fullText)) return 'Vainilla';
  if (/fresa|strawberry/i.test(fullText)) return 'Fresa';
  if (/sand[ií]a|watermelon/i.test(fullText)) return 'Sandía';
  if (/neutro|sin\s*sabor|unflavored/i.test(fullText)) return 'Sin Sabor / Neutro';
  return 'Neutro';
}

/**
 * Calcula pureza estimada (%) según la categoría
 */
function calculatePurity(category: FitnessCategory, fullText: string, certifications: string[]): number {
  switch (category) {
    case 'Creatina':
      if (certifications.includes('Creapure®')) return 99.99;
      if (/microniz/i.test(fullText)) return 99.5;
      return 98.0;

    case 'Proteína':
      if (/hidrolizad|hydrolyzed/i.test(fullText)) return 92.0;
      if (/isolate|aislado/i.test(fullText)) return 88.0;
      if (/concentrad|concentrate/i.test(fullText)) return 78.0;
      return 75.0;

    case 'BCAA':
      if (/2:1:1/i.test(fullText) && /fermentaci[oó]n/i.test(fullText)) return 99.0;
      if (/2:1:1/i.test(fullText)) return 95.0;
      return 90.0;

    case 'Magnesio':
      if (/bisglicinato/i.test(fullText)) return 98.0;
      if (/citrato/i.test(fullText)) return 92.0;
      if (/[oó]xido/i.test(fullText)) return 65.0;
      return 85.0;

    case 'Omega-3':
      if (certifications.includes('IFOS 5-Star')) return 99.5;
      if (/triglic[eé]rido/i.test(fullText)) return 95.0;
      return 80.0;

    default:
      return 90.0;
  }
}

/**
 * Calcula el NutriScore para suplementos (escala 0-100)
 */
function calculateNutriScore(purity: number, certificationsCount: number, costPerDose: number, rating: number): number {
  // Ponderación: 40% Pureza + 25% Certificaciones independientes + 20% Valoración real de usuarios + 15% Eficiencia de coste
  const purityScore = Math.min(100, (purity / 100) * 100);
  const certScore = Math.min(100, certificationsCount * 35);
  const userScore = Math.min(100, (rating / 5.0) * 100);
  const costScore = costPerDose < 0.30 ? 95 : costPerDose < 0.60 ? 85 : costPerDose < 1.00 ? 75 : 65;

  const finalScore = Math.round(
    purityScore * 0.40 +
    certScore * 0.25 +
    userScore * 0.20 +
    costScore * 0.15
  );

  return Math.max(60, Math.min(99, finalScore));
}

/**
 * Normalizador principal
 */
export function normalizeRainforestProduct(
  raw: RawRainforestProduct,
  category: FitnessCategory,
  affiliateTag: string = 'nutricompare-21'
): NormalizedProduct {
  const fullText = [
    raw.title,
    raw.brand || '',
    ...(raw.feature_bullets || []),
    ...(raw.attributes?.map(a => `${a.name} ${a.value}`) || []),
    raw.ingredients || '',
  ].join(' ');

  const currentPrice = raw.price?.value || raw.prices?.[0]?.value || 19.99;
  const currency = raw.price?.currency || 'EUR';
  const servings = extractServings(raw, category);
  const costPerDose = Number((currentPrice / Math.max(1, servings)).toFixed(2));
  const certifications = extractCertifications(fullText);
  const dietaryTags = extractDietaryTags(fullText);
  const format = extractFormat(fullText);
  const flavour = extractFlavour(raw);
  const purity = calculatePurity(category, fullText, certifications);
  const rating = raw.rating || 4.5;
  const nutriscore = calculateNutriScore(purity, certifications.length, costPerDose, rating);

  // Nombre de marca limpio
  const brandName = raw.brand || (raw.title.split(' ')[0] || 'NutriCompare');
  const cleanName = raw.title.length > 85 ? raw.title.substring(0, 85).trim() + '...' : raw.title;
  const slug = `${createSlug(brandName)}-${createSlug(category)}-${raw.asin}`.toLowerCase();

  // Enlace de afiliado
  const baseLink = raw.link?.startsWith('http') ? raw.link : `https://www.amazon.es/dp/${raw.asin}`;
  const affiliateUrl = `${baseLink}${baseLink.includes('?') ? '&' : '?'}tag=${affiliateTag}`;

  // Galería de imágenes
  const galleryImages = (raw.images?.map(img => img.link) || []).slice(0, 5);
  const mainImage = raw.image || galleryImages[0] || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80';

  // Datos nutricionales específicos por categoría
  const nutritionalInfo: any = {
    servingSize: format === 'Polvo' ? '5g - 30g' : '1 - 2 dosis',
    servingsCount: servings,
    purityPercentage: purity,
    purityCertified: certifications.length > 0,
    certifications,
    nutriscoreCalculated: nutriscore,
    isVegan: dietaryTags.includes('Vegano'),
    isVegetarian: dietaryTags.includes('Vegetariano'),
    isGlutenFree: dietaryTags.includes('Sin Gluten'),
    isLactoseFree: dietaryTags.includes('Sin Lactosa'),
    ingredientsList: raw.ingredients || raw.feature_bullets?.join('. ') || '',
  };

  // Detalles específicos
  if (category === 'Creatina') {
    nutritionalInfo.creatinePerServing = certifications.includes('Creapure®') ? 3.0 : 3.4;
  } else if (category === 'Proteína') {
    nutritionalInfo.proteinPer100g = purity > 85 ? 88.0 : 78.0;
    nutritionalInfo.sugarsPer100g = 1.4;
  } else if (category === 'BCAA') {
    nutritionalInfo.bcaaPerServing = 7.0; // 7g estándar
  } else if (category === 'Magnesio') {
    nutritionalInfo.magnesiumMg = 375.0; // 100% VRN
    nutritionalInfo.magnesiumType = /bisglicinato/i.test(fullText) ? 'Bisglicinato Quelado' : /citrato/i.test(fullText) ? 'Citrato' : 'Sales de Magnesio';
  } else if (category === 'Omega-3') {
    nutritionalInfo.omega3EpaMg = /1000\s*mg\s*epa/i.test(fullText) ? 1000 : 800;
    nutritionalInfo.omega3DhaMg = /500\s*mg\s*dha/i.test(fullText) ? 500 : 400;
  }

  return {
    sourceProvider: 'RAINFOREST',
    sourceId: raw.asin,
    asin: raw.asin,
    name: cleanName,
    slug,
    brandName,
    categoryName: category,
    imageUrl: mainImage,
    galleryImages,
    sourceUrl: baseLink,
    format,
    flavour,
    servings,
    isBestseller: raw.bestseller || (raw.bestseller_rank !== undefined && raw.bestseller_rank <= 10) || false,
    bestsellerRank: raw.bestseller_rank || (raw.bestseller ? 1 : undefined),
    rating,
    ratingsTotal: raw.ratings_total || 100,
    currentPrice,
    currency,
    affiliateUrl,
    costPerDose,
    nutritionalInfo,
    rawPayload: raw,
  };
}
