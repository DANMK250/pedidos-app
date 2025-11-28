import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { updateOrderStatus, supabase } from '../../services/supabase';

// OrderDetailsSidebar Component
// Slide-over sidebar to show full order details, history, and notes.
export default function OrderDetailsSidebar({ isOpen, onClose, order, onUpdateOrder }) {
    const { colors, theme } = useTheme();
    const [activeTab, setActiveTab] = useState('details'); // details, history, notes
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [history, setHistory] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    // Reset state when order changes
    useEffect(() => {
        if (order) {
            setNotes(order.notes || []);
            setHistory(order.history || []);
            setActiveTab('details');
        }
    }, [order]);

    if (!isOpen || !order) return null;

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: order.moneda || 'USD'
        }).format(amount);
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString();
    };

    // Add a new note
    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        const noteObj = {
            content: newNote,
            created_at: new Date().toISOString(),
            created_by: 'Usuario Actual' // Replace with real user name if available
        };

        const updatedNotes = [noteObj, ...notes];

        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ notes: updatedNotes })
                .eq('id', order.id);

            if (error) throw error;

            setNotes(updatedNotes);
            setNewNote('');
            if (onUpdateOrder) onUpdateOrder({ ...order, notes: updatedNotes });
        } catch (err) {
            console.error('Error adding note:', err);
            alert('Error al agregar nota');
        }
    };

    // Change order status
    const handleStatusChange = async (newStatus, reason = '') => {
        if (newStatus === 'Creado' && !reason) {
            const userReason = prompt('Por favor ingresa el motivo de la devolución:');
            if (!userReason) return;
            reason = userReason;
        }

        setIsUpdating(true);
        try {
            // Create history entry
            const historyEntry = {
                status: newStatus,
                previous_status: order.status,
                changed_at: new Date().toISOString(),
                reason: reason
            };

            const updatedHistory = [historyEntry, ...history];

            const { error } = await supabase
                .from('pedidos')
                .update({
                    status: newStatus,
                    history: updatedHistory
                })
                .eq('id', order.id);

            if (error) throw error;

            setHistory(updatedHistory);
            if (onUpdateOrder) onUpdateOrder({ ...order, status: newStatus, history: updatedHistory });

            // If returning to 'Creado', maybe close sidebar or show alert
            if (newStatus === 'Creado') {
                alert('Pedido devuelto exitosamente.');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error al actualizar estado');
        } finally {
            setIsUpdating(false);
        }
    };

    // Styles
    const tabStyle = (tabName) => ({
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: activeTab === tabName ? `2px solid ${colors.primary}` : '2px solid transparent',
        color: activeTab === tabName ? colors.primary : colors.textMuted,
        fontWeight: activeTab === tabName ? '600' : '500',
        transition: 'all 0.2s'
    });

    const sectionStyle = {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    };

    const labelStyle = {
        fontSize: '0.85rem',
        color: colors.textMuted,
        marginBottom: '4px',
        display: 'block'
    };

    const valueStyle = {
        fontSize: '1rem',
        color: colors.text,
        fontWeight: '500'
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    backdropFilter: 'blur(2px)'
                }}
            />

            {/* Sidebar */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '450px',
                maxWidth: '90vw',
                backgroundColor: colors.bgSecondary,
                zIndex: 1001,
                boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: `1px solid ${colors.border}`,
                transition: 'transform 0.3s ease-in-out',
                animation: 'slideIn 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: colors.text }}>
                            Pedido #{order.id}
                        </h2>
                        <div style={{
                            marginTop: '8px',
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor:
                                order.status === 'Creado' ? '#dbeafe' :
                                    order.status === 'En Revisión' ? '#fef9c3' :
                                        order.status === 'Facturado' ? '#ffedd5' : '#dcfce7',
                            color:
                                order.status === 'Creado' ? '#1e40af' :
                                    order.status === 'En Revisión' ? '#854d0e' :
                                        order.status === 'Facturado' ? '#9a3412' : '#166534'
                        }}>
                            {order.status}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: colors.textMuted
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${colors.border}`,
                    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc'
                }}>
                    <div onClick={() => setActiveTab('details')} style={tabStyle('details')}>Detalles</div>
                    <div onClick={() => setActiveTab('history')} style={tabStyle('history')}>Historial</div>
                    <div onClick={() => setActiveTab('notes')} style={tabStyle('notes')}>Notas</div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto' }}>

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div style={sectionStyle}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <span style={labelStyle}>Cliente</span>
                                    <span style={valueStyle}>{order.customer}</span>
                                </div>
                                <div>
                                    <span style={labelStyle}>Asesora</span>
                                    <span style={valueStyle}>{order.asesora}</span>
                                </div>
                                <div>
                                    <span style={labelStyle}>Tipo</span>
                                    <span style={valueStyle}>{order.tipo_pedido}</span>
                                </div>
                                <div>
                                    <span style={labelStyle}>Canal</span>
                                    <span style={valueStyle}>{order.canal || 'N/A'}</span>
                                </div>
                            </div>

                            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
                                <h3 style={{ fontSize: '1rem', color: colors.text, margin: '0 0 12px 0' }}>Ítems ({order.items?.length || 0})</h3>
                                {order.items && order.items.map((item, idx) => (
                                    <div key={idx} style={{
                                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        border: `1px solid ${colors.border}`
                                    }}>
                                        <div style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{item.description}</div>
                                        <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>{item.characteristics}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.9rem' }}>
                                            <span style={{ color: colors.textMuted }}>{item.quantity} x {formatCurrency(item.unitCost)}</span>
                                            <span style={{ fontWeight: '600', color: colors.text }}>{formatCurrency(item.quantity * item.unitCost)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                marginTop: 'auto',
                                backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                                padding: '16px',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: `1px solid ${theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : '#dbeafe'}`
                            }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.primary }}>Total</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.primary }}>
                                    {formatCurrency(order.total)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div style={sectionStyle}>
                            {history.length === 0 ? (
                                <div style={{ textAlign: 'center', color: colors.textMuted, padding: '20px' }}>
                                    No hay historial de cambios.
                                </div>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: '20px' }}>
                                    {/* Vertical Line */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '7px',
                                        top: '10px',
                                        bottom: '10px',
                                        width: '2px',
                                        backgroundColor: colors.border
                                    }} />

                                    {history.map((entry, idx) => (
                                        <div key={idx} style={{ marginBottom: '24px', position: 'relative' }}>
                                            {/* Dot */}
                                            <div style={{
                                                position: 'absolute',
                                                left: '-20px',
                                                top: '4px',
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                backgroundColor: colors.primary,
                                                border: `2px solid ${colors.bgSecondary}`
                                            }} />

                                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: colors.text }}>
                                                Cambio a: {entry.status}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '4px' }}>
                                                {formatDate(entry.changed_at)}
                                            </div>
                                            {entry.reason && (
                                                <div style={{
                                                    backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                                                    color: theme === 'dark' ? '#fca5a5' : '#b91c1c',
                                                    padding: '8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    marginTop: '4px',
                                                    border: `1px solid ${theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fecaca'}`
                                                }}>
                                                    Motivo: {entry.reason}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NOTES TAB */}
                    {activeTab === 'notes' && (
                        <div style={sectionStyle}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Agregar una nota..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: `1px solid ${colors.border}`,
                                        backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                        color: colors.text
                                    }}
                                />
                                <button
                                    onClick={handleAddNote}
                                    style={{
                                        backgroundColor: colors.primary,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0 16px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ➤
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                {notes.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: colors.textMuted, padding: '20px' }}>
                                        No hay notas.
                                    </div>
                                ) : (
                                    notes.map((note, idx) => (
                                        <div key={idx} style={{
                                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: `1px solid ${colors.border}`
                                        }}>
                                            <div style={{ fontSize: '0.95rem', color: colors.text, marginBottom: '6px' }}>
                                                {note.content}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{note.created_by}</span>
                                                <span>{formatDate(note.created_at)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '20px',
                    borderTop: `1px solid ${colors.border}`,
                    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    {order.status === 'Creado' && (
                        <button
                            onClick={() => handleStatusChange('En Revisión')}
                            disabled={isUpdating}
                            style={{
                                backgroundColor: '#eab308',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                flex: 1
                            }}
                        >
                            Enviar a Revisión
                        </button>
                    )}

                    {order.status === 'En Revisión' && (
                        <>
                            <button
                                onClick={() => handleStatusChange('Creado')}
                                disabled={isUpdating}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                Devolver
                            </button>
                            <button
                                onClick={() => handleStatusChange('Facturado')}
                                disabled={isUpdating}
                                style={{
                                    backgroundColor: '#f97316',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                Aprobar (Facturar)
                            </button>
                        </>
                    )}

                    {order.status === 'Facturado' && (
                        <>
                            <button
                                onClick={() => handleStatusChange('Creado')}
                                disabled={isUpdating}
                                style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                Devolver
                            </button>
                            <button
                                onClick={() => handleStatusChange('Finalizado')}
                                disabled={isUpdating}
                                style={{
                                    backgroundColor: '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                Finalizar Pedido
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
