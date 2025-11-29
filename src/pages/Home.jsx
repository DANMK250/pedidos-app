import React from 'react';
import DashboardHeader from '../components/DashboardHeader';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { useTheme } from '../context/ThemeContext';

// Home Page
// Replaces the old list view with the new Kanban Board layout.
export default function Home() {
    const { colors } = useTheme();
    const [showFilters, setShowFilters] = React.useState(false);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.bg
        }}>
            {/* Top Header */}
            <DashboardHeader />

            {/* Filter Bar */}
            <div className="mobile-flex-col mobile-p-4" style={{
                display: 'flex',
                gap: '12px',
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: 'transparent',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                {/* Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <span style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '1rem'
                        }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar pedidos..."
                            className="mobile-w-full"
                            style={{
                                padding: '10px 12px 10px 36px',
                                borderRadius: '8px',
                                border: `1px solid ${colors.inputBorder}`,
                                width: '100%',
                                fontSize: '0.95rem',
                                backgroundColor: colors.inputBg,
                                color: colors.text,
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>



                {/* Filter Toggle Button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        backgroundColor: showFilters ? colors.primary : colors.bgTertiary,
                        color: showFilters ? 'white' : colors.textSecondary,
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}>
                    ⚙ Filtros
                </button>

                {/* Filter Dropdowns - Hidden by default on mobile */}
                {showFilters && (
                    <>
                        <select className="mobile-w-full" style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.inputBorder}`,
                            fontSize: '0.9rem',
                            backgroundColor: colors.inputBg,
                            color: colors.textSecondary,
                            cursor: 'pointer'
                        }}>
                            <option value="">Cliente</option>
                            <option value="todos">Todos los clientes</option>
                        </select>

                        <select className="mobile-w-full" style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.inputBorder}`,
                            fontSize: '0.9rem',
                            backgroundColor: colors.inputBg,
                            color: colors.textSecondary,
                            cursor: 'pointer'
                        }}>
                            <option value="">Asesora</option>
                            <option value="todas">Todas las asesoras</option>
                            <option value="alexandra">Alexandra Duarte</option>
                            <option value="dimayir">Dimayir Perez</option>
                            <option value="brigith">Brigith Ortiz</option>
                        </select>

                        <select className="mobile-w-full" style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.inputBorder}`,
                            fontSize: '0.9rem',
                            backgroundColor: colors.inputBg,
                            color: colors.textSecondary,
                            cursor: 'pointer'
                        }}>
                            <option value="">Asignado a</option>
                            <option value="todos">Todos los asignados</option>
                        </select>
                    </>
                )}
            </div>

            {/* Main Kanban Board Area */}
            <main style={{ flex: 1, overflow: 'hidden' }}>
                <KanbanBoard />
            </main>
        </div>
    );
}
