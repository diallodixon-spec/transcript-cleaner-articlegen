import Together from "together-ai";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { article, url } = body;

    if (!article) {
      return Response.json(
        { error: "No article provided" },
        { status: 400 }
      );
    }

    const resp = await together.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.5,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `
Based on the article below, create 3 engaging social media posts.

IMPORTANT:
- Create exactly 3 posts.
- Number them Post 1, Post 2, Post 3.
- Include the URL below in EVERY post.
- The URL must appear exactly as written.
- Do not omit the URL.
- Include hashtags.
- Keep each post under 280 characters.

URL:
${url}

ARTICLE:

${article}
`,
        },
      ],
    });

    const posts =
      resp?.choices?.[0]?.message?.content?.trim() || "";

    return Response.json({
      posts,
    });

  } catch (err) {
    console.error("SOCIAL API ERROR:", err);

    return Response.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}