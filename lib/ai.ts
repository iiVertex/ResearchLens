import OpenAI from "openai"

// Single OpenAI-compatible client pointed at CometAPI. Used for BOTH the
// embedding step (high volume, runs per chunk + per query) and the answer
// generation step (claude-sonnet-4-6, runs once per question). One key, zero ML infra.
//
// If CometAPI ever stops exposing the embeddings endpoint on your plan, this
// file is the single swap point — point `embed()` at a fallback provider.

const apiKey = process.env.COMETAPI_KEY
const baseURL = process.env.COMETAPI_BASE_URL ?? "https://api.cometapi.com/v1"

export const CHAT_MODEL = process.env.COMETAPI_CHAT_MODEL ?? "claude-sonnet-4-6"
export const EMBEDDING_MODEL =
  process.env.COMETAPI_EMBEDDING_MODEL ?? "text-embedding-3-small"

// Dimensionality of text-embedding-3-small. Must match the vector(N) column
// in the chunks table. Change both together if you switch embedding models.
export const EMBEDDING_DIM = 1536

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!apiKey) {
    throw new Error(
      "COMETAPI_KEY is not set. Add it to .env.local (see .env.example).",
    )
  }
  if (!client) client = new OpenAI({ apiKey, baseURL })
  return client
}

// Embed one or more texts. CometAPI's embeddings endpoint mirrors OpenAI's, so
// we can batch many chunks in a single request.
export async function embed(input: string[]): Promise<number[][]> {
  if (input.length === 0) return []
  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  })
  // The API returns items in request order, but sort by index to be safe.
  return res.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding as number[])
}

export async function embedOne(text: string): Promise<number[]> {
  const [vector] = await embed([text])
  return vector
}

// Stream a grounded answer. `messages` should already contain the system
// instruction + the context-laden user turn (built in lib/rag.ts).
export async function streamAnswer(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
) {
  return getClient().chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.2,
    stream: true,
  })
}
