const SUPABASE_URL =
  "https://qhqqepupdzgkkgjwtyww.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_yuLEqMbJARvU1WX5ybK_Ug_6CxqJoO1";

window.supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

/* Compatibilidade com páginas que usam este nome */
window.katosSupabase =
  window.supabaseClient;