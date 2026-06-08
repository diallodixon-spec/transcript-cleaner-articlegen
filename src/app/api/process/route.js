import Together from "together-ai";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});




// -----------------------------
// 1. Chunking function
// -----------------------------
function chunkText(text, chunkSize = 500, overlap = 100) {
  const words = text.split(" ");
  const chunks = [];

  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    chunks.push(chunk);
    i += chunkSize - overlap;
  }

  return chunks;
}


// -----------------------------
// 2. Prompt builder
// -----------------------------
function buildPrompt(chunk) {
  return `
Extract named entities from this transcript. Ensure to go line by line to identify all named entities. Prioritize accuracy over speed.

Return ONLY valid JSON:

{
  "entities": [
    {
      "found": "original or misspelled name",
      "suggested": "correct canonical name"
    }
  ]
}

Rules:
- ONLY return JSON
- No explanations
- Be exhaustive

TRANSCRIPT SECTION:
${chunk}
`;
}


// -----------------------------
// 3. Deduplication
// -----------------------------
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function deduplicateEntities(entities) {
  const map = new Map();

  for (const e of entities) {
    const key = normalize(e.suggested || e.found);

    if (!map.has(key)) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}


// -----------------------------
// MAIN API ROUTE
// -----------------------------
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const text = await file.text();

    // STEP 1: chunk transcript
    const chunks = chunkText(text);

    let allEntities = [];

    // STEP 2: process each chunk
    for (const chunk of chunks) {
      try {
        const resp = await together.chat.completions.create({
          //model: "openai/gpt-oss-120b",
          model: "meta-llama/Meta-Llama-3-8B-Instruct-Lite",
          max_tokens: 1500,
          temperature: 0.2,
          messages: [
            {
              role: "user",
              content: buildPrompt(chunk),
            },
          ],
        });

        const output = resp?.choices?.[0]?.message?.content || "";

        const jsonMatch = output.match(/\{[\s\S]*\}/);

        if (!jsonMatch) continue;

        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed?.entities?.length) {
          allEntities.push(...parsed.entities);
        }

      } catch (chunkErr) {
        console.log("Chunk failed:", chunkErr.message);
        continue;
      }
    }

    // STEP 3: deduplicate
    const finalEntities = deduplicateEntities(allEntities);

    // STEP 4: return result
    return Response.json({
      entities: finalEntities,
      totalChunks: chunks.length,
    });

  } catch (err) {
    console.error("API ERROR:", err);

    return Response.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}