import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const bucket = 'images';
const localFilePath = 'output.png';
const fileName = 'generated-mockup.png';

async function uploadImage() {
  const fileData = fs.readFileSync(localFilePath);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileData, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error('Yükleme hatası:', error);
  } else {
    console.log('Yüklenen veri:', data);
  }
}

uploadImage();
