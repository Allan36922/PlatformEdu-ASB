/**
 * Generates NVIDIA NIM embeddings for all published courses.
 * Run: node scripts/generate-embeddings.js
 */

const https = require("https");

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "etbkutezeatbapnimebf";
const PAT_TOKEN = process.env.SUPABASE_PAT_TOKEN;
if (!PAT_TOKEN) {
  console.error("Set SUPABASE_PAT_TOKEN environment variable");
  process.exit(1);
}

const NVIDIA_NIM_URL = "https://integrate.api.nvidia.com/v1/embeddings";
const EMBEDDING_MODEL = "nvidia/nv-embedqa-e5-v5";

const NVIDIA_API_KEY = process.env.NVIDIA_NIM_API_KEY;
if (!NVIDIA_API_KEY) {
  console.error("Set NVIDIA_NIM_API_KEY environment variable");
  process.exit(1);
}

function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request(
      {
        hostname: "api.supabase.com",
        path: `/v1/projects/${PROJECT_REF}/database/query`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAT_TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.write(body);
    req.end();
  });
}

async function getNvidiaEmbedding(text) {
  const body = JSON.stringify({
    input: [text],
    model: EMBEDDING_MODEL,
    input_type: "query",
    encoding_format: "float",
  });

  return new Promise((resolve, reject) => {
    const url = new URL(NVIDIA_NIM_URL);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.data && json.data[0] && json.data[0].embedding) {
              resolve(json.data[0].embedding);
            } else {
              console.error("Invalid NVIDIA response:", JSON.stringify(json).substring(0, 200));
              resolve(null);
            }
          } catch (e) {
            reject(new Error(`Invalid response: ${data.substring(0, 200)}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("NVIDIA timeout")); });
    req.write(body);
    req.end();
  });
}

function buildCourseText(course) {
  return [course.title, course.description, course.category, course.level]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  console.log("🎓 Generating NVIDIA NIM embeddings (1024 dims)...\n");

  const result = await executeSql(`
    SELECT id, title, description, category, level
    FROM courses
    WHERE status = 'published'
    ORDER BY title;
  `);

  if (result.status !== 200 && result.status !== 201) {
    console.error("Error fetching courses:", result.body);
    process.exit(1);
  }

  // Management API returns array directly
  const courses = Array.isArray(result.body) ? result.body : (result.body?.body || []);
  if (courses.length === 0) {
    console.error("No courses found");
    process.exit(1);
  }
  console.log(`Found ${courses.length} published courses\n`);

  let updated = 0;
  let errors = 0;

  for (const course of courses) {
    const text = buildCourseText(course);
    process.stdout.write(`  ${course.title.substring(0, 50).padEnd(50)} `);

    try {
      const embedding = await getNvidiaEmbedding(text);
      if (!embedding) {
        console.log("⚠️  No embedding");
        errors++;
        continue;
      }

      const embeddingStr = `[${embedding.join(",")}]`;

      const updateResult = await executeSql(`
        UPDATE courses SET embedding = '${embeddingStr}'::vector(1024) WHERE id = '${course.id}';
      `);

      if (updateResult.status === 200 || updateResult.status === 201) {
        console.log(`✅ (${embedding.length} dims)`);
        updated++;
      } else {
        console.log(`❌ ${JSON.stringify(updateResult.body).substring(0, 80)}`);
        errors++;
      }

      // Rate limit: 300ms between NVIDIA NIM calls
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log(`❌ ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Results: ${updated} updated, ${errors} errors, ${courses.length} total`);
}

main().catch(console.error);
