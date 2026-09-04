/**
 * lib/providers/fixtures/rainforest-fixtures.ts
 * 
 * Fixtures realistas estructurados idénticos a las respuestas de Rainforest API
 * para las 5 categorías prioritarias: Proteína, Creatina, BCAA, Magnesio y Omega-3.
 * Permite ejecutar sincronizaciones completas, tests unitarios y pruebas de base de datos
 * consumiendo CERO créditos de la API.
 */

import { RawRainforestProduct } from '../types';

export const RAINFOREST_FIXTURES: Record<string, RawRainforestProduct[]> = {
  'Proteína': [
    {
      title: 'Optimum Nutrition Gold Standard 100% Whey Proteína en Polvo, Doble Chocolate, 2.27 kg, 74 Raciones',
      asin: 'B000QSNYGI',
      link: 'https://www.amazon.es/dp/B000QSNYGI',
      image: 'https://m.media-amazon.com/images/I/71X8k7r5rCL._AC_SL1500_.jpg',
      rating: 4.6,
      ratings_total: 48920,
      price: {
        value: 58.99,
        currency: 'EUR',
        symbol: '€',
        raw: '58,99 €',
      },
      brand: 'Optimum Nutrition',
      bestseller: true,
      bestseller_rank: 1,
      bestseller_category: 'Proteínas de suero de leche',
      feature_bullets: [
        'Aislado de proteína de suero de leche (WPI) como ingrediente principal',
        '24 g de proteína de suero de máxima pureza por ración de 30.4 g',
        '5.5 g de BCAAs naturales y 4 g de glutamina por dosis',
        'Bajo contenido en azúcares (1.2g) y grasas (1.4g)'
      ],
      description: 'Gold Standard 100% Whey de Optimum Nutrition es la proteína de suero de leche más vendida del mundo.',
      attributes: [
        { name: 'Sabor', value: 'Doble Chocolate' },
        { name: 'Peso del producto', value: '2.27 Kilogramos' },
        { name: 'Porciones', value: '74' },
        { name: 'Forma del producto', value: 'Polvo' },
      ],
      ingredients: 'Mezcla de proteínas de suero (aislado de proteína de suero [contiene emulsionante: lecitina de soja], concentrado de proteína de suero, aislado de proteína de suero hidrolizado), cacao magro en polvo, aromas, edulcorantes (acesulfamo K, sucralosa), complejo de enzimas digestivas (amilasa, proteasa, celulasa, beta-D-galactosidasa, lipasa).',
    },
    {
      title: 'Dymatize ISO 100 Proteína Whey Hidrolizada y Aislada, Sabor Gourmet Chocolate, 2.2 kg (73 Dosis)',
      asin: 'B002K884J8',
      link: 'https://www.amazon.es/dp/B002K884J8',
      image: 'https://m.media-amazon.com/images/I/61m1aP5x9gL._AC_SL1000_.jpg',
      rating: 4.7,
      ratings_total: 16540,
      price: {
        value: 74.50,
        currency: 'EUR',
        symbol: '€',
        raw: '74,50 €',
      },
      brand: 'Dymatize',
      bestseller: true,
      bestseller_rank: 2,
      bestseller_category: 'Proteínas Isolate',
      feature_bullets: [
        'Aislado de suero de leche hidrolizado 100% microfiltrado de absorción ultrarrápida',
        '25 g de proteína pura por ración con menos de 1 g de carbohidratos y azúcar',
        '5.7 g de BCAA con 2.7 g de L-Leucina clave para activación mTOR',
        'Sin gluten y apto para vegetarianos'
      ],
      attributes: [
        { name: 'Sabor', value: 'Gourmet Chocolate' },
        { name: 'Peso', value: '2.2 Kilogramos' },
        { name: 'Forma', value: 'Polvo' },
      ],
      ingredients: 'Aislado de proteína de suero hidrolizado (leche) (49%), aislado de proteína de suero (leche) (46%), cacao desgrasado, aroma, emulgente (lecitinas), sal, edulcorantes (sucralosa, glucósidos de esteviol).',
    }
  ],

  'Creatina': [
    {
      title: 'Creapure® Creatina Monohidrato 100% Pura en Polvo 500g, Máxima Pureza Fabricada en Alemania',
      asin: 'B08FBN5J3C',
      link: 'https://www.amazon.es/dp/B08FBN5J3C',
      image: 'https://m.media-amazon.com/images/I/61wD1a3sJAL._AC_SL1500_.jpg',
      rating: 4.8,
      ratings_total: 21300,
      price: {
        value: 23.90,
        currency: 'EUR',
        symbol: '€',
        raw: '23,90 €',
      },
      brand: 'AlzChem Creapure',
      bestseller: true,
      bestseller_rank: 1,
      bestseller_category: 'Creatina',
      feature_bullets: [
        'Sello de calidad oficial Creapure® fabricado por AlzChem Trostberg GmbH en Alemania',
        'Pureza certificada del 99.99% libre de DCD y DHT',
        'Sin sabor, micronizada para una disolución instantánea en agua o batidos',
        '100% vegano, libre de alérgenos y sin gluten'
      ],
      attributes: [
        { name: 'Formato', value: 'Polvo micronizado' },
        { name: 'Peso', value: '500 gramos' },
        { name: 'Raciones', value: '147 dosis de 3.4g' },
      ],
      ingredients: '100% Monohidrato de Creatina Creapure® (grado farmacéutico AlzChem).',
    },
    {
      title: 'Optimum Nutrition Micronized Creatine Powder, 100% Creatina Monohidratada Pura, 634g (186 Porciones)',
      asin: 'B002DYIZEO',
      link: 'https://www.amazon.es/dp/B002DYIZEO',
      image: 'https://m.media-amazon.com/images/I/71R2o5R6s5L._AC_SL1500_.jpg',
      rating: 4.6,
      ratings_total: 39800,
      price: {
        value: 27.99,
        currency: 'EUR',
        symbol: '€',
        raw: '27,99 €',
      },
      brand: 'Optimum Nutrition',
      bestseller: true,
      bestseller_rank: 2,
      bestseller_category: 'Creatina Monohidrato',
      feature_bullets: [
        '3 g de monohidrato de creatina pura por servicio para aumentar el rendimiento físico',
        'Polvo sin sabor fácil de mezclar con proteína de suero o zumos',
        'Certificación Informed-Choice libre de sustancias dopantes prohibidas',
        '186 dosis completas por envase'
      ],
      attributes: [
        { name: 'Formato', value: 'Polvo' },
        { name: 'Porciones', value: '186' },
      ],
      ingredients: '100% Creatina monohidrato pura.',
    }
  ],

  'BCAA': [
    {
      title: 'Scivation Xtend Original BCAA Polvo 7g BCAAs Ratio 2:1:1 + Electrolitos, Sabor Sandía, 420g (30 Dosis)',
      asin: 'B005CH0DT4',
      link: 'https://www.amazon.es/dp/B005CH0DT4',
      image: 'https://m.media-amazon.com/images/I/71x5Uf9Q-AL._AC_SL1500_.jpg',
      rating: 4.5,
      ratings_total: 31200,
      price: {
        value: 26.49,
        currency: 'EUR',
        symbol: '€',
        raw: '26,49 €',
      },
      brand: 'Xtend',
      bestseller: true,
      bestseller_rank: 1,
      bestseller_category: 'Aminoácidos Ramificados BCAA',
      feature_bullets: [
        '7g de aminoácidos ramificados BCAAs en ratio contrastado 2:1:1 (L-Leucina, L-Isoleucina, L-Valina)',
        'Cero azúcares, cero calorías y cero carbohidratos en cada servicio',
        'Complejo de hidratación con electrolitos (sodio, potasio) y 2.5g de L-Glutamina',
        'Certificación NSF e Informed-Choice de pureza'
      ],
      attributes: [
        { name: 'Formato', value: 'Polvo soluble' },
        { name: 'Sabor', value: 'Watermelon Explosion' },
        { name: 'Porciones', value: '30' }
      ],
      ingredients: 'L-Leucina, L-Glutamina, L-Isoleucina, L-Valina, electrolitos (citrato de sodio, cloruro de potasio, cloruro de sodio), reguladores de acidez, aroma, edulcorantes (sucralosa, acesulfamo K), vitamina B6 (piridoxina clorhidrato).',
    },
    {
      title: 'Optimum Nutrition BCAA 1000 Caps, Aminoácidos Esenciales Ratio 2:1:1, 400 Cápsulas (200 Dosis)',
      asin: 'B000GG8700',
      link: 'https://www.amazon.es/dp/B000GG8700',
      image: 'https://m.media-amazon.com/images/I/71uV4d7-iUL._AC_SL1500_.jpg',
      rating: 4.5,
      ratings_total: 18400,
      price: {
        value: 29.90,
        currency: 'EUR',
        symbol: '€',
        raw: '29,90 €',
      },
      brand: 'Optimum Nutrition',
      bestseller: true,
      bestseller_rank: 2,
      bestseller_category: 'BCAAs en Cápsulas',
      feature_bullets: [
        '1000 mg de BCAAs puros por cada servicio de 2 cápsulas',
        'Ratio óptimo 2:1:1 de Leucina, Isoleucina y Valina',
        'Cápsulas de fácil deglución para tomar antes o después del entrenamiento',
        'Excelente protección contra el catabolismo muscular'
      ],
      attributes: [
        { name: 'Forma', value: 'Cápsulas' },
        { name: 'Porciones', value: '200' },
      ],
      ingredients: 'Mezcla de aminoácidos ramificados (L-leucina, L-isoleucina, L-valina, emulsionante: lecitina de soja), cápsula de gelatina, antiaglomerantes (sales magnésicas de ácidos grasos, dióxido de silicio).',
    }
  ],

  'Magnesio': [
    {
      title: 'Bisglicinato de Magnesio Puro Quelado Alta Biodisponibilidad con Vitamina B6, 180 Cápsulas Veganas (90 Dosis)',
      asin: 'B08NF4P9X7',
      link: 'https://www.amazon.es/dp/B08NF4P9X7',
      image: 'https://m.media-amazon.com/images/I/71r6E5tDkOL._AC_SL1500_.jpg',
      rating: 4.7,
      ratings_total: 14200,
      price: {
        value: 19.99,
        currency: 'EUR',
        symbol: '€',
        raw: '19,99 €',
      },
      brand: 'Nutravita',
      bestseller: true,
      bestseller_rank: 1,
      bestseller_category: 'Suplementos de Magnesio',
      feature_bullets: [
        'Magnesio 100% quelado en forma de Bisglicinato, máxima absorción sin molestias estomacales ni efecto laxante',
        'Aporta 375 mg de magnesio elemental puro (100% VRN) por dosis diaria recomendada',
        'Reforzado con Vitamina B6 activa para el correcto funcionamiento neuromuscular y reducción de la fatiga',
        '100% Vegano, sin gluten, sin lactosa y libre de estearato de magnesio sintético'
      ],
      attributes: [
        { name: 'Tipo de Magnesio', value: 'Bisglicinato Quelado' },
        { name: 'Formato', value: 'Cápsulas vegetales' },
        { name: 'Porciones', value: '90' },
      ],
      ingredients: 'Bisglicinato de magnesio, cápsula vegetal (hidroxipropilmetilcelulosa), clorhidrato de piridoxina (vitamina B6).',
    },
    {
      title: 'Citrato de Magnesio Puro 400mg con Máxima Absorción, 240 Comprimidos para Músculos y Articulaciones',
      asin: 'B07MVD3G5C',
      link: 'https://www.amazon.es/dp/B07MVD3G5C',
      image: 'https://m.media-amazon.com/images/I/71P4r1uR3qL._AC_SL1500_.jpg',
      rating: 4.6,
      ratings_total: 9850,
      price: {
        value: 18.45,
        currency: 'EUR',
        symbol: '€',
        raw: '18,45 €',
      },
      brand: 'WeightWorld',
      bestseller: true,
      bestseller_rank: 2,
      bestseller_category: 'Magnesio Citrato',
      feature_bullets: [
        '400 mg de magnesio elemental procedente de sales de citrato magnésico de absorción rápida',
        'Ayuda a la síntesis proteica, contracción muscular y relajación del sistema nervioso',
        'Suministro para 4 meses continuos (240 tabletas)',
        'Certificación GMP y análisis microbiológico de metales pesados'
      ],
      attributes: [
        { name: 'Forma', value: 'Comprimidos' },
        { name: 'Porciones', value: '120' },
      ],
      ingredients: 'Citrato de magnesio, agentes de carga (celulosa microcristalina), antiaglomerantes (ácidos grasos).',
    }
  ],

  'Omega-3': [
    {
      title: 'Omega 3 Alta Concentración IFOS 5 Estrellas, 2000mg Aceite de Pescado Puro con 800mg EPA y 400mg DHA, 120 Perlas',
      asin: 'B07K52X23Z',
      link: 'https://www.amazon.es/dp/B07K52X23Z',
      image: 'https://m.media-amazon.com/images/I/71fB8G3D5tL._AC_SL1500_.jpg',
      rating: 4.8,
      ratings_total: 27600,
      price: {
        value: 22.95,
        currency: 'EUR',
        symbol: '€',
        raw: '22,95 €',
      },
      brand: 'Nutralie',
      bestseller: true,
      bestseller_rank: 1,
      bestseller_category: 'Suplementos de Omega 3',
      feature_bullets: [
        'Certificación de pureza IFOS 5 Estrellas (International Fish Oil Standards): Cero metales pesados, PCBs y dioxinas',
        'Dosis óptima en forma de triglicéridos naturales: 800 mg de EPA y 400 mg de DHA por 2 perlas',
        'Enriquecido con Vitamina E antioxidante natural para evitar la oxidación del aceite',
        'Sin regusto ni reflujo a pescado gracias a la purificación molecular'
      ],
      attributes: [
        { name: 'Certificación', value: 'IFOS 5 Star Tested' },
        { name: 'EPA por dosis', value: '800 mg' },
        { name: 'DHA por dosis', value: '400 mg' },
        { name: 'Porciones', value: '60' },
      ],
      ingredients: 'Aceite de pescado salvaje concentrado (triglicéridos con 40% EPA y 20% DHA), gelatina bovina, humectante (glicerina), D-alfa tocoferol (vitamina E).',
    },
    {
      title: 'WeightWorld Omega 3 Puro 2000mg 1000mg EPA 500mg DHA Perlas de Aceite de Pescado Triglicéridos 240 Cápsulas',
      asin: 'B08CY4VNWL',
      link: 'https://www.amazon.es/dp/B08CY4VNWL',
      image: 'https://m.media-amazon.com/images/I/71H2O9yVzYL._AC_SL1500_.jpg',
      rating: 4.6,
      ratings_total: 13900,
      price: {
        value: 24.99,
        currency: 'EUR',
        symbol: '€',
        raw: '24,99 €',
      },
      brand: 'WeightWorld',
      bestseller: true,
      bestseller_rank: 2,
      bestseller_category: 'Omega-3',
      feature_bullets: [
        'Mega potencia: 1000 mg EPA y 500 mg DHA por ración diaria de 2 cápsulas',
        'Pesca sostenible certificada Friend of the Sea',
        'Forma de triglicéridos naturales para una biodisponibilidad hasta un 70% superior al etil-éster',
        'Envase ahorro con 240 cápsulas blandas (4 meses de tratamiento)'
      ],
      attributes: [
        { name: 'Porciones', value: '120' },
        { name: 'Forma', value: 'Perlas blandas (Softgels)' }
      ],
      ingredients: 'Aceite de pescado de aguas frías concentrado, envoltura de la perla (gelatina, glicerina, agua purificada), antioxidante (vitamina E).',
    }
  ]
};
