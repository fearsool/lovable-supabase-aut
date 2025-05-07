import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function uploadTshirt(data) {
  const { error } = await supabase.from('tshirts').insert([data]);
  if (error) {
    console.error('Upload failed:', error.message);
  } else {
    console.log('T-shirt uploaded!');
  }
}
Add index.js with Supabase upload function
