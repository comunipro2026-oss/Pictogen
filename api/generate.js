export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { actividad, personaje, pasos, charDescriptions } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  const charDesc = charDescriptions[personaje] || charDescriptions['custom'] || 'a child character';

  const prompt = `Generate exactly ${pasos} sequential steps for the activity: "${actividad}".
Character: ${charDesc}

Return ONLY a JSON array, no markdown, no extra text:
[
  {
    "step": 1,
    "label": "Etiqueta corta (máx 3 palabras en español)",
    "description": "Una oración en español describiendo la acción",
    "imagePrompt": "action and setting only in English, max 15 words, do NOT describe character appearance"
  }
]

Rules:
- label: Spanish, max 3 words, verb first
- description: Spanish, one clear sentence
- imagePrompt: English, max 15 words, ONLY the action + setting, never character appearance
- Steps must be logical and sequential`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Groq API failed', details: data });
    }

    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
