import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function uploadTshirt(data) {
  const { error } = await supabase
    .from('tshirts')
    .insert([data]);
  if (error) console.error('Upload failed:', error.message);
  else console.log('T-shirt uploaded!');
}

// Örnek çağrı:
uploadTshirt({
  quote: 'Hello World!',
  image_url: 'https://…',
  created_at: new Date().toISOString()
});
