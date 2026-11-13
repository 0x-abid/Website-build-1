
/* The Grind - Supabase Connection */

const SUPABASE_URL = "https://dyuveqiivnwnnmydhfft.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_utJ2qHk0rBfksn3X_Ls6kQ_bmJjKSpz";

const { createClient } = supabase;

// Main client: Admin login and normal website operations
window.supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Separate client: Public submissions only
// It does not restore or persist the Admin login session.
window.supabaseAnonClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

console.log("The Grind Supabase clients connected");

