import { BlogArticle } from '../types';

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'la-crisis-de-las-mezclas-patentadas',
    title: 'La crisis de las mezclas patentadas en pre-entrenos',
    excerpt: 'Analizamos por qué la industria sigue ocultando dosis clínicas detrás de etiquetas genéricas y cómo leer entre líneas para elegir formulaciones efectivas.',
    content: `Las llamadas "Proprietary Blends" o mezclas patentadas han sido durante décadas el recurso predilecto de fabricantes para enmascarar ingredientes subdosificados detrás de nombres llamativos como "Matrix de Fuerza Extrema" o "Complejo de Bombeo Nitrox".

### El problema de la falta de transparencia
Cuando una marca agrupa 5 ingredientes en una matriz de 4.000 mg sin desglosar cantidades individuales:
1. El 90% del peso suele ser el ingrediente más barato (por ejemplo, maltodextrina o cafeína anhidra de bajo coste).
2. Los compuestos ergogénicos de alto coste como la L-Citrulina, el Malato de Citrulina o el Nitrato de Betaína se incluyen en dosis testimoniales ("fairy dusting"), insuficientes para disparar los niveles de óxido nítrico en sangre.

### Cómo auditar una etiqueta en 3 pasos
1. **Comprobar la lista desglosada**: Cada ingrediente debe especificar su gramaje o miligramaje exacto.
2. **Revisar dosis efectivas mínimas**: Para citrulina pura se requieren mínimo 6.000 mg (u 8.000 mg de citrulina malato 2:1); para beta-alanina, entre 3.200 y 4.000 mg.
3. **Identificar patentes certificadas**: Sellos como CarnoSyn®, Creapure® o Nitrosigine® garantizan la pureza y biodisponibilidad del compuesto original.`,
    categoryTag: 'Investigación Profunda',
    readTime: '12 MIN LECTURA',
    date: '15 OCT 2024',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoQYlm9cswlWPbFRI3b5WfjLNdzWyyhgeK3BA8WN--YkJSkEPWXFAhR6dQEX8kb4UDUgUjF7Ak9PfOnv6W9_E4km7d2JKMurXYSo1iC7x1dVvW2HdQCxY44BKiI6gIoS3X2KIlqGlrOvm8H0LxaI8SyMIv4taYug6ri98X2UF_hJZq8kMRSapzCpjVrryNhp8wcxrSVilu0_gMdDOjUMHxfWJZTudikmitJHTt88VecjaZsLc_UJ6y',
    featured: true,
    author: 'Dr. Alejandro Varela (PhD Bioquímica Nutricional)',
    keyTakeaways: [
      'Las mezclas propietarias ocultan dosis ineficaces de ingredientes caros.',
      'La L-Citrulina requiere un mínimo de 6g a 8g para producir vasodilatación real.',
      'NutriCompare penaliza automáticamente con hasta 4 puntos a cualquier fórmula con mezclas sin desglosar.',
    ],
  },
  {
    id: 'creatina-monohidrato-vs-hcl',
    title: 'Creatina Monohidrato vs. HCL: Lo que dice la ciencia actual',
    excerpt: 'Desmitificamos las afirmaciones de marketing sobre la absorción de diferentes formas de creatina basándonos en meta-análisis recientes.',
    content: `Durante años, las campañas publicitarias han promocionado la Creatina HCL (clorhidrato), el éster etílico y la creatina tamponada (Kre-Alkalyn) como supuestas evoluciones superiores al monohidrato de creatina convencional.

### Evidencia en Meta-análisis (2020-2024)
- **Saturación muscular**: Más de 500 estudios clínicos demuestran que el Monohidrato de Creatina satura los depósitos intramusculares de fosfocreatina al 100% de su capacidad biológica.
- **Solubilidad vs. Eficacia**: Aunque el HCL tiene mayor solubilidad en agua a pH bajo, una vez en el tracto digestivo la absorción plasmática final y la retención intracelular son estadísticamente idénticas.
- **Coste**: El HCL llega a costar entre 3 y 5 veces más por dosis activa de creatina libre.

**Conclusión NutriScore**: El Monohidrato Micronizado 200 Mesh o con patente Creapure® sigue siendo el estándar oro imbatible en relación coste-eficacia.`,
    categoryTag: 'Guía de Compra',
    readTime: '6 MIN LECTURA',
    date: '10 OCT 2024',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4tQXVA90HS9WDlBTDQZnv7XqYW9LwRsOa9cNLRaCyxmU2b9KAAhjpEY_0L-aK9AcNtJNi_HCj0jYxfIudO5Q_rDgIV-G_bf3alnUGsi-vtKyORQ7gBcGXHvkIb7miQa6i-pcZtF9gl675YGYiKPrTy3Tktk8RRN5PeYTuq1IzjmY_lM2cDwl4XACoBQzbrjnz7ccZAV6ZTHWSoQCo-HD04VsXd87I_oXwhri3_zfjW3xtjS72Jcer',
    author: 'Elena Morales (Especialista en Fisiología del Ejercicio)',
    keyTakeaways: [
      'El monohidrato de creatina tiene un 99.9% de eficacia biológica probada.',
      'No existe beneficio de fuerza comprobado en pagar el sobreprecio de la creatina HCL.',
    ],
  },
  {
    id: 'identificar-certificaciones-falsas',
    title: 'Cómo identificar certificaciones falsas en suplementos',
    excerpt: 'Una guía práctica para verificar si los sellos de laboratorios de terceros en tu proteína son auténticos o simples tácticas de marketing.',
    content: `Con el auge del interés en suplementación deportiva limpia, han proliferado sellos gráficos auto-diseñados por fabricantes que simulan auditorías científicas: "Laboratorio Clínico Certificado", "100% Pure Tested", "Fórmula Grado Farmacia".

### Sellos Genuinos Auditables
1. **Informed Choice / Informed Sport (LGC Group)**: Analiza lote a lote más de 250 sustancias prohibidas por la AMA/WADA. Los lotes se pueden comprobar introduciendo el código en informed-sport.com.
2. **Creapure® (Alzchem Trostberg GmbH, Alemania)**: Cada envase legítimo lleva un código numérico de licencia individual (ej. 23XX01).
3. **IFOS (International Fish Oil Standards)**: Certifica contenido exacto de EPA/DHA y niveles de metales pesados (mercurio, plomo, PCB) por debajo de 0.1 ppm en aceites Omega-3.
4. **NSF Certified for Sport**: El estándar más estricto utilizado por las ligas NFL, MLB y PGA.`,
    categoryTag: 'Transparencia',
    readTime: '8 MIN LECTURA',
    date: '04 OCT 2024',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA27OVTVTg84YFzTr2P2n64PD3U-YYxT2Dp2TOdyqtviL67imUXG5kVF5UL8cOdd4iUabgEbXYxwcm1VcqImQMJRssy6s_ecCu7zbI6Wer78qmbCkEUXS0JMqxHuX1y0wsiUHiAkErio55SOe2rwt_S4dVUMSuUTACp7Z0Aw5kmUEl01A3gbPAzFsfH3qqdfAnx5SSYNiXTENGOu3i2UJGjZlenfiE_YaVHDY-TKfuFVcXxthmOCQHs',
    author: 'Ignacio Fuentes (Auditor de Calidad en Alimentos)',
    keyTakeaways: [
      'Comprueba siempre los números de licencia en los registros públicos de la certificadora.',
      'Desconfía de logos genéricos que no enlazas a un portal de verificación oficial.',
    ],
  },
];
