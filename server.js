const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/scan', async (req, res) => {
  const { image1, image2, apiKey } = req.body;
  
  console.log('Received request with API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'missing');
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }

  try {
    const img1b64 = image1.split(',')[1];
    const img2b64 = image2.split(',')[1];
    const img1type = image1.split(';')[0].split(':')[1];
    const img2type = image2.split(';')[0].split(':')[1];

    const systemPrompt = `You are a Rubik's cube state reader. Return ONLY JSON: {"U":"9chars","D":"9chars","F":"9chars","B":"9chars","R":"9chars","L":"9chars"} using W,Y,R,O,B,G. U=white top, D=yellow bottom, F=green front.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
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
      console.error('Anthropic error:', response.status, errorText);
      return res.status(response.status).json({ error: `Anthropic API error: ${errorText}` });
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
