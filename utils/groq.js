// Llama a la API de Groq (compatible con OpenAI) para generar respuestas de IA
// cuando alguien menciona al bot.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const DEFAULT_SYSTEM_PROMPT =
  'Eres el asistente de un servidor de Discord en español. Responde de forma breve, cercana y natural, como en una conversación normal de chat. No uses markdown pesado ni listas salvo que lo pidan.';

async function askGroq(prompt, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Falta la variable de entorno GROQ_API_KEY.');
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: options.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: options.maxTokens || 400,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No he podido pensar en una respuesta ahora mismo.';
}

module.exports = { askGroq };
