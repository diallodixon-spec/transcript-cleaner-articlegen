export async function POST(req) {
  const data = await req.json();

  const transcript = data.transcript;

  // fake entity extraction for now
  const entities = [
    { found: "Postgress", suggested: "PostgreSQL" },
    { found: "Claude Sonet", suggested: "Claude Sonnet" }
  ];

  return Response.json({ entities });
}