export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&model=flux&nologo=true&seed=${seed}`;

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'PictoGen/1.0' }
    });

    if (!resp.ok) {
      return res.status(502).json({ error: `Pollinations error: ${resp.status}` });
    }

    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      const text = await resp.text();
      return res.status(502).json({ error: 'Non-image response', detail: text.slice(0, 200) });
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
