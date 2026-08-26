const https = require('https');

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'etbkutezeatbapnimebf';
const PAT_TOKEN = process.env.SUPABASE_PAT_TOKEN;
if (!PAT_TOKEN) {
  console.error('Set SUPABASE_PAT_TOKEN environment variable');
  process.exit(1);
}

function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAT_TOKEN}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

function extractId(res) {
  if (Array.isArray(res.body) && res.body[0]?.id) return res.body[0].id;
  if (res.body?.id) return res.body.id;
  return null;
}

const IMAGES = {
  'Desarrollo Web': [
    'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=500&fit=crop',
  ],
  'Ciencia de Datos': [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
  ],
  'Diseño': [
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=500&fit=crop',
  ],
  'Negocios': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop',
  ],
  'Marketing': [
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1432888622747-4eb9a8feb7f6?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1553729459-afe8f2e2b48e?w=800&h=500&fit=crop',
  ],
  'Idiomas': [
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&h=500&fit=crop',
  ],
  'Productividad': [
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=500&fit=crop',
  ],
  'Fotografía y Video': [
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=500&fit=crop',
  ],
  'Música': [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=500&fit=crop',
  ],
  'Desarrollo Personal': [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop',
  ],
};

const COURSES = [
  // Desarrollo Web
  { category: 'Desarrollo Web', title: 'HTML y CSS desde Cero', slug: 'html-css-desde-cero', short_description: 'Aprende a crear páginas web con HTML5 y CSS3 desde cero.', description: 'Curso completo de HTML5 y CSS3. Aprende a estructurar contenido con HTML y darle estilo con CSS. Incluye Flexbox, Grid y diseño responsive.', level: 'beginner', price: 0, sections: ['Introducción al HTML', 'Formularios y multimedia', 'CSS Básico', 'Flexbox y Grid'] },
  { category: 'Desarrollo Web', title: 'JavaScript Moderno ES6+', slug: 'javascript-moderno-es6', short_description: 'Domina JavaScript moderno con arrows, promises, async/await y más.', description: 'Curso intensivo de JavaScript moderno. Aprende ES6+, destructuring, módulos, promises, async/await, y patrones de código limpio.', level: 'intermediate', price: 29.99, sections: ['Variables y tipos', 'Funciones y scope', 'DOM y eventos', 'Async/Await y APIs'] },
  { category: 'Desarrollo Web', title: 'React y Next.js Completo', slug: 'react-nextjs-completo', short_description: 'Construye aplicaciones full-stack con React y Next.js App Router.', description: 'Curso completo de React 18+ y Next.js 14. Server Components, App Router, Server Actions, autenticación con Supabase y despliegue en Vercel.', level: 'advanced', price: 49.99, sections: ['Fundamentos de React', 'Hooks avanzados', 'Next.js App Router', 'Full-Stack con Supabase'] },

  // Ciencia de Datos
  { category: 'Ciencia de Datos', title: 'Python para Ciencia de Datos', slug: 'python-ciencia-datos', short_description: 'Aprende Python con Pandas, NumPy y visualización de datos.', description: 'Curso práctico de Python para análisis de datos. NumPy, Pandas, Matplotlib, Seaborn. Limpieza de datos, transformaciones y visualizaciones.', level: 'beginner', price: 34.99, sections: ['Python Básico', 'NumPy y Pandas', 'Visualización', 'Proyecto final'] },
  { category: 'Ciencia de Datos', title: 'Machine Learning con Scikit-Learn', slug: 'machine-learning-scikit', short_description: 'Construye modelos de ML: regresión, clasificación, clustering.', description: 'Aprende los algoritmos fundamentales de Machine Learning. Regresión lineal, árboles de decisión, SVM, k-means. Evaluación de modelos y pipelines.', level: 'intermediate', price: 59.99, sections: ['Introducción al ML', 'Modelos supervisados', 'No supervisados', 'Pipelines y evaluación'] },
  { category: 'Ciencia de Datos', title: 'SQL para Análisis de Datos', slug: 'sql-analisis-datos', short_description: 'Domina SQL para consultar y analizar bases de datos.', description: 'Curso completo de SQL orientado a analistas de datos. JOINs, subconsultas, CTEs, ventanas, agregaciones y optimización de queries.', level: 'beginner', price: 19.99, sections: ['SELECT y filtros', 'JOINs y relaciones', 'Funciones de ventana', 'Optimización'] },

  // Diseño
  { category: 'Diseño', title: 'Diseño UI/UX con Figma', slug: 'diseno-uiux-figma', short_description: 'Aprende diseño de interfaces profesionales con Figma.', description: 'Curso completo de diseño UI/UX. Wireframes, prototipos, design systems, componentes reutilizables y handoff para desarrolladores.', level: 'beginner', price: 39.99, sections: ['Fundamentos de UI/UX', 'Figma básico', 'Componentes y Design Systems', 'Prototipado avanzado'] },
  { category: 'Diseño', title: 'Tipografía y Color para Web', slug: 'tipografia-color-web', short_description: 'Domin la teoría del color y la tipografía para interfaces.', description: 'Aprende los principios fundamentales de tipografía y teoría del color aplicados al diseño web. Jerarquía visual, accesibilidad y armonía cromática.', level: 'intermediate', price: 24.99, sections: ['Teoría del color', 'Tipografía digital', 'Accesibilidad visual', 'Aplicación práctica'] },
  { category: 'Diseño', title: 'Motion Design para Interfaces', slug: 'motion-design-interfaces', short_description: 'Crea animaciones fluidas para apps y sitios web.', description: 'Curso de animación para interfaces digitales. CSS animations, Framer Motion, microinteracciones, transiciones y principios de motion design.', level: 'advanced', price: 44.99, sections: ['Principios del motion', 'CSS Animations', 'Framer Motion', 'Microinteracciones'] },

  // Negocios
  { category: 'Negocios', title: 'Emprendimiento Digital', slug: 'emprendimiento-digital', short_description: 'Lanza tu negocio online desde la idea hasta las primeras ventas.', description: 'Guía completa para emprender en internet. Validación de ideas, MVP, modelo de negocio, primeros clientes, métricas y escalabilidad.', level: 'beginner', price: 29.99, sections: ['Idea y validación', 'MVP y lanzamiento', 'Adquisición de clientes', 'Crecimiento y métricas'] },
  { category: 'Negocios', title: 'Finanzas para Emprendedores', slug: 'finanzas-emprendedores', short_description: 'Domina los números de tu negocio: flujo de caja, P&L, inversión.', description: 'Aprende a manejar las finanzas de tu empresa. Flujo de caja, estado de resultados, punto de equilibrio, inversión y valoración.', level: 'intermediate', price: 34.99, sections: ['Contabilidad básica', 'Flujo de caja', 'Análisis financiero', 'Inversión y valuation'] },
  { category: 'Negocios', title: 'Liderazgo y Gestión de Equipos', slug: 'liderazgo-equipos', short_description: 'Desarrolla habilidades de liderazgo para equipos de alto rendimiento.', description: 'Curso de liderazgo moderno. Comunicación efectiva, gestión de conflictos, toma de decisiones, feedback y cultura organizacional.', level: 'intermediate', price: 39.99, sections: ['Fundamentos del liderazgo', 'Comunicación', 'Gestión de conflictos', 'Construcción de equipos'] },

  // Marketing
  { category: 'Marketing', title: 'Marketing Digital Completo', slug: 'marketing-digital-completo', short_description: 'Domina SEO, SEM, redes sociales y email marketing.', description: 'Curso integral de marketing digital. SEO on-page y off-page, Google Ads, Facebook Ads, Instagram, email marketing y analítica.', level: 'beginner', price: 44.99, sections: ['Fundamentos del marketing digital', 'SEO', 'Publicidad pagada', 'Email y social media'] },
  { category: 'Marketing', title: 'Copywriting que Vende', slug: 'copywriting-que-vende', short_description: 'Escribe textos de venta que convierten visitantes en clientes.', description: 'Aprende las técnicas de copywriting más efectivas. Headlines, storytelling, gatillos emocionales, CTAs y optimización de conversiones.', level: 'intermediate', price: 29.99, sections: ['Psicología del copy', 'Headlines y ganchos', 'Estructuras de venta', 'Prueba y optimización'] },
  { category: 'Marketing', title: 'Analytics y Métricas Web', slug: 'analytics-metricas-web', short_description: 'Mide y optimiza tu presencia digital con Google Analytics 4.', description: 'Curso práctico de analítica web. Google Analytics 4, eventos, embudos de conversión, atribución, dashboards y toma de decisiones basada en datos.', level: 'intermediate', price: 34.99, sections: ['GA4 fundamentals', 'Eventos y conversiones', 'Embudos y atribución', 'Dashboards y reportes'] },

  // Idiomas
  { category: 'Idiomas', title: 'Inglés Básico para Todos', slug: 'ingles-basico-todos', short_description: 'Aprende inglés desde cero con método práctico y divertido.', description: 'Curso de inglés para hispanohablantes. Vocabulario esencial, gramática básica, pronunciación y conversación. Incluye ejercicios interactivos.', level: 'beginner', price: 0, sections: ['Alfabeto y pronunciación', 'Vocabulario esencial', 'Gramática básica', 'Conversación práctica'] },
  { category: 'Idiomas', title: 'Inglés Intermedio: B1 a B2', slug: 'ingles-intermedio-b1-b2', short_description: 'Supera el nivel intermedio y acércate a la fluidez.', description: 'Para estudiantes con base en inglés. Tiempos verbales avanzados, phrasal verbs, writing académico y conversación fluida.', level: 'intermediate', price: 24.99, sections: ['Tiempos avanzados', 'Phrasal verbs', 'Writing y estructura', 'Fluidez conversacional'] },
  { category: 'Idiomas', title: 'Portugués desde Cero', slug: 'portugues-desde-cero', short_description: 'Aprende portugués brasileño de forma práctica y efectiva.', description: 'Curso de portugués para hispanohablantes. Aprovecha las similitudes entre ambos idiomas. Gramática, vocabulario, pronunciación y cultura.', level: 'beginner', price: 19.99, sections: ['Primeros pasos', 'Gramática esencial', 'Conversación diaria', 'Cultura brasileña'] },

  // Productividad
  { category: 'Productividad', title: 'Productividad con Notion', slug: 'productividad-notion', short_description: 'Organiza tu vida y trabajo con Notion como un profesional.', description: 'Domina Notion para organizar todo. Bases de datos, plantillas, automaciones, dashboards personales y gestión de proyectos.', level: 'beginner', price: 19.99, sections: ['Fundamentos de Notion', 'Bases de datos', 'Plantillas y flujos', 'Automaciones'] },
  { category: 'Productividad', title: 'Gestión del Tiempo Efectiva', slug: 'gestion-tiempo-efectiva', short_description: 'Domina tu tiempo: técnicas probadas para lograr más en menos.', description: 'Técnicas comprobadas de productividad. Pomodoro, time blocking, Eisenhower matrix, hábitos de concentración y eliminación de distracciones.', level: 'beginner', price: 14.99, sections: ['Principios de productividad', 'Técnicas de enfoque', 'Hábitos productivos', 'Sistema personal'] },
  { category: 'Productividad', title: 'Automatización con No-Code', slug: 'automatizacion-no-code', short_description: 'Automatiza tareas repetitivas sin programar con Zapier y Make.', description: 'Crea automatizaciones poderosas sin código. Zapier, Make (Integromat), conectores, workflows y optimización de procesos.', level: 'intermediate', price: 29.99, sections: ['Fundamentos No-Code', 'Zapier en profundidad', 'Make (Integromat)', 'Workflows avanzados'] },

  // Fotografía y Video
  { category: 'Fotografía y Video', title: 'Fotografía con tu Smartphone', slug: 'fotografia-smartphone', short_description: 'Saca fotos profesionales con el celular que tienes.', description: 'Aprende composición, iluminación, edición y técnicas avanzadas para sacar el máximo partido a la cámara de tu teléfono.', level: 'beginner', price: 14.99, sections: ['Composición fotográfica', 'Iluminación natural', 'Edición con apps', 'Fotografía nocturna'] },
  { category: 'Fotografía y Video', title: 'Edición de Video con DaVinci Resolve', slug: 'edicion-video-davinci', short_description: 'Edita videos profesionales gratis con DaVinci Resolve.', description: 'Curso completo de edición de video con DaVinci Resolve. Corte, colorización, efectos, audio y exportación para YouTube y redes.', level: 'intermediate', price: 34.99, sections: ['Interfaz y corte básico', 'Edición avanzada', 'Colorización', 'Audio y exportación'] },
  { category: 'Fotografía y Video', title: 'Cine y Narrativa Audiovisual', slug: 'cine-narrativa-audiovisual', short_description: 'Cuenta historias poderosas con lenguaje cinematográfico.', description: 'Curso de narrativa visual. Planos, secuencias, ritmo, montaje, dirección de fotografía y storytelling audiovisual.', level: 'advanced', price: 49.99, sections: ['Lenguaje cinematográfico', 'Planos y secuencias', 'Montaje y ritmo', 'Proyecto final'] },

  // Música
  { category: 'Música', title: 'Producción Musical con FL Studio', slug: 'produccion-musical-fl-studio', short_description: 'Crea beats y produce música electrónica con FL Studio.', description: 'Curso de producción musical desde cero. FL Studio, diseño de sonido, síntesis, mezcla, masterización y arrangement.', level: 'beginner', price: 39.99, sections: ['Interfaz y fundamentos', 'Diseño de sonido', 'Beat making', 'Mezcla y masterización'] },
  { category: 'Música', title: 'Teoría Musical Aplicada', slug: 'teoria-musical-aplicada', short_description: 'Entiende la música: escalas, acordes, armonía y composición.', description: 'Curso de teoría musical aplicada a la composición. Escalas, intervalos, acordes, progresiones, melodía y armonía funcional.', level: 'intermediate', price: 24.99, sections: ['Notas e intervalos', 'Escalas y modos', 'Acordes y progresiones', 'Composición'] },
  { category: 'Música', title: 'Guitarra Acústica para Principiantes', slug: 'guitarra-acustica-principiantes', short_description: 'Aprende a tocar guitarra desde cero con canciones reales.', description: 'Curso de guitarra acústica para principiantes. Acordes básicos, rasgueos, canciones populares, lectura de tablaturas y técnica.', level: 'beginner', price: 0, sections: ['Postura y técnica', 'Acordes abiertos', 'Rasgueos y ritmos', 'Canciones prácticas'] },

  // ── Cursos gratuitos introductorios (4 nuevos) ──
  { category: 'Desarrollo Web', title: 'Introducción a la Programación', slug: 'introduccion-programacion', short_description: 'Da tus primeros pasos en programación con conceptos universales.', description: 'Curso introductorio para personas sin experiencia. Variables, tipos de datos, condicionales, bucles y funciones. Usa pseudocódigo y Python básico para aprender lógica de programación.', level: 'beginner', price: 0, sections: ['¿Qué es programar?', 'Variables y tipos', 'Condicionales y bucles', 'Funciones y ejercicios'] },
  { category: 'Ciencia de Datos', title: 'Introducción a la Inteligencia Artificial', slug: 'introduccion-ia', short_description: 'Descubre qué es la IA y cómo está cambiando el mundo.', description: 'Curso para entender IA sin código. Historia de la IA, machine learning, deep learning, NLP, ética de la IA, casos de uso reales y herramientas populares.', level: 'beginner', price: 0, sections: ['Historia de la IA', 'Machine Learning explicado', 'Herramientas de IA', 'Ética y futuro'] },
  { category: 'Diseño', title: 'Fundamentos del Diseño Gráfico', slug: 'fundamentos-diseno-grafico', short_description: 'Aprende los principios esenciales del diseño visual.', description: 'Curso introductorio de diseño gráfico. Teoría del color, composición, jerarquía visual, tipografía, branding y herramientas como Canva y Figma.', level: 'beginner', price: 0, sections: ['Principios del diseño', 'Color y tipografía', 'Composición y jerarquía', 'Herramientas prácticas'] },
  { category: 'Productividad', title: 'Herramientas de IA para Tu Día a Día', slug: 'herramientas-ia-cotidianas', short_description: 'Domina ChatGPT, Copilot y otras IAs para ser más productivo.', description: 'Aprende a usar las herramientas de IA más populares. ChatGPT, GitHub Copilot, Canva AI, Notion AI. Prompt engineering, automatización y productividad personal.', level: 'beginner', price: 0, sections: ['Introducción a las IAs', 'ChatGPT en profundidad', 'IA para trabajo y estudio', 'Prompt engineering básico'] },

  // Desarrollo Personal
  { category: 'Desarrollo Personal', title: 'Mindfulness y Meditación', slug: 'mindfulness-meditacion', short_description: 'Reduce el estrés y mejora tu enfoque con la meditación.', description: 'Curso práctico de mindfulness. Técnicas de meditación, respiración, atención plena y aplicación en la vida diaria.', level: 'beginner', price: 0, sections: ['¿Qué es el mindfulness?', 'Técnicas de respiración', 'Meditación guiada', 'Aplicación diaria'] },
  { category: 'Desarrollo Personal', title: 'Hábitos que Transforman tu Vida', slug: 'habitos-transforman-vida', short_description: 'Construye hábitos poderosos que cambian tu vida para siempre.', description: 'Basado en la ciencia del comportamiento. Crear y mantener hábitos, romper malos patrones, rutinas matutinas y sistema de hábitos atómicos.', level: 'beginner', price: 19.99, sections: ['Ciencia de los hábitos', 'Construir hábitos', 'Romper malos hábitos', 'Sistema de hábitos'] },
  { category: 'Desarrollo Personal', title: 'Oratoria y Comunicación Pública', slug: 'oratoria-comunicacion-publica', short_description: 'Habla en público con confianza y seguridad.', description: 'Supera el miedo a hablar en público. Estructura de discursos, manejo del público, storytelling, lenguaje corporal y preparación.', level: 'intermediate', price: 29.99, sections: ['Superar el miedo', 'Estructura del discurso', 'Storytelling', 'Práctica y técnica'] },
];

