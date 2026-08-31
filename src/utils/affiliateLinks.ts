/**
 * src/utils/affiliateLinks.ts
 * 
 * Generador universal de enlaces de afiliado para Amazon, HSN, Prozis y MyProtein.
 * Permite monetizar desde el día 1 con el Partner Tag de Amazon sin requerir claves PA-API.
 */

// Tag por defecto si no está definido en el entorno
const DEFAULT_AMAZON_TAG = 'nutricompare-21';

/**
 * Genera el enlace de afiliado de Amazon oficial y rastreado
 * @param productName Nombre del producto para búsqueda
 * @param ean Código de barras unívoco (EAN/UPC) si está disponible
 * @param asin ASIN directo de Amazon si se conoce
 */
export function getAmazonAffiliateUrl(productName: string, ean?: string, asin?: string): string {
  const partnerTag = (typeof process !== 'undefined' && process.env?.AMAZON_PARTNER_TAG) 
    || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_AMAZON_PARTNER_TAG) 
    || DEFAULT_AMAZON_TAG;

  if (asin) {
    return `https://www.amazon.es/dp/${asin}?tag=${partnerTag}`;
  }

  // Si tenemos EAN, la búsqueda por EAN en Amazon es 100% precisa
  if (ean && ean.trim().length >= 8) {
    return `https://www.amazon.es/s?k=${encodeURIComponent(ean.trim())}&tag=${partnerTag}`;
  }

  // Fallback: Búsqueda por nombre limpio de producto
  const cleanName = productName
    .replace(/[^\w\s\u00C0-\u017F]/gi, '')
    .trim();

  return `https://www.amazon.es/s?k=${encodeURIComponent(cleanName)}&tag=${partnerTag}`;
}

/**
 * Genera enlace de búsqueda para HSN Store
 */
export function getHsnAffiliateUrl(productName: string): string {
  const query = encodeURIComponent(productName);
  return `https://www.hsnstore.com/buscar?q=${query}`;
}

/**
 * Genera enlace de búsqueda para Prozis
 */
export function getProzisAffiliateUrl(productName: string): string {
  const query = encodeURIComponent(productName);
  return `https://www.prozis.com/es/es/search/${query}`;
}
