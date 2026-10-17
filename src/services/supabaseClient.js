import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://glssskdgodxkrthncigr.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_zhnNlG54uiLtM6Q7PYY37Q_md7dFaVm";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
