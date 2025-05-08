import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const tshirt = {
  title: 'Gökyüzü ve Elif Temalı Tişört',
  description: 'Etkileyici ve hayal gücünü tetikleyen bir tasarım. Elif’in gökyüzüyle buluştuğu an.',
  tags: ['elif', 'gökyüzü', 'hayal', 'çocuk'],
  image_urls: ['https://dousxupktshpnjojvlib.supabase.co/storage/v1/object/public/images/IMG_4976.jpeg'],
  color_variants: ['white'],
  cta: 'Hayal et, giy, yaşa.',
  report_data: { views: 0, clicks: 0, orders: 0 }
};

async function insertTshirt() {
  const { data, error } = await supabase
    .from('tshirts')
    .insert([tshirt]);

  if (error) {
    console.error('Hata:', error);
  } else {
    console.log('Başarıyla eklendi:', data);
  }
}

insertTshirt();
