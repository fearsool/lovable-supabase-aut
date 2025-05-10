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

// Etsy API için sabitler
const ETSY_API_URL = 'https://api.etsy.com/v3/application';
const TAXONOMY_ID = 1032; // Clothing > Unisex Adult T-shirts
const COLOR_PROPERTY_ID = 513; // Renk varyasyonu

const createListing = async () => {
  try {
    // 1. Supabase'ten status=pending olanları çek
    const { data: pendingItems, error } = await supabase
      .from('tshirts')
      .select('*')
      .eq('status', 'pending')
      .limit(5);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!pendingItems.length) {
      console.log('Yüklenecek ürün yok.');
      return;
    }

    // 2. Aynı başlıkta (renk hariç) ürünleri grupla
    const grouped = pendingItems.reduce((acc, item) => {
      const baseTitle = item.title.split(' • ')[0];
      if (!acc[baseTitle]) acc[baseTitle] = [];
      acc[baseTitle].push(item);
      return acc;
    }, {});

    // 3. Her grup için Etsy listing oluştur
    for (const [baseTitle, variants] of Object.entries(grouped)) {
      if (variants.length === 0) continue;

      const variations = [{
        property_id: COLOR_PROPERTY_ID,
        values: variants.map(v => ({
          value: v.title.split(' • ')[1]?.trim() || 'Default',
          price: Number(v.price),
          quantity: Number(v.quantity) || 10,
          image_url: v.image_url
        }))
      }];

      const listingData = {
        title: baseTitle,
        description: variants[0].description || 'AI designed t-shirt',
        price: Number(variants[0].price),
        quantity: variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0),
        taxonomy_id: TAXONOMY_ID,
        tags: variants[0].tags?.split(',') || ['ai-generated', 'tshirt'],
        type: 'physical',
        who_made: 'i_did',
        is_supply: false,
        when_made: 'made_to_order',
        variations
      };

      try {
        const res = await fetch(`${ETSY_API_URL}/shops/${shopId}/listings`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(listingData)
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Etsy API error');
        }

        await Promise.all(variants.map(v =>
          supabase
            .from('tshirts')
            .update({
              status: 'published',
              etsy_id: data.listing_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', v.id)
        ));

        console.log(`Yüklendi: ${baseTitle} (Listing ID: ${data.listing_id})`);

      } catch (err) {
        console.error(`Hata oluştu: ${baseTitle}`, err.message);

        await Promise.all(variants.map(v =>
          supabase
            .from('tshirts')
            .update({
              status: 'error',
              error_log: err.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', v.id)
        ));
      }
    }
  } catch (e) {
    console.error('Kritik hata:', e.message);
  }
};

createListing()
  .then(() => console.log('İşlem tamamlandı.'))
  .catch(err => console.error('İşlem başarısız:', err));
