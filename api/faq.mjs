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
              content: `You are an FAQ assistant for a Japanese immersion website. Use ONLY the information below to answer. If the answer is not in the FAQ, say: "I couldn't find that in the guide."\n\nFAQ:\n${faqContext}`
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
