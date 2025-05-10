const { createClient } = require('@supabase/supabase-js');
const { EtsyClient } = require('etsy-axios-client');
require('dotenv').config();

// Supabase bağlantısı
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Etsy istemcisi
const etsy = new EtsyClient({
  apiKey: process.env.ETSY_API_KEY,
  shopId: process.env.ETSY_SHOP_ID
});

async function processPendingListings() {
  try {
    // 1. Supabase’den pending durumdaki kayıtları çek (aynı tasarım için grupla)
    const { data: pendingItems, error } = await supabase
      .from('tshirts')
      .select('*')
      .eq('status', 'pending')
      .limit(5); // Etsy API rate limiti için

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!pendingItems.length) return console.log('No pending listings.');

    // 2. Aynı tasarımın varyasyonlarını grupla (örneğin, "UFO T-Shirt" için 5 varyasyon)
    const groupedItems = {};
    for (const item of pendingItems) {
      const baseTitle = item.title.split(' • ')[0]; // Örneğin: "Pastel Minimalist UFO T-Shirt • Soft Colors" → "Pastel Minimalist UFO T-Shirt"
      if (!groupedItems[baseTitle]) {
        groupedItems[baseTitle] = [];
      }
      groupedItems[baseTitle].push(item);
    }

    // 3. Her grup için tek bir Etsy listesi oluştur
    for (const baseTitle in groupedItems) {
      const variants = groupedItems[baseTitle];
      try {
        // 4. Ana listing veri yapısını oluştur
        const listingData = {
          title: baseTitle, // Örneğin: "Pastel Minimalist UFO T-Shirt"
          description: variants[0].description, // İlk varyasyonun açıklamasını kullan
          price: variants[0].price, // İlk varyasyonun fiyatını kullan
          quantity: 100, // Toplam stok (her varyasyon için ayrı ayrı belirteceğiz)
          tags: variants[0].tags || ['ai-generated', 'tshirt', 'ufo'],
          materials: ['cotton'],
          shipping_template_id: process.env.ETSY_SHIPPING_TEMPLATE_ID,
          imageUrls: [], // Görselleri varyasyonlarla eşleştireceğiz
        };

        // 5. Varyasyonları tanımla (örneğin renk bazlı varyasyonlar)
        const variations = [
          {
            property_id: 513, // Etsy'de "Color" özelliği için property_id (bu ID Etsy’den alınır)
            values: variants.map((variant, index) => ({
              value: variant.title.split(' • ')[1] || `Variant ${index + 1}`, // Örneğin: "Soft Colors", "Retro Style"
              price: variant.price,
              quantity: variant.quantity || 20,
              image_url: variant.image_url, // Her varyasyon için ayrı görsel
            })),
          },
        ];

        // 6. Etsy API’ye listing’i gönder
        const response = await etsy.createListing({
          ...listingData,
          variations: variations,
        });

        // 7. Başarılıysa tüm varyasyonların status’ünü güncelle
        for (const variant of variants) {
          await supabase
            .from('tshirts')
            .update({
              status: 'published',
              etsy_id: response.data.results[0].listing_id,
            })
            .eq('id', variant.id);
        }

        console.log(`Listing ${baseTitle} uploaded successfully with ${variants.length} variations! Etsy ID: ${response.data.results[0].listing_id}`);
      } catch (etsyError) {
        console.error(`Error processing group ${baseTitle}:`, etsyError.response?.data || etsyError.message);
        // Hata durumunda tüm varyasyonları "error" olarak işaretle
        for (const variant of variants) {
          await supabase
            .from('tshirts')
            .update({
              status: 'error',
              error_log: etsyError.message,
            })
            .eq('id', variant.id);
        }
      }
    }
  } catch (supabaseError) {
    console.error('Critical error:', supabaseError);
    process.exit(1);
  }
}

processPendingListings();
