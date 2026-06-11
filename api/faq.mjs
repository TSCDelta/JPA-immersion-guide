export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, faqContext } = req.body;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
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
              content: `You are a helpful assistant for a Japanese immersion learning website. You have access to the site's FAQ below, which covers the immersion method, tools, Anki, reading, listening, and related topics.

Use the FAQ as your primary source — if the answer is clearly there, base your response on it. If the question goes beyond what the FAQ covers, you can draw on your broader knowledge of Japanese learning and immersion, but keep your answers practical and consistent with the immersion-based approach the site teaches.

Keep answers concise and direct. Don't mention whether something was or wasn't in the FAQ.

FAQ:
${faqContext}`
            },
            {
              role: 'user',
              content: query
            }
          ]
        })
      }
    );

    const data = await response.json();

    const answer =
      data?.choices?.[0]?.message?.content ||
      "I couldn't find that in the guide.";

    res.status(200).json({ answer });

  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: 'Search failed.' });
  }
}
