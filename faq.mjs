export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const WINDOW_MS = 60 * 1000;
  const MAX_REQUESTS = 5;

  if (!global._rateLimit) global._rateLimit = new Map();
  const record = global._rateLimit.get(ip) || { count: 0, start: now };

  if (now - record.start > WINDOW_MS) {
    record.count = 0;
    record.start = now;
  }

  record.count++;
  global._rateLimit.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ answer: 'Too many searches — please wait a minute before trying again.' });
  }

  const { query, faqContext } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing query' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an FAQ assistant for a Japanese immersion website. Answer using ONLY the FAQ content provided. Be concise and direct. If the answer is not in the FAQ, say: "I couldn\'t find that in the guide."'
          },
          {
            role: 'user',
            content: `FAQ:\n${faqContext}\n\nQuestion: ${query}`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(500).json({ answer: 'Search failed. Try again in a moment.' });
    }

    const answer = data?.choices?.[0]?.message?.content || "I couldn't find that in the guide.";
    return res.status(200).json({ answer });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ answer: 'Search failed. Try again in a moment.' });
  }
}
