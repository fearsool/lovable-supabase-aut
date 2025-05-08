import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const hfToken = process.env.HUGGINGFACE_API_TOKEN;

async function generateImage() {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
      {
        inputs: 'retro vintage t-shirt illustration of peaceful nature and stars',
      },
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
        },
      }
    );

    console.log('Görsel başarıyla üretildi!');
    console.log(response.data);
  } catch (error) {
    console.error('Görsel üretiminde hata oluştu:', error.response?.data || error.message);
  }
}

generateImage();
