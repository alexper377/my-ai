export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return res.status(500).json({ error: 'HF_TOKEN не настроен' });

  const { prompt, style } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Нет промпта' });

  const styledPrompt = style && style !== 'realistic'
    ? `${prompt}, ${style} style, high quality, detailed`
    : `${prompt}, photorealistic, high quality, 8k, detailed`;

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: styledPrompt,
          parameters: { num_inference_steps: 25, guidance_scale: 7.5 },
          options: { wait_for_model: true }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      // Model loading - return status
      if (response.status === 503) {
        return res.status(503).json({ error: 'Модель загружается, попробуй через 20 секунд' });
      }
      return res.status(500).json({ error: err });
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    res.status(200).json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
