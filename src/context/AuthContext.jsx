// Import necessary hooks and functions from React.
// createContext: Creates a Context object.
// useContext: Hook to consume the context value.
// useEffect: Hook to perform side effects (like checking auth status on load).
// useState: Hook to manage local state (session, loading).
import { createContext, useContext, useEffect, useState } from 'react';

// Import the initialized Supabase client to interact with the auth service.
import { supabase } from '../services/supabase';

// Create a Context for authentication.
// This will allow us to share the user session and auth functions across the entire component tree.
const AuthContext = createContext({});

// Define a custom hook to easily access the AuthContext.
// This simplifies the usage in other components (e.g., const { session } = useAuth()).
export const useAuth = () => useContext(AuthContext);

// Define the AuthProvider component.
// This component wraps the part of the application that needs access to authentication state.
export const AuthProvider = ({ children }) => {
    // State to hold the current user session.
    // Initialize as null (no user logged in).
    const [session, setSession] = useState(null);

    // State to track if the authentication check is in progress.
    // Initialize as true because we need to check the session when the app starts.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Function to initialize the session state.
        const initSession = async () => {
            // Get the current session from Supabase.
            const { data: { session } } = await supabase.auth.getSession();

            // Update the session state with the retrieved session (or null if none).
            setSession(session ?? null);

            // Set loading to false as the initial check is complete.
            setLoading(false);
        };

        // Call the initialization function.
        initSession();

        // Set up a listener for authentication state changes (e.g., sign in, sign out).
        // The `data` object contains a `subscription` which we can use to unsubscribe later.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            // Update the session state whenever an auth event occurs.
            setSession(session ?? null);
            // Ensure loading is false after an update.
            setLoading(false);
        });

        // Cleanup function: Unsubscribe from the listener when the component unmounts.
        // This prevents memory leaks.
        return () => subscription.unsubscribe();
    }, []); // Empty dependency array means this effect runs only once on mount.

    // Define the value object that will be provided to consumers of this context.
    const value = {
        session,
        loading,
        // Helper function to sign out.
        signOut: () => supabase.auth.signOut(),
    };

    // Render the provider with the value and the children components.
    // If loading is true, we could render a spinner here, but for now we pass it down
    // so individual components can decide how to handle the loading state.
    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : <div style={{ padding: 20 }}>Cargando autenticación...</div>}
        </AuthContext.Provider>
    );
};
