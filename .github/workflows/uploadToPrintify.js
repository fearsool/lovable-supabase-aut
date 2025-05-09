// uploadToPrintify.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

const productData = {
  title: "AI Designed T-Shirt – Minimal Style",
  description: "Tasarım, yapay zeka tarafından oluşturulmuş minimal ve şık bir T-shirt.",
  blueprint_id: 401, // Unisex T-shirt örneği
  print_provider_id: 1, // Printify’ın varsayılan sağlayıcısı (örnek)
  variants: [
    {
      id: 40100, // small beden örneği
      price: 1999, // kuruş cinsinden: 19.99
      is_enabled: true
    }
  ],
  images: [
    {
      src: "https://images.unsplash.com/photo-1600185365453-0c63ec9faaa4" // gerçek görsel URL'si
    }
  ]
};

const createProduct = async () => {
  const url = `https://api.printify.com/v1/shops/${SHOP_ID}/products.json`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Ürün yüklenemedi:", data);
    } else {
      console.log("Ürün başarıyla yüklendi:", data);
    }
  } catch (error) {
    console.error("İstek hatası:", error);
  }
};

createProduct();
