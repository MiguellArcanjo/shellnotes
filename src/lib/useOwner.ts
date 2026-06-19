'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL?.trim().toLowerCase();

function isOwnerUser(user: User | null) {
  return Boolean(user?.email && OWNER_EMAIL && user.email.toLowerCase() === OWNER_EMAIL);
}

export function useOwner() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setIsReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsReady(true);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!OWNER_EMAIL || email.trim().toLowerCase() !== OWNER_EMAIL) return false;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !isOwnerUser(data.user)) {
      if (data.user) await supabase.auth.signOut();
      return false;
    }
    setUser(data.user);
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return {
    user,
    isOwner: isOwnerUser(user),
    isReady,
    login,
    logout,
  };
}
