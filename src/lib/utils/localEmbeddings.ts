/**
 * Embedding utilities for EduPlatform.
 *
 * Primary: NVIDIA NIM API (nvidia/nv-embedqa-e5-v5, 384 dims).
 * Fallback: deterministic local pseudo-embeddings for development/testing
 * when no API key is configured.
 */

const EMBEDDING_DIM = 1024;
const NVIDIA_NIM_URL = "https://integrate.api.nvidia.com/v1/embeddings";
const EMBEDDING_MODEL = "nvidia/nv-embedqa-e5-v5";

/**
 * Generates a real embedding via NVIDIA NIM API.
 * Returns null if the API key is not configured or the call fails.
 */
async function getNvidiaEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(NVIDIA_NIM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: [text],
        model: EMBEDDING_MODEL,
        input_type: "query",
        encoding_format: "float",
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) return null;

    return embedding.slice(0, EMBEDDING_DIM);
  } catch {
    return null;
  }
}

/**
 * Generates a deterministic pseudo-embedding from text.
 * Not a real embedding — for dev/testing only when NVIDIA NIM is unavailable.
 */
function generateLocalEmbedding(text: string): number[] {
  const embedding = new Array(EMBEDDING_DIM).fill(0);

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  let seed = Math.abs(hash);

  function nextRandom(): number {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  for (let i = 0; i < EMBEDDING_DIM; i++) {
    const charInfluence = i < text.length ? text.charCodeAt(i % text.length) / 255 : 0;
    embedding[i] = (charInfluence * 0.3 + nextRandom() * 0.7) * 2 - 1;
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Generates an embedding for the given text.
 * Tries NVIDIA NIM first, falls back to local pseudo-embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const nvidia = await getNvidiaEmbedding(text);
  if (nvidia) return nvidia;
  return generateLocalEmbedding(text);
}

// Keep backward compat exports
export { generateLocalEmbedding };

/**
 * Cosine similarity between two embedding vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches courses by similarity using local embeddings.
 * Used as fallback when Edge Functions are not available.
 */
export async function searchCoursesBySimilarityLocal(
  query: string,
  courses: Array<{ id: string; embedding: number[] | null; [key: string]: unknown }>,
  limit = 10,
): Promise<Array<{ id: string; similarity: number }>> {
  const queryEmbedding = await generateEmbedding(query);

  const matches = courses
    .filter((c) => c.embedding && Array.isArray(c.embedding))
    .map((course) => ({
      id: course.id,
      similarity: cosineSimilarity(queryEmbedding, course.embedding as number[]),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return matches;
}
