import { createClient } from '@supabase/supabase-js';

// Get from your .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('restaurant_notifications').select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}

check();
