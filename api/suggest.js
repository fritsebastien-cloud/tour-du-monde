const MODELS = ["gemini-3.1-flash-lite"];

async function tryModel(model, apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 2048 },
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`${model}: ${resp.status} - ${err}`);
  }
  return resp.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { country } = req.body || {};
  if (!country) return res.status(400).json({ error: "country required" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const prompt = `Tu es un expert en musique et culture du monde entier. Pour le pays "${country}", donne-moi exactement 10 artistes ou groupes musicaux qui ont une histoire incroyable, émouvante, drôle ou insolite — le genre d'histoire qui ferait un super épisode de documentaire/vidéo YouTube.

Pour chaque artiste, donne :
- Le nom de l'artiste/groupe
- Le genre musical
- Un résumé percutant de l'histoire dingue en 2-3 phrases (pourquoi c'est fascinant)

Privilégie les artistes peu connus en France, les histoires surprenantes, les destins hors du commun. Mélange les époques et les genres.

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
[{"artist":"...","genre":"...","story":"..."},...]`;

  let data;
  let lastErr;
  for (const model of MODELS) {
    try {
      data = await tryModel(model, apiKey, prompt);
      break;
    } catch (e) {
      lastErr = e.message;
    }
  }

  if (!data) return res.status(502).json({ error: "All models failed", detail: lastErr });

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let artists;
  try {
    artists = JSON.parse(text);
  } catch {
    artists = [];
  }

  return res.status(200).json({ artists });
}
