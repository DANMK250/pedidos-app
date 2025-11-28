import React from 'react';
import OrderCard from './OrderCard';
import { useTheme } from '../../context/ThemeContext';

// KanbanColumn Component
// Represents a single column in the Kanban board (e.g., "Creado", "En Proceso").
export default function KanbanColumn({ title, orders, color, onOrderClick }) {
    const { colors, theme } = useTheme();

    return (
        <div style={{
            backgroundColor: colors.bgSecondary,
            borderRadius: '12px',
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            {/* Column Header */}
            <div style={{
                padding: '16px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: color
                    }} />
                    <h3 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: colors.text
                    }}>
                        {title}
                    </h3>
                </div>
                <span style={{
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: colors.textSecondary
                }}>
                    {orders.length}
                </span>
            </div>

            {/* Orders List */}
            <div style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
                flex: 1
            }}>
                {orders.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => onOrderClick && onOrderClick(order)}
                    />
                ))}
                {orders.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: colors.textMuted,
                        fontSize: '0.9rem',
                        padding: '20px',
                        border: `2px dashed ${colors.border}`,
                        borderRadius: '8px'
                    }}>
                        Sin pedidos
                    </div>
                )}
            </div>
        </div>
    );
}
