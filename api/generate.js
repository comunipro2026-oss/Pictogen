export async function onRequestPost(context) {
  const { request, env } = context;

  const { actividad, personaje, pasos, charDescriptions } = await request.json();
  const apiKey = env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
      console.error('Groq API error:', data);
      return new Response(JSON.stringify({ error: 'API request failed', details: data }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sequence', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
