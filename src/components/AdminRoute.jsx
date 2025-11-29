import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AdminRoute Component
 * Protects routes that should only be accessible to admin users.
 * Redirects non-admin users to the home page.
 */
export default function AdminRoute({ children }) {
    const { session, loading } = useAuth();

    // If auth state is still loading, show spinner
    if (loading) return <div>Cargando...</div>;

    // If no session exists, redirect to login
    if (!session) return <Navigate to="/login" replace />;

    // If user is not admin, redirect to home
    if (session.user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // If admin, render the protected content
    return children;
}
