import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function getAuthErrorMessage(error) {
  if (!hasSupabaseConfig) {
    return "חסרים פרטי החיבור ל-Supabase. ודאו שהוגדרו VITE_SUPABASE_URL ו-VITE_SUPABASE_PUBLISHABLE_KEY.";
  }

  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("invalid login credentials")) {
    return "האימייל או הסיסמה אינם נכונים.";
  }

  if (message.includes("user already registered") || message.includes("already exists")) {
    return "כבר קיים חשבון עם כתובת האימייל הזו.";
  }

  if (message.includes("password")) {
    return "הסיסמה אינה עומדת בדרישות האבטחה של Supabase.";
  }

  return error?.message ?? "אירעה שגיאה. נסו שוב בעוד רגע.";
}

function toSafeUser(authUser, profile) {
  if (!authUser) return null;

  return {
    id: authUser.id,
    email: authUser.email,
    fullName: profile?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email,
    createdAt: profile?.created_at ?? authUser.created_at,
    updatedAt: profile?.updated_at ?? authUser.updated_at,
  };
}

async function fetchProfile(authUser) {
  if (!authUser || !supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at, updated_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function upsertProfile(authUser, fullName) {
  if (!authUser || !supabase) return null;

  const profile = {
    id: authUser.id,
    full_name: fullName.trim(),
    email: authUser.email,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select("id, full_name, email, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      return null;
    }

    const profile = await fetchProfile(authUser);
    const safeUser = toSafeUser(authUser, profile);
    setUser(safeUser);
    return safeUser;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!supabase) {
        if (isMounted) setIsLoading(false);
        return;
      }

      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error || !authUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        await loadUser(authUser);
      } catch {
        setUser(toSafeUser(authUser, null));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    bootstrap();

    if (!supabase) {
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      loadUser(session.user)
        .catch(() => setUser(toSafeUser(session.user, null)))
        .finally(() => setIsLoading(false));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const register = async ({ fullName, email, password }) => {
    if (!supabase) {
      throw new Error(getAuthErrorMessage());
    }

    const cleanName = fullName.trim();
    const cleanEmail = normalizeEmail(email);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      throw new Error(getAuthErrorMessage(error));
    }

    if (!data.session) {
      throw new Error("ההרשמה נוצרה. אשרו את האימייל ב-Supabase כדי להתחבר.");
    }

    const profile = await upsertProfile(data.user, cleanName);
    const safeUser = toSafeUser(data.user, profile);
    setUser(safeUser);
    return safeUser;
  };

  const login = async ({ email, password }) => {
    if (!supabase) {
      throw new Error(getAuthErrorMessage());
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) {
      throw new Error(getAuthErrorMessage(error));
    }

    return loadUser(data.user);
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
  };

  const updateProfile = async ({ fullName }) => {
    if (!user || !supabase) {
      throw new Error("צריך להתחבר כדי לעדכן פרופיל.");
    }

    const cleanName = fullName.trim();
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: cleanName, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id, full_name, email, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(getAuthErrorMessage(error));
    }

    const nextUser = toSafeUser({ ...user, user_metadata: { full_name: cleanName } }, data);
    setUser(nextUser);
    return nextUser;
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      register,
      login,
      logout,
      updateProfile,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
