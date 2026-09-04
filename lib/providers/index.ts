/**
 * lib/providers/index.ts
 * 
 * Factory principal de proveedores de datos para NutriCompare.
 */

import { ProductProvider, ProviderSource } from './types';
import { RainforestProvider } from './rainforest-provider';
import { OpenFoodFactsProvider } from './openfoodfacts-provider';

export * from './types';
export * from './rainforest-provider';
export * from './openfoodfacts-provider';
export * from './product-normalizer';
export * from './fixtures/rainforest-fixtures';

export function getProductProvider(source?: ProviderSource | string): ProductProvider {
  const selected = source || process.env.DATA_PROVIDER || 'RAINFOREST';

  switch (selected.toUpperCase()) {
    case 'OPENFOODFACTS':
      return new OpenFoodFactsProvider();
    case 'RAINFOREST':
    default:
      return new RainforestProvider({
        apiKey: process.env.RAINFOREST_API_KEY,
        isMock: !process.env.RAINFOREST_API_KEY,
      });
  }
}
