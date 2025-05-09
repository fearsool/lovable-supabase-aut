import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

// Supabase'e bağlan
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Dosya yolu (huggingface tarafından oluşturulan görsel dosyası)
const filePath = 'output.png'; // Huggingface bu isimle kaydediyorsa doğru
// Eğer farklı isimle kaydediyorsan burayı değiştir: örn. 'generated-image.png'

const uploadImage = async () => {
  try {
    const fileData = fs.readFileSync(filePath);
    const fileName = `designs/${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from('images') // Bucket adı Supabase Storage'taki ile aynı olmalı
      .upload(fileName, fileData, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error('Yükleme hatası:', error.message);
    } else {
      console.log('Yükleme başarılı:', data);
    }
  } catch (err) {
    console.error('Dosya okuma hatası:', err.message);
  }
};

uploadImage();
