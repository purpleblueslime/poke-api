import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://apunwzrlgvqzzhzenzqa.supabase.co';
const { supabase } = process.env;

const spabase = createClient(supabaseUrl, supabase);

export default spabase;
