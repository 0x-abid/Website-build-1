/* The Grind - Supabase Connection */

const SUPABASE_URL = "https://dyuveqiivnwnnmydhfft.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_utJ2qHk0rBfksn3X_Ls6kQ_bmJjKSpz";

const { createClient } = supabase;

// Normal client: Admin login and dashboard
window.supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Public client: Always uses the anonymous session
window.supabasePublicClient = createClient(
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

console.log("The Grind Supabase connected");
