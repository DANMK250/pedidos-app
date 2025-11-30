import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety timeout: Force loading to false after 5 seconds
        const safetyTimeout = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn('⚠️ Auth loading timed out! Forcing app to load.');
                    return false;
                }
                return prev;
            });
        }, 5000);

        const initSession = async () => {
            console.log('🔄 initSession started');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('Session retrieved:', session?.user?.email);

                if (session?.user) {
                    // Fetch profile from profiles table
                    console.log('Fetching profile for:', session.user.id);
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role, cedula, first_name, last_name')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (error) console.error('Profile fetch error:', error);
                    console.log('Profile found:', profile);

                    if (profile) {
                        // Create a NEW session object to ensure React detects the change
                        const newSession = {
                            ...session,
                            user: {
                                ...session.user,
                                role: profile.role || 'user',
                                cedula: profile.cedula,
                                first_name: profile.first_name,
                                last_name: profile.last_name
                            }
                        };
                        setSession(newSession);
                        return; // Exit to avoid setting session twice
                    }
                }

                setSession(session);
            } catch (error) {
                console.error('Error initializing session:', error);
            } finally {
                console.log('✅ initSession finished');
                setLoading(false);
                clearTimeout(safetyTimeout);
            }
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('Auth event:', _event);

            if (_event === 'SIGNED_OUT') {
                setSession(null);
                setLoading(false);
                return;
            }

            // After login, fetch the user's role
            if (session?.user && _event === 'SIGNED_IN') {
                console.log('SIGNED_IN event, fetching profile...');
                try {
                    // Create a promise that rejects after 2 seconds
                    const fetchProfilePromise = supabase
                        .from('profiles')
                        .select('role, cedula, first_name, last_name')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
                    );

                    // Race the fetch against the timeout
                    const { data: profile } = await Promise.race([fetchProfilePromise, timeoutPromise]);

                    if (profile) {
                        const newSession = {
                            ...session,
                            user: {
                                ...session.user,
                                role: profile.role || 'user',
                                cedula: profile.cedula,
                                first_name: profile.first_name,
                                last_name: profile.last_name
                            }
                        };
                        setSession(newSession);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.warn('Profile fetch failed or timed out:', err);
                    // Fallback: proceed with basic session
                }
            }

            setSession(session);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const refreshSession = async () => {
        if (!session?.user) return;

        setLoading(true);
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, cedula, first_name, last_name')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profile) {
                const newSession = {
                    ...session,
                    user: {
                        ...session.user,
                        role: profile.role || 'user',
                        cedula: profile.cedula,
                        first_name: profile.first_name,
                        last_name: profile.last_name
                    }
                };
                setSession(newSession);
                console.log('Session refreshed:', newSession);
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        session,
        loading,
        signOut: () => supabase.auth.signOut(),
        refreshSession,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#1e293b',
                    color: 'white',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <p>Cargando autenticación...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
};
