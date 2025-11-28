import React, { createContext, useContext, useState, useEffect } from 'react';

// ThemeContext - Manages dark/light mode for the entire app
const ThemeContext = createContext();

// Hook to use theme in any component
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// ThemeProvider - Wraps the app and provides theme state
export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage or default to 'light'
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'light';
    });

    // Save theme to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('theme', theme);
        // Update document class for global styling
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Toggle between light and dark
    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Theme colors object for easy access
    const colors = theme === 'dark' ? {
        // Dark mode colors
        bg: '#0f172a',
        bgSecondary: '#1e293b',
        bgTertiary: '#334155',
        text: '#f1f5f9',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        border: '#334155',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        cardBg: '#1e293b',
        inputBg: '#334155',
        inputBorder: '#475569',
    } : {
        // Light mode colors
        bg: '#f8fafc',
        bgSecondary: '#ffffff',
        bgTertiary: '#f1f5f9',
        text: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#64748b',
        border: '#e2e8f0',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        cardBg: '#ffffff',
        inputBg: '#ffffff',
        inputBorder: '#cbd5e1',
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};
