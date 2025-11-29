import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CreateOrderModal from './kanban/CreateOrderModal';
import { Link } from 'react-router-dom';

// DashboardHeader Component
// Top navigation bar with user info and actions.
export default function DashboardHeader() {
    const { session, signOut } = useAuth();
    const { theme, toggleTheme, colors } = useTheme();
    const userEmail = session?.user?.email || 'Daniel Armas'; // Fallback for mock
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <header className="mobile-flex-col" style={{
                backgroundColor: colors.bgSecondary,
                padding: '16px 24px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
                {/* Left Side: Title and Subtitle */}
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', color: colors.text, fontWeight: '700' }}>
                        Tablero CRM de Pedidos
                    </h1>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: colors.textMuted }}>
                        Gestiona pedidos con asignaciones de asesoras a través del flujo de trabajo
                    </p>
                </div>

                {/* Right Side: User Profile and Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        style={{
                            backgroundColor: theme === 'dark' ? '#fbbf24' : '#1e293b',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#fcd34d' : '#334155';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#fbbf24' : '#1e293b';
                        }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {/* User Info */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: colors.primary,
                        padding: '6px 12px',
                        borderRadius: '6px'
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                        }}>
                            👤
                        </div>
                        <div className="mobile-hidden-text" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white' }}>{userEmail}</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>Tecnología</span>
                        </div>
                    </div>

                    {/* Admin Panel Button (only for admins) */}
                    {session?.user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            style={{
                                textDecoration: 'none',
                                backgroundColor: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                padding: '8px 12px',
                                fontSize: '0.85rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            ⚙️ <span className="mobile-hidden-text">Admin</span>
                        </Link>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={signOut}
                        style={{
                            backgroundColor: 'transparent',
                            color: colors.textMuted,
                            border: `1px solid ${colors.border}`,
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        ↪ <span className="mobile-hidden-text">Salir</span>
                    </button>

                    {/* New Order Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            backgroundColor: colors.primary,
                            color: 'white',
                            padding: '8px 16px',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        + <span className="mobile-hidden-text">Nuevo Pedido</span>
                    </button>
                </div>
            </header>

            {/* Create Order Modal */}
            <CreateOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onOrderCreated={() => {
                    // Refresh the board
                    window.location.reload();
                }}
            />
        </>
    );
}
