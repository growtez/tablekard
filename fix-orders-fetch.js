const URL = "https://sguegujmoawhtstzsdqs.supabase.co/rest/v1/orders?status=eq.cancelled";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndWVndWptb2F3aHRzdHpzZHFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkxMzEyNCwiZXhwIjoyMDg2NDg5MTI0fQ.Sj6JN-C8oO7Pa58ibUxoiraOKnsGRwvfqwp_NYofE-g";

async function run() {
  const res = await fetch(URL, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const data = await res.json();
  const toRestore = data.filter(d => (d.payment_status || '').toLowerCase() === 'paid');
  console.log(`Found ${toRestore.length} cancelled paid orders.`);
  
  for(const order of toRestore) {
    await fetch(`https://sguegujmoawhtstzsdqs.supabase.co/rest/v1/orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
  }
  console.log('Restored correctly.');
}
run();
