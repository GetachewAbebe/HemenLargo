import { supabase } from "./supabaseClient";

// A password-reset link signs the user in and fires PASSWORD_RECOVERY once, during
// client start-up. Listen at module load (before React mounts) so it isn't missed.
let passwordRecoveryPending =
  typeof window !== "undefined" && /type=recovery/.test(window.location.hash || "");
const recoveryListeners = new Set();
if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      passwordRecoveryPending = true;
      recoveryListeners.forEach((listener) => listener(true));
    }
  });
}

export const isPasswordRecoveryPending = () => passwordRecoveryPending;

export const subscribeToPasswordRecovery = (listener) => {
  recoveryListeners.add(listener);
  return () => recoveryListeners.delete(listener);
};

const authRedirectUrl = () => new URL(import.meta.env.BASE_URL, window.location.href).toString();

export const requestPasswordReset = async (email) => {
  if (!supabase) {
    return { success: false, error: "Cloud authentication is not configured. Set the Supabase environment variables." };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: authRedirectUrl(),
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const completePasswordReset = async (newPassword) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  passwordRecoveryPending = false;
  recoveryListeners.forEach((listener) => listener(false));
  if (typeof window !== "undefined" && window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
};

const clearLegacyCredentials = () => {
  try {
    localStorage.removeItem("sukie_users_list_v1");
    localStorage.removeItem("sukie_active_session_v1");
  } catch (error) {
    console.error("Could not remove deprecated local authentication data:", error);
  }
};

export const getCachedShopId = (userId) => localStorage.getItem(`sukie_active_shop_v1:${userId}`);

export const cacheShopId = (userId, shopId) => {
  localStorage.setItem(`sukie_active_shop_v1:${userId}`, shopId);
};

const mapAuthUser = (user) => {
  if (!user) return null;
  const metadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email || "",
    fullName: metadata.full_name || "",
    shopName: metadata.shop_name || "",
    phone: metadata.phone || "",
    role: "Owner",
  };
};

export const getActiveSession = async () => {
  clearLegacyCredentials();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return mapAuthUser(data.session?.user);
};

export const subscribeToAuthChanges = (onChange) => {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = mapAuthUser(session?.user);
    queueMicrotask(() => onChange(user));
  });
  return () => data.subscription.unsubscribe();
};

export const loginUser = async (email, password) => {
  if (!supabase) {
    return { success: false, error: "Cloud authentication is not configured. Set the Supabase environment variables." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, user: mapAuthUser(data.user) };
};

export const registerUser = async ({ email, password, fullName, shopName, phone }) => {
  if (!supabase) {
    return { success: false, error: "Cloud authentication is not configured. Set the Supabase environment variables." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: authRedirectUrl(),
      data: {
        full_name: fullName.trim(),
        shop_name: shopName.trim(),
        phone: phone.trim(),
      },
    },
  });

  if (error) return { success: false, error: error.message };
  return {
    success: true,
    confirmationRequired: !data.session,
    user: mapAuthUser(data.user),
  };
};

export const ensureUserShop = async (shopName) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("ensure_user_shop", {
    p_shop_name: shopName || "Sukie Liquid Soap",
  });
  if (error) throw error;
  return data;
};

export const logoutUser = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const updateActiveUserProfile = async (updates) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const userMetadata = {};
  if (updates.fullName !== undefined) userMetadata.full_name = updates.fullName;
  if (updates.shopName !== undefined) userMetadata.shop_name = updates.shopName;
  if (updates.phone !== undefined) userMetadata.phone = updates.phone;

  const { data, error } = await supabase.auth.updateUser({ data: userMetadata });
  if (error) throw error;
  return mapAuthUser(data.user);
};
