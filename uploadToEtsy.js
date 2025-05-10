// uploadToEtsy.js
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Çevresel değişkenleri yükle
dotenv.config();

// Supabase bağlantısı
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Etsy Shop ID ve Erişim Token'ı
const shopId = process.env.ETSY_SHOP_ID;
const accessToken = process.env.ETSY_ACCESS_TOKEN;

const createListing = async () => {
  try {
    // 1. Supabase’den "pending" durumundaki kayıtları çek
    const { data: pendingItems, error } = await supabase
      .from('tshirts')
      .select('*')
      .eq('status', 'pending')
      .limit(5); // Etsy API rate limiti için

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!pendingItems.length) return console.log('Hiç bekleyen liste yok.');

    // 2. Aynı tasarımın varyasyonlarını grupla
    const groupedItems = {};
    for (const item of pendingItems) {
      const baseTitle = item.title.split(' • ')[0]; // Örneğin: "Minimalist UFO T-Shirt • Pastel" → "Minimalist UFO T-Shirt"
      if (!groupedItems[baseTitle]) {
        groupedItems[baseTitle] = [];
      }
      groupedItems[baseTitle].push(item);
    }

    // 3. Her grup için Etsy listesi oluştur
    for (const baseTitle in groupedItems) {
      const variants = groupedItems[baseTitle];
      if (variants.length !== 5) {
        console.warn(`Uyarı: ${baseTitle} için ${variants.length} varyasyon var (5 olması bekleniyor). Atlanıyor...`);
        continue; // 5 varyasyon yoksa atla
      }

      const url = `https://api.etsy.com/v3/application/shops/${shopId}/listings`;

      const listingData = {
        title: baseTitle, // Örneğin: "Minimalist UFO T-Shirt"
        description: variants[0].description, // İlk varyasyonun açıklamasını kullan
        price: variants[0].price, // İlk varyasyonun fiyatını kullan
        quantity: 100, // Toplam stok (her varyasyon için ayrı ayrı belirlenecek)
        taxonomy_id: 1032, // Örnek kategori: Clothing > Unisex Adult T-shirts
        tags: variants[0].tags || ['ai-generated', 'tshirt', 'ufo'],
        type: 'physical',
        who_made: 'i_did',
        is_supply: false,
        when_made: 'made_to_order',
        image_urls: [], // Görselleri varyasyonlarla eşleştireceğiz
      };

      // 4. Varyasyonları tanımla
      const variations = [
        {
          property_id: 513, // Etsy’de "Color" özelliği için property_id
          values: variants.map((variant, index) => ({
            value: variant.title.split(' • ')[1] || `Variant ${index + 1}`, // Örneğin: "Pastel", "Retro"
            price: variant.price,
            quantity: variant.quantity || 20,
            image_url: variant.image_url, // Her varyasyon için ayrı görsel
          })),
        },
      ];

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ ...listingData, variations }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`Hata oluştu (ürün: ${baseTitle}):`, data);
          // Hata durumunda tüm varyasyonları güncelle
          for (const variant of variants) {
            await supabase
              .from('tshirts')
              .update({ status: 'error', error_log: JSON.stringify(data) })
              .eq('id', variant.id);
          }
        } else {
          console.log(`Başarıyla yüklendi (${baseTitle} with ${variants.length} variations):`, data);
          // Başarılıysa tüm varyasyonların status’ünü güncelle
          for (const variant of variants) {
            await supabase
              .from('tshirts')
              .update({ status: 'published', etsy_id: data.listing_id })
              .eq('id', variant.id);
          }
        }
      } catch (error) {
        console.error(`İstek sırasında hata (${baseTitle}):`, error);
        for (const variant of variants) {
          await supabase
            .from('tshirts')
            .update({ status: 'error', error_log: error.message })
            .eq('id', variant.id);
        }
      }
    }
  } catch (supabaseError) {
    console.error('Kritik hata:', supabaseError);
  }
};

// Fonksiyonu başlat
createListing();
