import Together from "together-ai";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) {
      return Response.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    const resp = await together.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.4,
      max_tokens: 12000,
      messages: [
        {
          role: "user",
          content: `
You are a professional news editor.

Convert the following transcript into a polished news-style article.

REQUIREMENTS:
- Write in neutral journalistic tone
- Create a clear headline at the top
- 3–6 paragraphs maximum
- Remove filler speech and repetition
- Preserve meaning accurately
- Do NOT add new facts
- Do NOT mention this is a transcript

OUTPUT FORMAT:
Return ONLY the article text (no JSON, no labels).

TRANSCRIPT:
${transcript}
`
        }
      ],
    });

    const article =
      resp?.choices?.[0]?.message?.content?.trim() || "";

    if (!article) {
      return Response.json({
        error: "Empty article response",
      });
    }

    return Response.json({
      article,
    });

  } catch (err) {
    console.error("ARTICLE API ERROR:", err);

    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}