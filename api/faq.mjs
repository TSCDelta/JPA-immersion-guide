export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const { query, faqContext } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are an FAQ assistant for a Japanese immersion website.

Use ONLY the information below.

FAQ:
${faqContext}

Question:
${query}

If the answer is not in the FAQ, say:
"I couldn't find that in the guide."
                  `
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't find that in the guide.";

    res.status(200).json({
      answer
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      answer: 'Search failed.'
    });
  }
}
