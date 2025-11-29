import React, { useState, useEffect, useRef } from 'react';
import { createOrder, searchProducts, getAsesoras, getClientesByAdvisor, supabase } from '../../services/supabase';
import { useTheme } from '../../context/ThemeContext';
import SearchableSelect from '../common/SearchableSelect';
import { fixEncoding, normalizeForSearch } from '../../utils/stringUtils';

// CreateOrderModal Component
// Modal for creating a new order with dynamic items and automatic calculations.
export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }) {
    const { colors, theme } = useTheme();

    if (!isOpen) return null;

    // State for form fields
    const [asesora, setAsesora] = useState('');
    const [cliente, setCliente] = useState(''); // New client state
    const [items, setItems] = useState([{ id: 1, description: '', characteristics: '', quantity: 1, unitCost: 0 }]);
    const [canal, setCanal] = useState('Otro');
    const [moneda, setMoneda] = useState('USD');
    const [tipoPedido, setTipoPedido] = useState('Accesorios');
    const [total, setTotal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientData, setNewClientData] = useState({
        client_name: '',
        business_name: '',
        rif_cedula: '',
        phone: '',
        address: ''
    });

    // Data State
    const [asesorasList, setAsesorasList] = useState([]);
    const [clientesList, setClientesList] = useState([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState({}); // { itemId: [products] }
    const wrapperRef = useRef(null);

    // Load Asesoras on mount
    useEffect(() => {
        async function loadAsesoras() {
            const { data, error } = await getAsesoras();
            if (!error && data) {
                setAsesorasList(data);
            }
        }
        loadAsesoras();
    }, []);

    // Load Clientes when Asesora changes
    useEffect(() => {
        async function loadClientes() {
            if (!asesora) {
                setClientesList([]);
                setCliente('');
                return;
            }

            setIsLoadingClients(true);
            const { data, error } = await getClientesByAdvisor(asesora);
            setIsLoadingClients(false);

            if (!error && data) {
                setClientesList(data);
            }
        }
        loadClientes();
    }, [asesora]);

    // Calculate total whenever items change
    useEffect(() => {
        const newTotal = items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitCost);
        }, 0);
        setTotal(newTotal);
    }, [items]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setSuggestions({});
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

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
    const updateItem = async (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));

        // Autocomplete Logic
        if (field === 'description') {
            if (value.length > 1) {
                const { data, error } = await searchProducts(value);
                if (!error && data) {
                    setSuggestions(prev => ({ ...prev, [id]: data }));
                }
            } else {
                setSuggestions(prev => ({ ...prev, [id]: [] }));
            }
        }
    };

    // Select a product from suggestions
    const selectProduct = (itemId, product) => {
        setItems(items.map(item =>
            item.id === itemId ? {
                ...item,
                description: `${product.codigo} - ${product.prd_descripcion}`,
                // characteristics: product.prd_descripcion // Optional: pre-fill characteristics
            } : item
        ));
        setSuggestions(prev => ({ ...prev, [itemId]: [] }));
    };

    // Handle new client creation
    const handleCreateClient = async () => {
        if (!newClientData.client_name) {
            alert('El nombre del cliente es obligatorio');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('clientes')
                .insert([{
                    ...newClientData,
                    advisor_id: asesora
                }])
                .select()
                .single();

            if (error) throw error;

            // Add to list and select it
            setClientesList([...clientesList, data]);
            setCliente(data.id);
            setIsCreatingClient(false);
            setNewClientData({
                client_name: '',
                business_name: '',
                rif_cedula: '',
                phone: '',
                address: ''
            });
            alert('Cliente creado exitosamente');
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Error al crear cliente: ' + error.message);
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        // Validation
        if (!asesora) {
            alert('Por favor selecciona una asesora');
            return;
        }

        if (!cliente) {
            alert('Por favor selecciona un cliente');
            return;
        }

        if (items.length === 0 || items.every(item => !item.description)) {
            alert('Por favor agrega al menos un ítem con descripción');
            return;
        }

        setIsSubmitting(true);

        try {
            // Get advisor name for display (since we store ID)
            const selectedAdvisorObj = asesorasList.find(a => a.id === asesora);
            const advisorName = selectedAdvisorObj ? selectedAdvisorObj.name : 'Unknown';

            // Get client name
            const selectedClientObj = clientesList.find(c => c.id === cliente);
            const clientName = selectedClientObj ? selectedClientObj.client_name : 'Unknown';

            // Prepare order data
            const orderData = {
                asesora: advisorName, // Storing name for backward compatibility
                customer: clientName, // Storing client name
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
            setCliente('');
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
            <div ref={wrapperRef} style={{
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

                    {/* Asesora Selection */}
                    <div>
                        <label style={labelStyle}>Asesora *</label>
                        <select
                            value={asesora}
                            onChange={(e) => setAsesora(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">Seleccionar asesora</option>
                            {asesorasList.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Client Selection (Replaces PDF Upload) */}
                    <div>
                        {!isCreatingClient ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <SearchableSelect
                                            label="Cliente *"
                                            placeholder={!asesora ? 'Primero selecciona una asesora' : (isLoadingClients ? 'Cargando clientes...' : 'Buscar cliente por nombre, cédula o RIF...')}
                                            options={clientesList}
                                            value={cliente}
                                            onChange={setCliente}
                                            disabled={!asesora}
                                            isLoading={isLoadingClients}
                                            getOptionLabel={(c) => {
                                                const name = fixEncoding(c.client_name);
                                                const business = c.business_name ? ` (${fixEncoding(c.business_name)})` : '';
                                                const idStr = c.rif_cedula ? ` - ${c.rif_cedula}` : '';
                                                return `${name}${business}${idStr}`;
                                            }}
                                            getOptionValue={(c) => c.id}
                                            filterOption={(c, query) => {
                                                const q = normalizeForSearch(query);
                                                const name = normalizeForSearch(c.client_name);
                                                const business = normalizeForSearch(c.business_name);
                                                const idDoc = c.rif_cedula ? c.rif_cedula.toLowerCase() : '';
                                                return name.includes(q) || business.includes(q) || idDoc.includes(q);
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsCreatingClient(true)}
                                        disabled={!asesora}
                                        style={{
                                            padding: '10px 12px',
                                            backgroundColor: !asesora ? colors.bgTertiary : colors.primary,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: !asesora ? 'not-allowed' : 'pointer',
                                            height: '42px', // Match input height roughly
                                            whiteSpace: 'nowrap',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}
                                        title="Crear nuevo cliente"
                                    >
                                        + Nuevo
                                    </button>
                                </div>
                                {asesora && clientesList.length === 0 && !isLoadingClients && (
                                    <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
                                        Esta asesora no tiene clientes asignados.
                                    </div>
                                )}

                                {/* Selected Client Details */}
                                {cliente && (() => {
                                    const selectedClient = clientesList.find(c => c.id === cliente);
                                    if (!selectedClient) return null;
                                    return (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                                            borderRadius: '6px',
                                            border: `1px solid ${colors.border}`,
                                            fontSize: '0.9rem',
                                            color: colors.text
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                <div>
                                                    <span style={{ fontWeight: '600', color: colors.textMuted }}>Razón Social:</span> {fixEncoding(selectedClient.business_name) || '-'}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: '600', color: colors.textMuted }}>Documento:</span> {selectedClient.rif_cedula || '-'}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: '600', color: colors.textMuted }}>Teléfono:</span> {selectedClient.phone || '-'}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: '600', color: colors.textMuted }}>Dirección:</span> {fixEncoding(selectedClient.address) || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <div style={{
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                                padding: '16px',
                                borderRadius: '8px',
                                border: `1px solid ${colors.border}`
                            }}>
                                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1rem', color: colors.text }}>Nuevo Cliente para {asesorasList.find(a => a.id === asesora)?.name}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Nombre *</label>
                                        <input
                                            type="text"
                                            value={newClientData.client_name}
                                            onChange={(e) => setNewClientData({ ...newClientData, client_name: e.target.value })}
                                            style={inputStyle}
                                            placeholder="Nombre del cliente"
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Razón Social</label>
                                        <input
                                            type="text"
                                            value={newClientData.business_name}
                                            onChange={(e) => setNewClientData({ ...newClientData, business_name: e.target.value })}
                                            style={inputStyle}
                                            placeholder="Nombre de la empresa"
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>RIF / Cédula</label>
                                        <input
                                            type="text"
                                            value={newClientData.rif_cedula}
                                            onChange={(e) => setNewClientData({ ...newClientData, rif_cedula: e.target.value })}
                                            style={inputStyle}
                                            placeholder="V-12345678"
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Teléfono</label>
                                        <input
                                            type="text"
                                            value={newClientData.phone}
                                            onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                                            style={inputStyle}
                                            placeholder="0414-1234567"
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={labelStyle}>Dirección</label>
                                        <input
                                            type="text"
                                            value={newClientData.address}
                                            onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                                            style={inputStyle}
                                            placeholder="Dirección completa"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                    <button
                                        onClick={() => setIsCreatingClient(false)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'transparent',
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: colors.text
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateClient}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: colors.primary,
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: 'white',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Guardar Cliente
                                    </button>
                                </div>
                            </div>
                        )}
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
                                border: `1px solid ${colors.border}`,
                                position: 'relative' // For absolute positioning of suggestions
                            }}>
                                {/* First Row: Description and Characteristics */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <label style={{ ...labelStyle, fontSize: '0.8rem', color: colors.textMuted }}>
                                            Código y Descripción
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: FORR-272 - Forro para iPhone"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            style={inputStyle}
                                            autoComplete="off"
                                        />
                                        {/* Suggestions Dropdown */}
                                        {suggestions[item.id] && suggestions[item.id].length > 0 && (
                                            <ul style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: colors.bgSecondary,
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: '0 0 6px 6px',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                zIndex: 10,
                                                listStyle: 'none',
                                                padding: 0,
                                                margin: 0,
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                {suggestions[item.id].map((product) => (
                                                    <li
                                                        key={product.id}
                                                        onClick={() => selectProduct(item.id, product)}
                                                        style={{
                                                            padding: '10px',
                                                            cursor: 'pointer',
                                                            borderBottom: `1px solid ${colors.border}`,
                                                            color: colors.text,
                                                            fontSize: '0.9rem',
                                                            backgroundColor: theme === 'dark' ? '#1e293b' : 'white'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'dark' ? '#334155' : '#f1f5f9'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = theme === 'dark' ? '#1e293b' : 'white'}
                                                    >
                                                        <strong>{product.codigo}</strong> - {product.prd_descripcion}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
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
