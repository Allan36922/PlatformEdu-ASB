/**
 * Servidor MCP (stdio) de EduPlatform.
 *
 * Expone cuatro herramientas de solo lectura sobre el proyecto:
 *   - list_assets          archivos sueltos de public/
 *   - read_asset           contenido de un archivo de public/
 *   - get_sitemap          rutas reales del App Router (src/app/)
 *   - get_catalog_context  cursos publicados en Supabase (respetando RLS)
 *
 * Limites de exposicion: solo public/, solo src/app/, y solo las columnas
 * publicas de courses. Cualquier ruta que se escape de esas carpetas se
 * rechaza (ver assertInsidePublic).
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const APP_DIR = path.join(PROJECT_ROOT, "src", "app");

/** Extensiones que se devuelven como texto plano; el resto va en base64. */
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".map",
  ".md",
  ".mjs",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml",
]);

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css",
  ".csv": "text/csv",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".md": "text/markdown",
  ".mjs": "text/javascript",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

/** Tamano maximo que read_asset devuelve, para no inundar el contexto. */
const MAX_ASSET_BYTES = 1_000_000;

function mimeTypeFor(extension: string): string {
  return MIME_TYPES[extension] ?? "application/octet-stream";
}

/**
 * Resuelve `name` dentro de public/ y falla si el resultado se sale de ahi.
 * Cubre "../", rutas absolutas y symlinks que apunten fuera de la carpeta.
 */
async function assertInsidePublic(name: string): Promise<string> {
  if (name.includes("\0")) {
    throw new Error("Nombre de archivo invalido.");
  }
  if (path.isAbsolute(name)) {
    throw new Error("Solo se aceptan rutas relativas a public/.");
  }

  const candidate = path.resolve(PUBLIC_DIR, name);
  const publicWithSep = PUBLIC_DIR + path.sep;
  if (candidate !== PUBLIC_DIR && !candidate.startsWith(publicWithSep)) {
    throw new Error("Acceso denegado: la ruta queda fuera de public/.");
  }

  // Un symlink puede apuntar fuera aunque la ruta textual parezca valida.
  const real = await fs_realpath(candidate);
  const realPublic = await fs_realpath(PUBLIC_DIR);
  const realPublicWithSep = realPublic + path.sep;
  if (real !== realPublic && !real.startsWith(realPublicWithSep)) {
    throw new Error("Acceso denegado: la ruta queda fuera de public/.");
  }

  return real;
}

async function fs_realpath(target: string): Promise<string> {
  const { realpath } = await import("node:fs/promises");
  return realpath(target);
}

const server = new McpServer({
  name: "eduplatform-mcp",
  version: "1.0.0",
});

/* -------------------------------------------------------------------------- */
/* 1. list_assets                                                             */
/* -------------------------------------------------------------------------- */

server.registerTool(
  "list_assets",
  {
    title: "Listar assets de public/",
    description:
      "Lista los archivos que viven directamente en la carpeta public/ del " +
      "proyecto, con nombre, tipo MIME y tamano en bytes. No desciende a " +
      "subdirectorios.",
    inputSchema: {},
  },
  async () => {
    const entries = await readdir(PUBLIC_DIR, { withFileTypes: true });

    const assets = [];
    for (const entry of entries) {
      // Solo archivos sueltos: los subdirectorios se omiten por completo.
      if (!entry.isFile()) continue;

      const extension = path.extname(entry.name).toLowerCase();
      const info = await stat(path.join(PUBLIC_DIR, entry.name));
      assets.push({
        name: entry.name,
        type: mimeTypeFor(extension),
        bytes: info.size,
      });
    }

    assets.sort((a, b) => a.name.localeCompare(b.name));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: assets.length, assets }, null, 2),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */
/* 2. read_asset                                                              */
/* -------------------------------------------------------------------------- */

