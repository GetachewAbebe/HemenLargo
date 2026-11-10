import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("your-project")
);

// A request that hangs on a poor connection would hold up the sync outbox. Give up after
// REQUEST_TIMEOUT_MS so the change stays queued and is retried later.
const REQUEST_TIMEOUT_MS = 20_000;

export const fetchWithTimeout = (input, init = {}) => {
  if (typeof AbortSignal === "undefined" || typeof AbortSignal.timeout !== "function") {
    return fetch(input, init);
  }
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal =
    init.signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([init.signal, timeout])
      : init.signal || timeout;
  return fetch(input, { ...init, signal });
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: fetchWithTimeout } })
  : null;
