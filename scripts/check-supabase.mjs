import 'dotenv/config';
import { supabase } from '../src/services/supabaseClient.js';

async function main() {
  try {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase error:', error);
      process.exit(2);
    }

    console.log(`Found ${Array.isArray(data) ? data.length : 0} rows (showing up to 20):`);
    console.log(data || []);
  } catch (e) {
    console.error('Failed to query Supabase:', e);
    process.exit(3);
  }
}

main();