server.registerTool(
  "read_asset",
  {
    title: "Leer un asset de public/",
    description:
      "Devuelve el contenido de un archivo de public/ dado su nombre. Los " +
      "archivos de texto se devuelven tal cual; los binarios en base64. " +
      "Rechaza cualquier ruta que salga de public/.",
    inputSchema: {
      name: z
        .string()
        .min(1)
        .describe("Nombre del archivo dentro de public/, p. ej. 'edy-widget.js'."),
    },
  },
  async ({ name }) => {
    const resolved = await assertInsidePublic(name);

    const info = await stat(resolved);
    if (!info.isFile()) {
      throw new Error("La ruta indicada no es un archivo.");
    }
    if (info.size > MAX_ASSET_BYTES) {
      throw new Error(
        `El archivo pesa ${info.size} bytes y supera el limite de ${MAX_ASSET_BYTES}.`,
      );
    }

    const extension = path.extname(resolved).toLowerCase();
    const isText = TEXT_EXTENSIONS.has(extension);
    const buffer = await readFile(resolved);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              name: path.relative(PUBLIC_DIR, resolved).split(path.sep).join("/"),
              type: mimeTypeFor(extension),
              bytes: info.size,
              encoding: isText ? "utf-8" : "base64",
              content: isText ? buffer.toString("utf-8") : buffer.toString("base64"),
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */
/* 3. get_sitemap                                                             */
/* -------------------------------------------------------------------------- */

/** Segmentos que no aparecen en la URL final (route groups) o que no son rutas. */
function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

/** Segmentos privados de Next.js: _components, @modal (slots), etc. */
function isNonRouteSegment(segment: string): boolean {
  return segment.startsWith("_") || segment.startsWith("@");
}

/**
 * Extrae el title de `export const metadata = { title: "..." }`. Solo cubre
 * literales estaticos: si la pagina usa generateMetadata (titulo dinamico) se
 * devuelve null, porque el valor real depende de los datos en request-time.
 */
function extractTitle(source: string): string | null {
  const metadataBlock = source.match(
    /export\s+const\s+metadata\s*(?::\s*Metadata\s*)?=\s*\{([\s\S]*?)\}\s*;/,
  );
  if (metadataBlock) {
    const title = metadataBlock[1].match(/title\s*:\s*(["'`])([\s\S]*?)\1/);
    if (title) return title[2];
  }
  return null;
}

/** Convierte una ruta de archivo en la URL publica que sirve Next.js. */
function toRoutePath(relativeDir: string): string {
  const segments = relativeDir
    .split(path.sep)
    .filter((segment) => segment.length > 0 && !isRouteGroup(segment));

  return segments.length === 0 ? "/" : "/" + segments.join("/");
}

async function walkRoutes(
  dir: string,
  routes: Array<{ route: string; file: string; title: string | null; dynamic: boolean }>,
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (isNonRouteSegment(entry.name)) continue;
      await walkRoutes(full, routes);
      continue;
    }

    // Solo page.* define una ruta navegable (layout/route/loading no).
    if (!/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;

    const relativeDir = path.relative(APP_DIR, dir);
    const route = toRoutePath(relativeDir);
    const source = await readFile(full, "utf-8");

    routes.push({
      route,
      file: path.relative(PROJECT_ROOT, full).split(path.sep).join("/"),
      title: extractTitle(source),
      dynamic: route.includes("["),
    });
  }
}

server.registerTool(
  "get_sitemap",
  {
    title: "Sitemap del App Router",
    description:
      "Recorre src/app/ y devuelve las rutas reales de la aplicacion. Los " +
      "route groups (carpetas entre parentesis) no aparecen en la URL. " +
      "Incluye el titulo de cada pagina cuando lo declara en su metadata.",
    inputSchema: {},
  },
  async () => {
    const routes: Array<{
      route: string;
      file: string;
      title: string | null;
      dynamic: boolean;
    }> = [];

    await walkRoutes(APP_DIR, routes);
    routes.sort((a, b) => a.route.localeCompare(b.route));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: routes.length, routes }, null, 2),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */
/* 4. get_catalog_context                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Cliente anonimo a proposito: la anon key mantiene activas las policies de
 * RLS, asi que solo salen los cursos que el publico puede ver. Nunca usar
 * aqui la service-role key.
 */
function getSupabase() {
  // El proyecto Next.js ya define estas credenciales con prefijo NEXT_PUBLIC_;
  // se aceptan como alternativa para no duplicar variables en .env.local.
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY en el entorno del servidor MCP.",
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Esta herramienta solo hace lecturas REST (PostgREST). En Node < 22 no
    // existe WebSocket global y supabase-js falla al construir el cliente
    // Realtime, asi que se le pasa un stub que nunca llega a usarse.
    realtime: { transport: NoopWebSocket as never },
  });
}

/** Stub de WebSocket: Realtime no se usa, pero el constructor lo exige. */
class NoopWebSocket {
  constructor() {
    throw new Error("Realtime no esta soportado en el servidor MCP.");
  }
}

server.registerTool(
  "get_catalog_context",
  {
    title: "Catalogo de cursos publicados",
    description:
      "Consulta Supabase y devuelve los cursos publicados (id, slug, title, " +
      "description, level, category, price). Usa la anon key, de modo que " +
      "respeta las policies de RLS del proyecto.",
    inputSchema: {
      category: z
        .string()
        .min(1)
        .optional()
        .describe("Filtra por categoria exacta (opcional)."),
      level: z
        .enum(["beginner", "intermediate", "advanced"])
        .optional()
        .describe("Filtra por nivel (opcional)."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe("Maximo de cursos a devolver."),
    },
  },
  async ({ category, level, limit }) => {
    const supabase = getSupabase();

    // La tabla usa status: 'draft' | 'published'; no existe is_published.
    let query = supabase
      .from("courses")
      .select("id, slug, title, description, level, category, price")
      .eq("status", "published")
      .order("title", { ascending: true })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (level) query = query.eq("level", level);

    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase respondio con error: ${error.message}`);
    }

    const courses = data ?? [];

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: courses.length, courses }, null, 2),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout es el canal del protocolo: los logs SIEMPRE van a stderr.
  console.error("[eduplatform-mcp] servidor escuchando en stdio");
}

main().catch((error) => {
  console.error("[eduplatform-mcp] fallo al arrancar:", error);
  process.exit(1);
});
