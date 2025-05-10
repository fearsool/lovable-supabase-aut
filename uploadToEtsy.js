// uploadToEtsy.js
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Supabase bağlantısı
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const shopId = process.env.ETSY_SHOP_ID;
const accessToken = process.env.ETSY_ACCESS_TOKEN;

// Etsy API için gerekli sabitler
const ETST_API_URL = 'https://api.etsy.com/v3/application';
const TAXONOMY_ID = 1032; // Clothing > Unisex Adult T-shirts
const COLOR_PROPERTY_ID = 513; // Etsy'de renk varyasyonu ID'si

const createListing = async () => {
  try {
    // 1. Supabase'den pending durumdaki kayıtları çek
    const { data: pendingItems, error } = await supabase
      .from('tshirts')
      .select('*')
      .eq('status', 'pending')
      .limit(5); // Etsy API rate limiti için

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!pendingItems.length) {
      console.log('No pending listings.');
      return;
    }

    // 2. Varyasyonları ana başlığa göre grupla
    const groupedItems = pendingItems.reduce((acc, item) => {
      const baseTitle = item.title.split(' • ')[0]; // "Minimalist UFO T-Shirt • Pastel" → "Minimalist UFO T-Shirt"
      if (!acc[baseTitle]) {
        acc[baseTitle] = [];
      }
      acc[baseTitle].push(item);
      return acc;
    }, {});

    // 3. Her grup için Etsy listesi oluştur
    for (const [baseTitle, variants] of Object.entries(groupedItems)) {
      if (variants.length === 0) continue;

      // 4. Varyasyon verilerini hazırla
      const variations = [{
        property_id: COLOR_PROPERTY_ID,
        values: variants.map(variant => ({
          value: variant.title.split(' • ')[1]?.trim() || 'Default',
          price: Number(variant.price),
          quantity: Number(variant.quantity) || 20,
          image_url: variant.image_url
        }))
      }];

      // 5. Ana listing verileri
      const listingData = {
        title: baseTitle,
        description: variants[0].description || 'AI designed t-shirt',
        price: Number(variants[0].price),
        quantity: variants.reduce((sum, v) => sum + (Number(v.quantity) || 20), 0),
        taxonomy_id: TAXONOMY_ID,
        tags: variants[0].tags?.split(',') || ['ai-generated', 'tshirt'],
        type: 'physical',
        who_made: 'i_did',
        is_supply: false,
        when_made: 'made_to_order',
        variations
      };

      try {
        // 6. Etsy API'ye istek gönder
        const response = await fetch(`${ETST_API_URL}/shops/${shopId}/listings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(listingData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Etsy API error');
        }

        // 7. Başarılıysa Supabase'de durumu güncelle
        await Promise.all(
          variants.map(variant => 
            supabase
              .from('tshirts')
              .update({ 
                status: 'published', 
                etsy_id: data.listing_id,
                updated_at: new Date().toISOString()
              })
              .eq('id', variant.id)
          )
        );

        console.log(`Successfully created listing: ${data.listing_id} with ${variants.length} variants`);

      } catch (error) {
        console.error(`Error creating listing for ${baseTitle}:`, error.message);
        
        // 8. Hata durumunda kayıtları güncelle
        await Promise.all(
          variants.map(variant => 
            supabase
              .from('tshirts')
              .update({ 
                status: 'error', 
                error_log: error.message,
                updated_at: new Date().toISOString()
              })
              .eq('id', variant.id)
          )
        );
      }
    }
  } catch (error) {
    console.error('Critical error in createListing:', error);
  }
};

// Fonksiyonu çalıştır
createListing()
  .then(() => console.log('Process completed'))
  .catch(err => console.error('Process failed:', err));
