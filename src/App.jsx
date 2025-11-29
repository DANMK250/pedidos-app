// Import React Router components for handling navigation.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Import the AuthProvider and useAuth hook.
import { AuthProvider, useAuth } from './context/AuthContext';
// Import page components.
import Login from './pages/Login';
import Home from './pages/Home';
// Import ThemeProvider for dark mode
import { ThemeProvider } from './context/ThemeContext';

// Define a wrapper component for protected routes.
// This component checks if a user is authenticated.
// If yes, it renders the children (the protected page).
// If no, it redirects to the login page.
const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  // If auth state is still loading, show nothing or a spinner.
  if (loading) return <div>Cargando...</div>;

  // If no session exists, redirect to /login.
  if (!session) return <Navigate to="/login" replace />;

  // If authenticated, render the protected content.
  return children;
};

// Define a wrapper for public routes (like Login).
// If the user is already logged in, they shouldn't see the login page again.
const PublicRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  // If session exists, redirect to home (/).
  if (session) return <Navigate to="/" replace />;

  return children;
};

// Main App Component.
export default function App() {
  return (
    // Wrap the entire app in the ThemeProvider for dark mode support
    <ThemeProvider>
      {/* Wrap the entire app in the AuthProvider to make auth state available everywhere. */}
      <AuthProvider>
        {/* Set up the BrowserRouter for handling URL routing. */}
        <BrowserRouter>
          <Routes>
            {/* Route for the Login page. Wrapped in PublicRoute to redirect if already logged in. */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            {/* Route for the Home page (root path). Wrapped in ProtectedRoute to ensure authentication. */}
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />

            {/* Fallback route: Redirect any unknown paths to Home (which will redirect to Login if needed). */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
