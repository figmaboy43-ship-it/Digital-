import { supabase } from './src/lib/supabase';
(async () => {
  const { data, error } = await supabase.from('site_settings').select('*');
  console.log('data:', data, 'error:', error);
})();
