export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { actividad, personaje, pasos, charDescriptions } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const charDesc = charDescriptions[personaje];
  const prompt = `Generate exactly ${pasos} clear sequential steps for the activity: "${actividad}".
Character: ${charDesc}

Return ONLY a JSON array with this exact structure (no markdown, no extra text):
[
  {
    "step": 1,
    "label": "Short label in Spanish (max 4 words)",
    "description": "One clear sentence in Spanish describing what happens",
    "imagePrompt": "Detailed English image generation prompt describing the specific action in this step, the character performing it, their exact body position and expression, and any objects involved"
  }
]

Rules:
- Labels in Spanish, max 4 words, action-focused
- Descriptions in Spanish, one clear sentence
- Image prompts in English, very visual and specific
- Steps must be logical, sequential, and pedagogically clear
- Focus on observable actions the character is doing`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(500).json({ error: 'API request failed', details: data });
    }

    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to generate sequence', details: error.message });
  }
}
