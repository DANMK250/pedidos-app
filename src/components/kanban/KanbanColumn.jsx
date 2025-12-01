import React from 'react';
import OrderCard from './OrderCard';
import { useTheme } from '../../context/ThemeContext';

// KanbanColumn Component
// Represents a single column in the Kanban board (e.g., "Creado", "En Proceso").
export default function KanbanColumn({ title, orders, color, onOrderClick, isGrouped }) {
    const { colors, theme } = useTheme();

    // Helper to group orders by advisor
    const groupOrdersByAdvisor = (ordersToGroup) => {
        const groups = {};
        ordersToGroup.forEach(order => {
            const advisor = order.asesora || 'Sin Asesora';
            if (!groups[advisor]) {
                groups[advisor] = [];
            }
            groups[advisor].push(order);
        });
        return groups;
    };

    // Helper component for a collapsible folder
    const AdvisorFolder = ({ advisor, orders }) => {
        const [isOpen, setIsOpen] = React.useState(false);

        // Sort orders: Oldest first
        const sortedOrders = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        return (
            <div style={{ marginBottom: '8px' }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: colors.bgTertiary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: colors.text,
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{isOpen ? '📂' : '📁'}</span>
                        <span>{advisor}</span>
                    </div>
                    <span style={{
                        backgroundColor: colors.primary,
                        color: 'white',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '0.75rem'
                    }}>
                        {orders.length}
                    </span>
                </button>

                {isOpen && (
                    <div style={{
                        padding: '8px 0 8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {sortedOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => onOrderClick && onOrderClick(order)}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render Logic
    const renderContent = () => {
        if (!isGrouped) {
            // Standard List (Not Grouped)
            return (
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
            );
        }

        // Grouped Logic (Accesorios vs Servicio Técnico)
        const accesoriosOrders = orders.filter(o => o.tipo_pedido === 'Accesorios' || o.tipo_pedido === 'accesorios');
        const servicioOrders = orders.filter(o => o.tipo_pedido === 'Servicio Técnico' || o.tipo_pedido === 'servicio tecnico' || o.tipo_pedido === 'Servicio Tecnico');

        // Group by Advisor
        const accesoriosByAdvisor = groupOrdersByAdvisor(accesoriosOrders);
        const servicioByAdvisor = groupOrdersByAdvisor(servicioOrders);

        return (
            <div style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto',
                flex: 1
            }}>
                {/* Section: Accesorios */}
                {Object.keys(accesoriosByAdvisor).length > 0 && (
                    <div>
                        <h4 style={{
                            margin: '0 0 8px 0',
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            letterSpacing: '0.05em'
                        }}>
                            Accesorios
                        </h4>
                        {Object.entries(accesoriosByAdvisor).map(([advisor, advisorOrders]) => (
                            <AdvisorFolder key={advisor} advisor={advisor} orders={advisorOrders} />
                        ))}
                    </div>
                )}

                {/* Section: Servicio Técnico */}
                {Object.keys(servicioByAdvisor).length > 0 && (
                    <div>
                        <h4 style={{
                            margin: '16px 0 8px 0',
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            color: colors.textMuted,
                            letterSpacing: '0.05em'
                        }}>
                            Servicio Técnico
                        </h4>
                        {Object.entries(servicioByAdvisor).map(([advisor, advisorOrders]) => (
                            <AdvisorFolder key={advisor} advisor={advisor} orders={advisorOrders} />
                        ))}
                    </div>
                )}

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
        );
    };

    return (
        <div style={{
            backgroundColor: colors.bgSecondary,
            borderRadius: '12px',
            // minWidth removed to allow CSS control
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

            {/* Content */}
            {renderContent()}
        </div>
    );
}
