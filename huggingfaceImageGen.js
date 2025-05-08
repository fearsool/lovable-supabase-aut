const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const hfToken = process.env.HUGGINGFACE_API_TOKEN;
const model = 'stabilityai/stable-diffusion-2'; // HuggingFace üzerinde desteklenen bir model
const prompt = 'a vintage-style t-shirt design featuring a cosmic UFO and the quote "Take it easy"';

async function generateImage() {
  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const imageBuffer = Buffer.from(response.data, 'binary');
    fs.writeFileSync('output.png', imageBuffer);
    console.log('Görsel başarıyla kaydedildi: output.png');
  } catch (error) {
    console.error('Hata oluştu:', error.response?.data || error.message);
  }
}

generateImage();
