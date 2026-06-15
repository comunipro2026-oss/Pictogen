export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mediaType } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${imageBase64}` }
            },
            {
              type: 'text',
              text: 'Describe this person as a Pixar 3D character for consistent image generation. Include: age range, gender, hair color and style, skin tone, eye color, clothing colors and style. Write 2 sentences in English. Be concise and specific for AI image generation.'
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Vision API failed', details: data });
    }

    const description = data.choices[0].message.content;
    return res.status(200).json({ description });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
