// Authentication (Supabase Auth). Farmers can stay guests — checkout never
// requires an account. Dealers sign in so their listings/orders tie to them.
//
// A `profiles` row (created on sign-up) holds role ('farmer'|'dealer') and the
// dealer's business name. See AUTH_SCHEMA.sql. All calls degrade gracefully if
// auth isn't configured yet.
import { supabase } from "./supabase";

export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch { return null; }
}

export function onAuthChange(cb) {
  try {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session));
    return () => data?.subscription?.unsubscribe?.();
  } catch { return () => {}; }
}

export async function getProfile(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase.from("profiles").select("id, role, dealer_name, email").eq("id", userId).single();
    return data || null;
  } catch { return null; }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp({ email, password, role = "farmer", dealerName = "" }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const uid = data?.user?.id;
  if (uid) {
    // Create the profile (RLS lets a user insert their own row).
    try {
      await supabase.from("profiles").upsert(
        { id: uid, role, dealer_name: role === "dealer" ? dealerName : null, email },
        { onConflict: "id" }
      );
    } catch { /* profile creation best-effort; can be retried on first sign-in */ }
  }
  return data;
}

export async function signOut() {
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
}
