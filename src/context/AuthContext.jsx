import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Function to initialize the session state.
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                let userRole = 'user';
                if (session?.user) {
                    try {
                        const { data: profile, error } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single();

                        if (error) {
                            console.warn('Could not fetch user profile:', error);
                        } else {
                            userRole = profile?.role || 'user';
                        }
                    } catch (profileError) {
                        console.warn('Error fetching profile, defaulting to user role:', profileError);
                    }
                }

                setSession(session ? { ...session, user: { ...session.user, role: userRole } } : null);
            } catch (error) {
                console.error('Error initializing session:', error);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            let userRole = 'user';
            if (session?.user) {
                try {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        console.warn('Could not fetch user profile:', error);
                    } else {
                        userRole = profile?.role || 'user';
                    }
                } catch (profileError) {
                    console.warn('Error fetching profile, defaulting to user role:', profileError);
                }
            }

            setSession(session ? { ...session, user: { ...session.user, role: userRole } } : null);
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
