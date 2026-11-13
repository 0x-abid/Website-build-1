
/* The Grind - Supabase Connection */

const SUPABASE_URL = "https://dyuveqiivnwnnmydhfft.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_utJ2qHk0rBfksn3X_Ls6kQ_bmJjKSpz";

const { createClient } = supabase;

window.supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("The Grind Supabase connected");

