export const config = { api: { bodyParser: true }, maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) return res.status(500).json({ error: 'HF_TOKEN not configured' });

  // Return token to frontend so it can call HF directly
  const { returnToken } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (returnToken) return res.status(200).json({ token: hfToken });

  const model = process.env.HF_MODEL || 'black-forest-labs/FLUX.1-schnell';
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error || 'HF error ' + response.status });
    }
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(buffer));
  } catch (e) {
    if (e.name === 'AbortError') return res.status(504).json({ error: 'timeout', useDirectCall: true });
    res.status(500).json({ error: e.message });
  }
}
