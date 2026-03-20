export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: { message: 'API ключ не настроен' } });
  }
 
  try {
    const body = req.body;
    const messages = [];
    if (body.system) messages.push({ role: 'system', content: body.system });
    for (const m of (body.messages || [])) {
      messages.push({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : m.content.map(c => c.text || '').join('')
      });
    }
 
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1000,
        temperature: 0.9
      })
    });
 
    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: { message: data.error.message } });
    }
 
    const text = data.choices?.[0]?.message?.content || 'Нет ответа';
    res.status(200).json({ content: [{ type: 'text', text }] });
 
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
}
 
