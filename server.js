const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/scan', async (req, res) => {
  const { image1, image2, apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }

  try {
    const img1b64 = image1.split(',')[1];
    const img2b64 = image2.split(',')[1];
    const img1type = image1.split(';')[0].split(':')[1];
    const img2type = image2.split(';')[0].split(':')[1];

    const systemPrompt = `You are a Rubik's cube state reader. The user has provided two photos of their 3×3 Rubik's cube.
- Photo 1 shows the White, Orange, and Blue faces.
- Photo 2 shows the Yellow, Red, and Green faces.

Return ONLY a JSON object with this exact structure (no explanation, no markdown):
{
  "U": "WWWWWWWWW",
  "D": "YYYYYYYYY",
  "F": "GGGGGGGGG",
  "B": "BBBBBBBBB",
  "R": "RRRRRRRRR",
  "L": "OOOOOOOOO"
}

Each face string is 9 characters, reading left-to-right, top-to-bottom.
Use W=White, Y=Yellow, R=Red, O=Orange, B=Blue, G=Green.
U=white top, D=yellow bottom, F=green front, B=blue back, R=red right, L=orange left.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: img1type, data: img1b64 } },
            { type: 'image', source: { type: 'base64', media_type: img2type, data: img2b64 } },
            { type: 'text', text: systemPrompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Cube server running at http://localhost:${PORT}`);
});