const { createClient } = require('@supabase/supabase-js');
const { env } = require('../../config/env');

let _sb;

function getSupabase() {
  if (_sb) return _sb;
  _sb = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  return _sb;
}

module.exports = { getSupabase };

