import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentProfile } from '../services/auth';
import type { Profile } from '../types/database';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    profile: null,
    isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch profile whenever session changes
    useEffect(() => {
        async function fetchProfile() {
            if (session?.user) {
                try {
                    const data = await getCurrentProfile();
                    setProfile(data);
                } catch (error) {
                    console.error("Failed to fetch profile:", error);
                }
            } else {
                setProfile(null);
            }
            setIsLoading(false);
        }

        fetchProfile();
    }, [session?.user?.id]); // Depend only on user ID to avoid infinite loops

    return (
        <AuthContext.Provider value={{ session, profile, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
