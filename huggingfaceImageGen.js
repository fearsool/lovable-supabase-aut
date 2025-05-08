import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const hfToken = process.env.HUGGINGFACE_API_TOKEN;

async function generateImage() {
  const response = await axios.post(
    'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
    { inputs: "a black t-shirt design with a glowing quote 'Trust Your Vibe'" },
    {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        Accept: 'application/json'
      },
    }
  );

  const buffer = Buffer.from(response.data, 'base64');
  require('fs').writeFileSync('output.png', buffer);
  console.log('Görsel oluşturuldu: output.png');
}

generateImage().catch(console.error);

