# 🧭 NutriCompare: Arquitectura Backend, Guía de Ingesta y Hoja de Ruta (Coste 0€)

Este documento detalla el análisis de cuotas gratuitas, la guía paso a paso para la **ingesta inicial estática** y la lista de tareas pendientes para las siguientes fases de desarrollo.

---

## 📊 1. Análisis de Límites Gratuitos (Free Tiers a 0,00 €)

| Servicio / Plataforma | Capacidad Gratuita | Consumo Estimado NutriCompare | Margen de Seguridad |
| :--- | :--- | :--- | :--- |
| **Neon PostgreSQL** | **512 MB de almacenamiento**<br>Compute escalable a 0 (Serverless) | ~25 MB para 15.000 suplementos fitness filtrados + índices | **95% de espacio libre** |
| **Supabase (Alternativa)** | **500 MB de base de datos**<br>2 proyectos activos | ~25 MB para catálogo fitness | **95% de espacio libre** |
| **Open Food Facts** | **100% Gratuito y Abierto**<br>Descarga directa de volcados `.jsonl.gz` | Streaming local mediante `seed-openfoodfacts.ts` (<80MB RAM) | **Ilimitado** |
| **GitHub Actions (Cron Jobs)** | **2.000 minutos/mes gratis** en repositorios privados (ilimitado en públicos) | 1 sync diario de 2 minutos = ~60 min/mes | **97% de minutos libres** |
| **Amazon PA-API 5.0** | **Gratuita con cuenta de Afiliados**<br>1 req/segundo (8.640 req/día iniciales) | Consultas en lotes de 10 ASINs (~100 lotes = 2 minutos) | **Dentro de cuotas** |
| **Vercel Hosting** | **100 GB ancho de banda/mes**<br>Funciones Serverless gratuitas | API Routes y Next.js frontend | **Suficiente para >50k visitas/mes** |

> [!TIP]
> **¿Por qué PostgreSQL (Neon/Supabase) en vez de Firebase Firestore para el comparador?**
> - **Almacenamiento:** Los 15.000 productos filtrados ocupan solo **~25 MB** (el límite gratuito es de 512 MB, por lo que sobra el 95%).
> - **Coste de consultas:** En Firestore, cada comparativa o filtro consume lecturas contra la cuota diaria de 50.000 reads. En PostgreSQL, las consultas complejas y la ordenación de la mejor oferta (`MIN(current_price)`) se resuelven en el motor SQL en milisegundos con coste de lecturas cero.

---

## 🚀 2. Guía de Ejecución: Ingesta Inicial Estática (Paso a Paso)

Para poblar la base de datos por primera vez sin costes:

### Paso 1: Configurar variables de entorno (`.env`)
```env
DATABASE_URL="postgresql://usuario:password@ep-ejemplo.eu-central-1.aws.neon.tech/nutricompare?sslmode=require"
CRON_SECRET="tu_clave_secreta_super_segura_para_el_cron"

# Opcional para fase de precios:
AMAZON_ACCESS_KEY="tu_amazon_key"
AMAZON_SECRET_KEY="tu_amazon_secret"
AMAZON_PARTNER_TAG="nutricompare-21"
```

### Paso 2: Generar el cliente de Prisma y aplicar migraciones
```bash
# 1. Instalar dependencias necesarias si aún no las tienes
npm install @prisma/client fast-xml-parser
npm install -D prisma tsx @types/node

# 2. Crear las tablas en la base de datos PostgreSQL
npx prisma db push
```

### Paso 3: Descargar el volcado de Open Food Facts
Crea una carpeta `data/` y descarga el volcado comprimido:
```bash
mkdir data
curl -o data/openfoodfacts-products.jsonl.gz https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz
```

### Paso 4: Ejecutar el script de streaming e ingesta
```bash
npx tsx scripts/seed-openfoodfacts.ts data/openfoodfacts-products.jsonl.gz
```
*El script procesará el archivo en streaming por bloques de 50 items, filtrando únicamente proteínas, creatinas, pre-entrenos y minerales.*

---

## 📋 3. Estado de Fases y Tareas (Roadmap)

### 🔹 Fase 1: Ingesta Nutricional Inicial (Completada ✅)
- [x] Esquema relacional Prisma con índices optimizados (`schema.prisma`).
- [x] Script de streaming para Open Food Facts con filtrado fitness (`scripts/seed-openfoodfacts.ts`).
- [x] Tipado TypeScript y relaciones 1:1 y 1:N.

