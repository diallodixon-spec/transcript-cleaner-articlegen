export async function POST(req) {
  const body = await req.json();

  const { transcript, corrections } = body;

  let updatedText = transcript;

  // apply replacements globally
  for (const item of corrections) {
    const { found, corrected } = item;

    if (!found || !corrected) continue;

    // global replace (simple MVP version)
    const regex = new RegExp(found, "g");
    updatedText = updatedText.replace(regex, corrected);
  }

  return Response.json({
    cleanedTranscript: updatedText
  });
}