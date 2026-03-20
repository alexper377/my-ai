exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'API ключ Groq не настроен на сервере' } })
    };
  }

  try {
    const body = JSON.parse(event.body);

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
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: { message: data.error.message } })
      };
    }

    const text = data.choices?.[0]?.message?.content || 'Нет ответа';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ content: [{ type: 'text', text }] })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } })
    };
  }
};
