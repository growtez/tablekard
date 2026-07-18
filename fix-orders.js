const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 's:/growtez/3.2 Tablekard/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if(!supabaseUrl || !supabaseKey) { 
    console.log('No keys'); 
    process.exit(1); 
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('orders').select('id, status, payment_status').eq('status', 'cancelled');
  if(error) { 
      console.log(error); 
      return; 
  }
  
  const toRestore = data.filter(d => (d.payment_status || '').toLowerCase() === 'paid');
  console.log(`Found ${toRestore.length} cancelled paid orders.`);
  
  for(const order of toRestore) {
    await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id);
  }
  console.log('Restored.');
}
run();
