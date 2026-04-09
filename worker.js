// worker.js
export default {
  async fetch(request, env) {
    // Handle CORS so your website can talk to this worker
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { image1, image2 } = await request.json();
      
      // Call the REAL Claude API with your secret key
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.CLAUDE_API_KEY, // Secret key stored in Cloudflare, not in browser!
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'You are a Rubik\'s Cube scanner. Look at these two images. Image 1 shows White (top), Orange (left), Blue (right). Image 2 shows Yellow (bottom), Red (back), Green (front). Return ONLY a JSON object like this: {"U":"WWWWWWWWW","L":"OOOOOOOOO","F":"GGGGGGGGG","R":"RRRRRRRRR","B":"BBBBBBBBB","D":"YYYYYYYYY"}. Use W, O, G, R, B, Y for colors. Ensure 9 characters per face.'
              },
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image1 } },
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image2 } }
            ]
          }]
        }),
      });

      const data = await response.json();
      
      // Send the cube state back to the browser
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};