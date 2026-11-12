const MODELS = ["gemini-3.1-flash-lite"];

async function tryModel(model, apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 3000 },
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

  const { country, treated } = req.body || {};
  if (!country) return res.status(400).json({ error: "country required" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const treatedList = treated && treated.length > 0
    ? treated.join(", ")
    : "aucun pour l'instant";

  const prompt = `Tu es documentaliste pour MAP (Musique À Part), une chaîne YouTube qui fait le tour du monde à travers une histoire musicale dingue par pays. L'utilisateur vient de cliquer sur ${country} sur la carte. Ta mission : trouver LA meilleure histoire musicale de ce pays.

## CE QUE JE CHERCHE
Une histoire qui crée un ÉCART entre la personne et ce qu'on attend d'un musicien : mensonge, handicap, âge, absence de talent, pouvoir, menace, crime, destin improbable. Et une SCÈNE FORTE racontable en 30 secondes : un moment précis et visuel, comme une scène de film.

Le ton n'a aucune importance : drôle, tragique, absurde, glauque, touchant. Seule compte la force de l'histoire. Chaque proposition doit donner envie de dire « attends, c'est vrai ça ? ».

## EXEMPLES VALIDÉS (pour te donner le niveau attendu)
- Hermeto Pascoal (Brésil) : enfant albinos forcé de vivre à l'ombre, il fait de la musique avec des bouilloires, des cochons, l'eau d'une rivière.
- Samuragochi (Japon) : le « Beethoven japonais », sourd et hanté par Hiroshima, en réalité ni compositeur ni vraiment sourd.
- Wing (Nouvelle-Zélande) : infirmière qui chante faux des reprises d'AC/DC, devenue phénomène mondial jusqu'à South Park.
- Chalino Sánchez (Mexique) : reçoit sur scène une menace de mort, continue de chanter avec plus de rage, est assassiné après le concert.
- Grandma Lo-Fi (Islande) : à 70 ans, 59 albums enregistrés dans sa cuisine avec un Casio, ses animaux en featuring.
- Berdimuhamedow (Turkménistan) : un rappeur-DJ qui dédie un morceau à son cheval avec sample de hennissement, et qui est en fait le dictateur du pays.

## À ÉVITER
- L'artiste simplement victime d'un régime (censuré, emprisonné, assassiné) sans twist ni ambiguïté.
- Les artistes très connus du grand public français, sauf si l'angle est inconnu.
- Les histoires sans scène précise, juste une « belle carrière ».

## CONTEXTE DE LA CARTE
Pays déjà traités : ${treatedList}
Si ${country} figure dans cette liste, dis-le, puis propose quand même une alternative.
Si ta proposition repose sur le même mécanisme qu'un artiste déjà traité (imposture, chanteur sans talent devenu culte, dirigeant-musicien...), signale-le.

## MÉTHODE
- Explore large : artistes, chansons, phénomènes, traditions, faits divers musicaux.
- Distingue ce qui est sourcé solidement / rapporté mais fragile / légende.
- Si le pays offre peu de matière, propose moins de candidats plutôt que des histoires faibles, et dis-le franchement.

## FORMAT
Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks. 3 candidats maximum, classés du plus dingue au moins dingue :
[{
  "artist": "Nom de l'artiste ou du sujet",
  "tag": "Étiquette courte, ex: Drôle / Scandale, Touchant / Vieille dame",
  "pitch": "3 phrases max, ton vivant, qui résument l'histoire",
  "scene": "Le moment précis des 30 secondes, visuel, comme une scène de film",
  "ecart": "Une phrase : l'écart entre la personne et ce qu'on attend",
  "verify": "Ce qu'il faut vérifier : rumeurs, chiffres douteux, versions contradictoires",
  "material": "Matière disponible : archives, documentaires, témoins vivants",
  "note": "Si même mécanisme qu'un artiste déjà traité ou si le pays est déjà couvert, le signaler ici. Sinon laisser vide."
}]`;

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