### 🔹 Fase 2: Automatización de Precios & Notificaciones (Completada ✅)
- [x] **Flujo de GitHub Actions programado** (`.github/workflows/price-sync-cron.yml`): Ejecución diaria a las 04:00 AM UTC (100% gratis dentro de los 2.000 min/mes).
- [x] **Integración con Amazon PA-API 5.0** (`lib/amazon-api.ts`): Firma AWS SigV4, lotes de 10 ASINs y rate-limiting de 1.1s para cuota gratuita.
- [x] **Route Handler para sincronización de feeds** (`app/api/cron/sync-affiliates/route.ts`): Protegido con `CRON_SECRET` y parser XML/CSV.
- [x] **Sistema de Alertas Gratuitas** (`lib/alert-webhook.ts`): Notificaciones automáticas a Discord Webhooks o Telegram Bot API con el reporte de ofertas sincronizadas y alertas de fallos.
- [x] **Script CLI de Sincronización Manual** (`scripts/sync-prices-cli.ts`): Para sincronizar precios bajo demanda desde la terminal (`npx tsx scripts/sync-prices-cli.ts --all`).
- [x] **Plantilla de Entorno** (`.env.example`) con todas las variables documentadas.

---

### 🔹 Fase 3: Enriquecimiento Nutricional & Sellos de Pureza (Completada ✅)
- [x] **Esquema Prisma Ampliado** (`prisma/schema.prisma`): Nuevas entidades `CertificationSeal`, `ProductCertification` (N:M) y `LabReport` con control de pureza HPLC y metales pesados (Pb, Cd, As, Hg).
- [x] **Motor Clínico de NutriScore** (`lib/nutriscore-engine.ts`): Algoritmo de 0 a 100 con desglose por densidad activa (40 pts), aminograma mTOR (25 pts), patentes registradas (20 pts) y seguridad analítica (15 pts).
- [x] **Script de Población de Sellos & Análisis** (`scripts/seed-quality-seals-and-labs.ts`): Carga patentes oficiales (`Creapure®`, `Informed-Sport`, `Kyowa Quality®`, `Cologne List`, `DigeZyme®`), genera informes de cromatografía y recalcula scores.
- [x] **Consulta de Comparación Enriquecida** (`lib/comparison-service.ts`): Cruce simultáneo de ofertas mínimas, sellos certificados, aminograma y últimos informes de laboratorio en 1 sola consulta SQL.

---

### 🔹 Fase 4: Optimización y Conexión Frontend (Completada ✅)
- [x] **Gráfico de Evolución de Precios Interactivo** (`src/components/PriceHistoryChart.tsx`): Gráfico SVG responsivo con selección temporal (30d, 90d, histórico), cálculo de mínimos históricos y tooltips flotantes por proveedor.
- [x] **Ficha de Producto Enriquecida** (`src/components/ProductDetailView.tsx`): Integración del gráfico de precios, desglose de aminograma mTOR (Leucina, BCAAs), sellos de patentes y certificado de laboratorio con metales pesados.
- [x] **Comparador Lado a Lado Actualizado** (`src/components/ComparisonView.tsx`): Nuevas filas comparativas para aminograma, límites de contaminantes y mejor precio en tiempo real.
- [x] **Endpoint Serverless con Edge Cache** (`api/products/compare.ts`): Consulta de comparativa de hasta 4 productos con cabecera `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` para reducir consultas a base de datos a 0€.
- [x] **Tipos TypeScript Estrictos** (`src/types.ts`): Soporte completo para aminogramas, patentes, informes de laboratorio e histórico de precios.

---

## 🔮 4. Backlog y Próximas Fases (Priorizadas por Impacto y Almacenamiento)

### ❓ ¿Soporta imágenes Neon y cómo afecta al almacenamiento?
> [!IMPORTANT]
> **Estrategia de Imágenes a Coste 0€:**
> En PostgreSQL **NUNCA se guardan los archivos binarios de las imágenes** (hacerlo saturaría los 512 MB de Neon en segundos).
> En su lugar, **solo guardamos las URLs de texto** (ej: `https://images.openfoodfacts.org/.../front.jpg`), que están alojadas gratuitamente en los servidores CDN de Open Food Facts.
> Guardar la URL ocupa apenas **~80 bytes de texto** por producto, por lo que almacenar 15.000 URLs consume menos de **1.2 MB** en Neon (despreciable para el límite gratuito de 512 MB).

---

### 🔹 Fase 5: Enriquecimiento Avanzado de Datos Open Food Facts (Completada ✅)

