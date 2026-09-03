const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data, error } = await supabase.from('orders').select(`
          *,
          user:user_id (full_name, email, phone, role, account_status),
          service:service_id (name, processing_time)
        `).limit(1);
  console.log('Orders query:', error ? error.message : 'Success');
}
run();
