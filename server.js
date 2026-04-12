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

    const userPrompt = `You are an expert at reading Rubik's cube sticker colors from photos.

I am giving you TWO photos of the same 3x3 Rubik's cube:
- Photo 1 (first image): Shows the WHITE face (top), ORANGE face, and BLUE face.
- Photo 2 (second image): Shows the YELLOW face, RED face, and GREEN face.

Your task: Carefully read every single sticker color on all 6 faces and return the cube state.

RULES:
- Use ONLY these letters: W=White, Y=Yellow, R=Red, O=Orange, B=Blue, G=Green
- Each face is 9 stickers read LEFT-TO-RIGHT, TOP-TO-BOTTOM (like reading a page)
- The center sticker of each face is FIXED and defines that face's color:
  U[4]=W, D[4]=Y, F[4]=G, B[4]=B, R[4]=R, L[4]=O
- Look very carefully at each individual sticker. Orange vs Red and Blue vs Green can look similar in photos — use context and the center sticker color to anchor your reading.
- Double-check: each of the 6 colors must appear exactly 9 times across all 54 stickers total.

Face reading order (left-to-right, top-to-bottom as you see them in the photo):
- U = White face (top of cube in photo 1)
- D = Yellow face (in photo 2)
- F = Green face (in photo 2, the face most directly facing the camera)
- B = Blue face (in photo 1, the face most directly facing the camera)
- R = Red face (in photo 2)
- L = Orange face (in photo 1)

Return ONLY this exact JSON, no explanation, no markdown fences:
{"U":"WWWWWWWWW","D":"YYYYYYYYY","F":"GGGGGGGGG","B":"BBBBBBBBB","R":"RRRRRRRRR","L":"OOOOOOOOO","notes":"any uncertainty"}

Replace each 9-char string with the actual sticker colors you observe. Be precise.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: img1type, data: img1b64 } },
            { type: 'image', source: { type: 'base64', media_type: img2type, data: img2b64 } },
            { type: 'text', text: userPrompt }
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
