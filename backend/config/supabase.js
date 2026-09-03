const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    '❌ Missing Supabase credentials. Please check your .env file:\n' +
    '   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
  );
}

// Use Service Role Key on the backend → bypasses Row Level Security
// This is safe because this client is NEVER exposed to the frontend
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
