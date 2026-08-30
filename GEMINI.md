# NutriCompare - Comparador Nutricional y Transparencia en Suplementos

NutriCompare es una aplicación web interactiva desarrollada con **React 19**, **TypeScript**, **Tailwind CSS v4** y **Vite**. Su objetivo principal es ofrecer transparencia científica e imparcial sobre suplementos deportivos y nutricionales (creatinas, proteínas, pre-entrenos, magnesio, etc.), permitiendo comparar pureza, NutriScore, sellos certificados (Creapure®, Informed-Choice, NSF, etc.), coste por dosis efectiva y análisis de laboratorio.

---

## 🌟 Características Principales

1. **Directorio y Filtros Avanzados:**
   - Búsqueda en tiempo real por nombre, marca, categoría y sellos.
   - Filtros por categoría (Creatina, Proteína, Pre-Entreno, Multivitamínicos, Magnesio), certificación de pureza, necesidades dietéticas (vegano, sin gluten, keto, sin lactosa) y umbral mínimo de NutriScore.

2. **Comparador Lado a Lado (Side-by-Side Comparison):**
   - Comparación simultánea de hasta 4 suplementos.
   - Resumen visual de NutriScore, métricas clave (pureza, metales pesados, aditivos, coste/dosis) y tabla detallada con resaltado de ventajas competitivas.

3. **Ficha Detallada de Producto (Product Detail):**
   - Desglose exhaustivo de ingredientes y dosificación.
   - Veredicto de laboratorio, certificaciones de pureza y pros/contras basados en evidencia científica.

4. **Rankings y Metodología:**
   - Listados de los suplementos mejor evaluados por categoría.
   - Página explicativa sobre el algoritmo de puntuación NutriScore y los estándares de pureza.

5. **Blog & Guías:**
   - Artículos educativos sobre suplementación basada en evidencia.

---

## 🛠️ Stack Tecnológico

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler / Dev Server:** [Vite 6](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Animaciones:** [Motion](https://motion.dev/)

---

## 🚀 Cómo Ejecutar en Localhost

### 1. Requisitos Previos
- Tener instalado **Node.js** (versión 18 o superior recomendada).
- Gestor de paquetes `npm` (incluido con Node.js).

### 2. Instalación de Dependencias
Abre una terminal en la carpeta raíz del proyecto (`NutriCompare`) y ejecuta:

```bash
npm install
```

### 3. Iniciar el Servidor de Desarrollo
Para arrancar el servidor local con recarga rápida (HMR):

```bash
npm run dev
```

Por defecto, Vite iniciará la aplicación en:
👉 **[http://localhost:3000](http://localhost:3000)** (o en el puerto disponible si el 3000 está ocupado).

---

## 📂 Estructura del Proyecto

```
NutriCompare/
├── src/
│   ├── components/       # Componentes de la UI (Header, Sidebar, DirectoryView, ComparisonView, etc.)
│   ├── data/             # Datasets de suplementos (supplements.ts) y artículos (blogArticles.ts)
│   ├── utils/            # Funciones de utilidad y formateo
│   ├── types.ts          # Definiciones de tipos TypeScript
│   ├── App.tsx           # Componente principal con gestión de vistas y estado global
│   ├── main.tsx          # Punto de entrada de React
│   └── index.css         # Configuración y estilos base de Tailwind
├── index.html            # Plantilla HTML principal
├── package.json          # Dependencias y scripts
├── tsconfig.json         # Configuración de TypeScript
└── vite.config.ts        # Configuración de Vite
```
