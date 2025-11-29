import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simplified initialization - just get the session, don't fetch profile yet
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // After login, try to fetch the user's role
            if (session?.user && _event === 'SIGNED_IN') {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (profile) {
                        session.user.role = profile.role || 'user';
                    } else {
                        session.user.role = 'user';
                    }
                } catch (err) {
                    console.warn('Could not fetch profile:', err);
                    session.user.role = 'user';
                }
            }

            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        session,
        loading,
        signOut: () => supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : <div style={{ padding: 20 }}>Cargando autenticación...</div>}
        </AuthContext.Provider>
    );
};