const LESSON_TITLES = ['Introducción y conceptos', 'Ejercicio práctico', 'Caso de estudio', 'Repaso y siguientes pasos'];

async function run() {
  console.log('🔗 Conectando a Supabase Cloud...\n');

  const email = 'instructor@eduplatform.demo';

  // 1. Find or create instructor
  process.stdout.write('👤 Instructor... ');
  let existingUser = await executeSql(`SELECT id FROM auth.users WHERE email = '${email}' LIMIT 1;`);
  let instructorId = extractId(existingUser);

  if (instructorId) {
    console.log(`✅ existente (${instructorId})`);
  } else {
    const userIdResult = await executeSql(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, recovery_token,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(), 'authenticated', 'authenticated', '${email}',
        crypt('Demo1234!', gen_salt('bf')),
        now(), now(), now(), '', '',
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Profesor Demo"}',
        false
      ) RETURNING id;
    `);
    instructorId = extractId(userIdResult);
    if (instructorId) {
      console.log(`✅ creado (${instructorId})`);
    } else {
      console.log(`❌ ${JSON.stringify(userIdResult.body).substring(0, 200)}`);
      return;
    }
  }

  // 2. Create profile
  process.stdout.write('👤 Perfil... ');
  await executeSql(`
    INSERT INTO profiles (id, role, onboarded, full_name, avatar_url, headline, bio)
    VALUES ('${instructorId}', 'instructor', true, 'Profesor Demo',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      'Instructor experto en tecnología y educación',
      'Más de 10 años de experiencia en educación digital.')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  `);
  console.log('✅');

  // 3. Drop embedding triggers that need Edge Functions not yet deployed
  process.stdout.write('⚙️  Desactivando triggers... ');
  await executeSql('DROP TRIGGER IF EXISTS courses_generate_embedding_insert ON courses;');
  await executeSql('DROP TRIGGER IF EXISTS courses_generate_embedding_update ON courses;');
  await executeSql('DROP FUNCTION IF EXISTS trigger_generate_course_embedding();');
  console.log('✅');

  // 4. Insert courses
  let courseCount = 0;
  for (const course of COURSES) {
    const images = IMAGES[course.category];
    const thumbnail = images[courseCount % images.length];

    process.stdout.write(`📚 [${course.category}] ${course.title}... `);

    const courseResult = await executeSql(`
      INSERT INTO courses (instructor_id, title, slug, description, short_description, thumbnail_url, category, level, price, status, student_count, rating_average, rating_count)
      VALUES (
        '${instructorId}',
        $title$${course.title}$title$,
        '${course.slug}',
        $desc$${course.description}$desc$,
        $short$${course.short_description}$short$,
        '${thumbnail}',
        '${course.category}',
        '${course.level}',
        ${course.price},
        'published',
        ${Math.floor(Math.random() * 500) + 10},
        ${(Math.random() * 1.5 + 3.5).toFixed(2)},
        ${Math.floor(Math.random() * 80) + 5}
      )
      ON CONFLICT (slug) DO UPDATE SET thumbnail_url = EXCLUDED.thumbnail_url, student_count = EXCLUDED.student_count
      RETURNING id;
    `);

    let courseId = extractId(courseResult);
    if (!courseId) {
      const existing = await executeSql(`SELECT id FROM courses WHERE slug = '${course.slug}' LIMIT 1;`);
      courseId = extractId(existing);
    }
    if (!courseId) { console.log('❌ no courseId'); continue; }

    // Sections + lessons
    for (let s = 0; s < course.sections.length; s++) {
      const secResult = await executeSql(`
        INSERT INTO sections (course_id, title, position)
        VALUES ('${courseId}', $s$${course.sections[s]}$s$, ${s})
        ON CONFLICT DO NOTHING
        RETURNING id;
      `);

      let sectionId = extractId(secResult);
      if (!sectionId) {
        const existing = await executeSql(`SELECT id FROM sections WHERE course_id = '${courseId}' AND title = $s$${course.sections[s]}$s$ LIMIT 1;`);
        sectionId = extractId(existing);
      }
      if (!sectionId) continue;

      const types = ['video', 'text', 'quiz'];
      for (let l = 0; l < 4; l++) {
        await executeSql(`
          INSERT INTO lessons (section_id, title, type, content_text, duration_seconds, position, is_free_preview)
          VALUES ('${sectionId}', $t$${LESSON_TITLES[l]}$t$, '${types[l % 3]}',
            $ct$Contenido de la lección: ${LESSON_TITLES[l]}$ct$,
            ${600 + l * 300}, ${l}, ${l === 0})
          ON CONFLICT DO NOTHING;
        `);
      }
    }
    courseCount++;
    console.log(`✅`);
  }

  console.log(`\n🎉 ${courseCount} cursos creados!`);
}

run().catch(console.error);
