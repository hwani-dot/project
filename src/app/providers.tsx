"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserProfile } from "@/types/fortune";
import { FORTUNE_PROFILE_KEY } from "@/lib/profile";

interface ProfileContextValue {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  loadProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(FORTUNE_PROFILE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as UserProfile;
        setProfileState(p);
      } else {
        setProfileState(null);
      }
    } catch {
      setProfileState(null);
    }
  }, []);

  const setProfile = useCallback((p: UserProfile | null) => {
    setProfileState(p);
    if (typeof window !== "undefined") {
      if (p) localStorage.setItem(FORTUNE_PROFILE_KEY, JSON.stringify(p));
      else localStorage.removeItem(FORTUNE_PROFILE_KEY);
    }
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, loadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
