export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { country } = req.body || {};
  if (!country) return res.status(400).json({ error: "country required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const prompt = `Tu es un expert en musique et culture du monde entier. Pour le pays "${country}", donne-moi exactement 10 artistes ou groupes musicaux qui ont une histoire incroyable, émouvante, drôle ou insolite — le genre d'histoire qui ferait un super épisode de documentaire/vidéo YouTube.

Pour chaque artiste, donne :
- Le nom de l'artiste/groupe
- Le genre musical
- Un résumé percutant de l'histoire dingue en 2-3 phrases (pourquoi c'est fascinant)

Privilégie les artistes peu connus en France, les histoires surprenantes, les destins hors du commun. Mélange les époques et les genres.

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
[{"artist":"...","genre":"...","story":"..."},...]`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(502).json({ error: "Claude API error", detail: err });
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text || "[]";

    let artists;
    try {
      artists = JSON.parse(text);
    } catch {
      artists = [];
    }

    return res.status(200).json({ artists });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
