import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_KEY);

async function test() {
  const { data, error } = await supabase.from('landing_leads').select('*');
  console.log('Error:', error);
  console.log('Data:', data ? data.length : 0);
}
test();