| Prioridad | Tarea / Característica | Estado | Archivos Relacionados |
| :---: | :--- | :---: | :--- |
| 🔴 **ALTA** | **Filtros de Alérgenos & Dietas** (`isVegan`, `isGlutenFree`, `isLactoseFree`, `allergensList`) | ✅ Hecho | `prisma/schema.prisma`, `Sidebar.tsx`, `api/products/list.ts` |
| 🔴 **ALTA** | **Desglose de Azúcares Añadidos y Sal** (`sugarsPer100g`, `saltPer100g`) | ✅ Hecho | `ProductDetailView.tsx`, `seed-openfoodfacts.ts` |
| 🟡 **MEDIA** | **Minerales & Electrolitos Activos** (`magnesiumMg`, `potassiumMg`, `zincMg`) | ✅ Hecho | `prisma/schema.prisma`, `seed-openfoodfacts.ts` |
| 🟡 **MEDIA** | **Detección de Edulcorantes y Aditivos** (`additivesCount`, `additivesTags`) | ✅ Hecho | `ProductDetailView.tsx`, `seed-openfoodfacts.ts` |
| 🟡 **MEDIA** | **Grado de Procesamiento NOVA** (`novaGroup` 1-4) | ✅ Hecho | `Sidebar.tsx`, `DirectoryView.tsx`, `ProductDetailView.tsx` |
| 🟢 **BAJA** | **Visualizador de Foto Real de Etiqueta** (`nutritionImageUrl`, `ingredientsImageUrl`) | ✅ Hecho | `ProductDetailView.tsx` (Modal interactivo con zoom) |
| 🟢 **BAJA** | **País de Fabricación / Origen** (`manufacturingCountry`) | ✅ Hecho | `ProductDetailView.tsx`, `api/products/list.ts` |

---

### 🔹 Fase 6: Pipeline de Sincronización Incremental (Completada ✅)

> [!TIP]
> **Estrategia para no volver a descargar los 11 GB masivos:**
> Los volcados completos solo se descargan una vez cada 3 o 6 meses. Para las actualizaciones del día a día, se utiliza la **API Delta de Open Food Facts**, que solo descarga los cambios de las últimas 24 horas (~1 MB).

- [x] **Script de Actualización Incremental Ligera** (`scripts/sync-openfoodfacts-delta.ts`):
  - Consulta el endpoint delta: `https://world.openfoodfacts.org/cgi/search.pl?action=process&last_modified_time_from={TIMESTAMP}&json=true`.
  - Filtra solo las categorías fitness añadidas o modificadas en las últimas horas/días.
  - Aplica `upsert` en PostgreSQL actualizando únicamente los campos cambiados sin duplicar registros.
- [x] **Mantenimiento de Catálogo Activo / Inactivo:**
  - Preserva el histórico de precios y el SEO de la web gestionando el estado en PostgreSQL.
- [x] **Configuración de Flags `--days` y Automatización:**
  - Listo para ejecución manual (`npx tsx scripts/sync-openfoodfacts-delta.ts --days 7`) o integración en GitHub Actions mensual a coste 0€.

---

### 🔹 Fase 7: Centralización del Motor de Scoring (Completada ✅)

> [!NOTE]
> **Objetivo:** Unificar en una única función/módulo (`lib/nutriscore-engine.ts`) todas las reglas de negocio de suma y resta de puntos (pureza de proteína, penalizaciones por exceso de azúcar, grado NOVA, aditivos y sellos de patentes) para que todos los scripts de ingesta (`seed-openfoodfacts-v2.ts`, `sync-openfoodfacts-delta.ts`, etc.) y la API compartan la misma lógica sin duplicar código.

- [x] **Unificación del Motor de NutriScore en `lib/nutriscore-engine.ts`:**
  - Exportar una función unificada `calculateClinicalScore(params: ClinicalScoreInput)` con todas las reglas clínicas ponderadas adaptativas por categoría (Creatina, Proteína, Pre-Entreno, Magnesio, Omega-3, Aminoácidos, Multivitamínicos).
  - Reemplazadas todas las funciones locales `calculateNutriScore` duplicadas en `seed-openfoodfacts-v2.ts`, `seed-openfoodfacts.ts` y `sync-openfoodfacts-delta.ts` para que importen directamente el motor central.
  - Implementada la visualización completa en la web (`ProductDetailView.tsx`): panel de micronutrientes/vitaminas (`vitaminsList`), medidor de cafeína y rendimiento, insignia de EcoScore y formato de envase.
  - Suite de tests unitarios en `scripts/test-nutriscore-engine.ts` para validar consistencia entre categorías.




