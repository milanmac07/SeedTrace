const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDAHead() {
  const { data, error } = await supabase
    .from('seedtrace_users')
    .insert([
      {
        full_name: 'Mark Anthony Milanay',
        email: 'milan07@gmail.com', // Change email
        password: 'milan@07',   // Change password
        role: 'da_head',
      },
    ])
    .select();

  if (error) {
    console.error('Error creating DA Head:', error.message);
  } else {
    console.log('DA Head created successfully:', data);
  }
}

createDAHead();