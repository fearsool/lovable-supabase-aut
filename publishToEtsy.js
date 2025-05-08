import 'dotenv/config';
import axios from 'axios';

// Etsy ayarları
const ETSY_API_KEY = process.env.ETSY_API_KEY;
const SHOP_ID = process.env.ETSY_SHOP_ID;

// Örnek veri (Supabase'den gelen veriye göre güncellenecek)
const mockProduct = {
  title: 'Trust Your Energy - Minimal T-Shirt',
  description: 'Soft cotton tee with positive message. Perfect for mindful souls.',
  price: 25.99,
  quantity: 10,
  tags: ['tshirt', 'positive', 'energy'],
  image_url: 'https://your-supabase-url.com/generated-mockup.png',
};

async function publishToEtsy(product) {
  try {
    const response = await axios.post(
      `https://openapi.etsy.com/v3/application/shops/${SHOP_ID}/listings`,
      {
        title: product.title,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        who_made: 'i_did',
        is_supply: false,
        when_made: 'made_to_order',
        taxonomy_id: 1030, // T-shirt category
        tags: product.tags,
        images: [product.image_url],
        should_auto_renew: true
      },
      {
        headers: {
          'x-api-key': ETSY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Etsy’ye başarıyla yüklendi:', response.data);
  } catch (error) {
    console.error('Etsy yükleme hatası:', error.response?.data || error.message);
  }
}

publishToEtsy(mockProduct);
