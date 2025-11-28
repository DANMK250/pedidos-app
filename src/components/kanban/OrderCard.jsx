import React from 'react';
import { useTheme } from '../../context/ThemeContext';

// OrderCard Component
// Displays individual order details in a card format.
// Props:
// - order: Object containing order details (id, customer, items, price, status, tags)
// - onClick: Function to handle click events
export default function OrderCard({ order, onClick }) {
    const { colors, theme } = useTheme();

    // Define border color based on status for visual distinction
    const getStatusColor = (status) => {
        switch (status) {
            case 'Creado': return '#3b82f6'; // Blue
            case 'En Revisión': return '#eab308'; // Yellow
            case 'Facturado': return '#f97316'; // Orange
            case 'Finalizado': return '#22c55e'; // Green
            default: return '#cbd5e1'; // Gray
        }
    };

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: theme === 'dark' ? colors.cardBg : 'white',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid ${getStatusColor(order.status)}`,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
        >
            {/* Order Header: ID and Customer Name */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: '600' }}>
                        #{order.id}
                    </span>
                </div>
                <div style={{
                    backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                    color: '#3b82f6',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                }}>
                    {order.customer}
                </div>
            </div>

            {/* Order Body: Items and Price */}
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: colors.text }}>
                Pedido - {order.itemCount} ítem(s)
            </h4>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981', marginBottom: '12px' }}>
                USD {order.price}
            </div>

            {/* Order Footer: Tags/Services */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {order.tags && order.tags.map((tag, index) => {
                    if (!tag) return null; // Skip null tags

                    // Color based on tag type
                    const isServicioTecnico = tag.toLowerCase().includes('servicio') || tag.toLowerCase().includes('técnico');
                    const bgColor = isServicioTecnico ? (theme === 'dark' ? 'rgba(30, 64, 175, 0.2)' : '#dbeafe') : (theme === 'dark' ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2');
                    const textColor = isServicioTecnico ? (theme === 'dark' ? '#93c5fd' : '#1e40af') : (theme === 'dark' ? '#fca5a5' : '#dc2626');

                    return (
                        <span key={index} style={{
                            backgroundColor: bgColor,
                            color: textColor,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '500'
                        }}>
                            {/* Simple icon placeholder */}
                            <span>🏷️</span> {tag}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
