const URL = 'https://sguegujmoawhtstzsdqs.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndWVndWptb2F3aHRzdHpzZHFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkxMzEyNCwiZXhwIjoyMDg2NDg5MTI0fQ.Sj6JN-C8oO7Pa58ibUxoiraOKnsGRwvfqwp_NYofE-g';
async function run() {
  const res = await fetch(URL, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const data = await res.json();
  const tables = Object.keys(data.paths).map(p => p.slice(1));
  console.log('Tables:', tables.join(', '));
}
run();
