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

### 🔹 Fase 3: Enriquecimiento Nutricional & Sellos de Pureza (Siguiente Fase ⏳)
- [ ] Ampliar el esquema Prisma para soportar tabla de sellos y patentes oficiales (`Creapure®`, `Informed-Sport`, `Kyowa Quality®`, `Cologne List`, `DigeZyme®`).
- [ ] Relacionar los productos ingestados con sus análisis de metales pesados y certificaciones de laboratorio.
- [ ] Refinar el algoritmo de cálculo automático de `nutriscore_calculated` basado en el aminograma completo (leucina, isoleucina, valina).

### 🔹 Fase 4: Optimización y Conexión Frontend (Next.js & Edge Cache ⏳)
- [ ] Conectar la función `getComparisonData()` de `lib/comparison-service.ts` con la interfaz del Comparador (`ComparisonView.tsx`).
- [ ] Implementar Server Actions / React Server Components con `unstable_cache` o `revalidateTag` para cachear comparativas frecuentes con coste 0.
- [ ] Pintar gráficas interactivas de evolución histórica de precios en la ficha de producto (`ProductDetailView.tsx`) usando los registros de `PriceHistory`.
