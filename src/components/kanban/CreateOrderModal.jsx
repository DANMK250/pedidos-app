import React, { useState, useEffect } from 'react';
import { createOrder } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';

// CreateOrderModal Component
// Modal for creating a new order with dynamic items and automatic calculations.
export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }) {
    const { colors, theme } = useTheme();

    if (!isOpen) return null;

    // State for form fields
    const [asesora, setAsesora] = useState('');
    const [items, setItems] = useState([{ id: 1, description: '', characteristics: '', quantity: 1, unitCost: 0 }]);
    const [canal, setCanal] = useState('Otro');
    const [moneda, setMoneda] = useState('USD');
    const [tipoPedido, setTipoPedido] = useState('Accesorios');
    const [total, setTotal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate total whenever items change
    useEffect(() => {
        const newTotal = items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitCost);
        }, 0);
        setTotal(newTotal);
    }, [items]);

    // Add a new item row
    const addItem = () => {
        setItems([...items, { id: Date.now(), description: '', characteristics: '', quantity: 1, unitCost: 0 }]);
    };

    // Remove an item row
    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    // Update item fields
    const updateItem = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Handle form submission
    const handleSubmit = async () => {
        // Validation
        if (!asesora) {
            alert('Por favor selecciona una asesora');
            return;
        }

        if (items.length === 0 || items.every(item => !item.description)) {
            alert('Por favor agrega al menos un ítem con descripción');
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare order data
            const orderData = {
                asesora,
                items: items.filter(item => item.description), // Only include items with description
                total,
                tipoPedido,
                canal,
                moneda
            };

            // Create order in Supabase
            const { data, error } = await createOrder(orderData);

            if (error) {
                console.error('Error creating order:', error);
                alert('Error al crear el pedido: ' + error.message);
                return;
            }

            // Success!
            alert('¡Pedido creado exitosamente!');

            // Reset form
            setAsesora('');
            setItems([{ id: 1, description: '', characteristics: '', quantity: 1, unitCost: 0 }]);
            setCanal('Otro');
            setMoneda('USD');
            setTipoPedido('Accesorios');

            // Notify parent component
            if (onOrderCreated) {
                onOrderCreated(data[0]);
            }

            // Close modal
            onClose();
        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Error inesperado al crear el pedido');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Common styles
    const inputStyle = {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
        backgroundColor: theme === 'dark' ? '#334155' : 'white',
        color: colors.text,
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        boxSizing: 'border-box'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '500',
        fontSize: '0.9rem',
        color: colors.text
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                backgroundColor: colors.bgSecondary,
                borderRadius: '8px',
                width: '700px',
                maxWidth: '95%',
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: theme === 'dark' ? `1px solid ${colors.border}` : 'none'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: colors.text }}>Crear Nuevo Pedido</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: colors.textMuted }}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Asesora */}
                    <div>
                        <label style={labelStyle}>Asesora *</label>
                        <select
                            value={asesora}
                            onChange={(e) => setAsesora(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">Seleccionar asesora</option>
                            <option value="Alexandra Duarte">Alexandra Duarte</option>
                            <option value="Dimayir Perez">Dimayir Perez</option>
                            <option value="Brigith Ortiz">Brigith Ortiz</option>
                        </select>
                    </div>

                    {/* PDF Upload */}
                    <div>
                        <label style={labelStyle}>Archivo PDF del Pedido</label>
                        <div style={{
                            border: `2px dashed ${colors.border}`,
                            borderRadius: '8px',
                            padding: '32px',
                            textAlign: 'center',
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ fontSize: '2rem', color: colors.textMuted, marginBottom: '8px' }}>⬆️</div>
                            <div style={{ fontWeight: '500', color: colors.text }}>Haz clic para adjuntar PDF</div>
                            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>Solo archivos PDF (opcional)</div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.95rem', color: colors.text }}>Ítems del Pedido *</label>
                            <button
                                onClick={addItem}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: colors.primary,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                }}
                            >
                                + Agregar ítem
                            </button>
                        </div>

                        {items.map((item) => (
                            <div key={item.id} style={{
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '12px',
                                border: `1px solid ${colors.border}`
                            }}>
                                {/* First Row: Description and Characteristics */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyle, fontSize: '0.8rem', color: colors.textMuted }}>
                                            Código y Descripción
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: FORR-272 - Forro para iPhone"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyle, fontSize: '0.8rem', color: colors.textMuted }}>
                                            Características
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Color rojo, estampado"
                                            value={item.characteristics || ''}
                                            onChange={(e) => updateItem(item.id, 'characteristics', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                {/* Second Row: Quantity, Unit Cost, Subtotal, Delete */}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyle, fontSize: '0.8rem', color: colors.textMuted }}>
                                            Cantidad
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity === 0 ? '' : item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyle, fontSize: '0.8rem', color: colors.textMuted }}>
                                            Costo Unitario
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={item.unitCost === 0 ? '' : item.unitCost}
                                            onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyle, fontSize: '0.8rem', color: colors.textMuted }}>
                                            Subtotal
                                        </label>
                                        <div style={{
                                            padding: '10px',
                                            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#f1f5f9',
                                            borderRadius: '6px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            color: colors.text,
                                            border: `1px solid ${colors.border}`
                                        }}>
                                            ${(item.quantity * item.unitCost).toFixed(2)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        disabled={items.length === 1}
                                        style={{
                                            padding: '10px 12px',
                                            backgroundColor: items.length === 1 ? (theme === 'dark' ? '#334155' : '#f1f5f9') : '#fee2e2',
                                            color: items.length === 1 ? colors.textMuted : '#dc2626',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Fields Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Canal</label>
                            <select
                                value={canal}
                                onChange={(e) => setCanal(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Otro">Otro</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Presencial">Presencial</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Moneda</label>
                            <select
                                value={moneda}
                                onChange={(e) => setMoneda(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="USD">USD</option>
                                <option value="COP">COP</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo de Pedido</label>
                            <select
                                value={tipoPedido}
                                onChange={(e) => setTipoPedido(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Accesorios">Accesorios</option>
                                <option value="Servicio Técnico">Servicio Técnico</option>
                            </select>
                        </div>
                    </div>

                    {/* Total */}
                    <div style={{
                        backgroundColor: theme === 'dark' ? 'rgba(37, 99, 235, 0.1)' : '#f0f9ff',
                        padding: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: `1px solid ${theme === 'dark' ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe'}`
                    }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.primary }}>Total</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.primary }}>
                            {moneda} ${total.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'transparent',
                            color: colors.textMuted,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            opacity: isSubmitting ? 0.5 : 1
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isSubmitting ? colors.textMuted : colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}
                    >
                        {isSubmitting ? 'Creando...' : 'Crear Pedido'}
                    </button>
                </div>
            </div>
        </div>
    );
}
