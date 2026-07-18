const URL = 'https://sguegujmoawhtstzsdqs.supabase.co/rest/v1/platform_settings?select=*';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndWVndWptb2F3aHRzdHpzZHFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkxMzEyNCwiZXhwIjoyMDg2NDg5MTI0fQ.Sj6JN-C8oO7Pa58ibUxoiraOKnsGRwvfqwp_NYofE-g';
fetch(URL, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  .then(res => res.json())
  .then(console.log);
