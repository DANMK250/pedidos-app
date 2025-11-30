import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';
import { fixEncoding } from '../../utils/stringUtils';

export default function ManageClients() {
    const { colors, theme } = useTheme();
    const [clients, setClients] = useState([]);
    const [advisors, setAdvisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        client_name: '',
        business_name: '',
        rif_cedula: '',
        phone: '',
        address: '',
        route: '',
        advisor_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        // Load clients
        const { data: clientsData } = await supabase
            .from('clientes')
            .select('*')
            .order('client_name');

        // Load advisors
        const { data: advisorsData } = await supabase
            .from('asesoras')
            .select('*')
            .eq('active', true)
            .order('name');

        if (clientsData) setClients(clientsData);
        if (advisorsData) setAdvisors(advisorsData);

        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Business name fallback
        const finalFormData = {
            ...formData,
            business_name: formData.business_name || formData.client_name
        };

        if (editingClient) {
            const { error } = await supabase
                .from('clientes')
                .update(finalFormData)
                .eq('id', editingClient.id);

            if (!error) alert('Cliente actualizado exitosamente');
        } else {
            const { error } = await supabase
                .from('clientes')
                .insert([finalFormData]);

            if (!error) alert('Cliente creado exitosamente');
        }

        setShowModal(false);
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setFormData({
            client_name: '',
            business_name: '',
            rif_cedula: '',
            phone: '',
            address: '',
            route: '',
            advisor_id: ''
        });
        setEditingClient(null);
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            client_name: client.client_name || '',
            business_name: client.business_name || '',
            rif_cedula: client.rif_cedula || '',
            phone: client.phone || '',
            address: client.address || '',
            route: client.route || '',
            advisor_id: client.advisor_id || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);

        if (!error) {
            alert('Cliente eliminado');
            loadData();
        }
    };

    const getAdvisorName = (advisorId) => {
        const advisor = advisors.find(a => a.id === advisorId);
        return advisor ? advisor.name : '-';
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: colors.bgPrimary, padding: '24px' }}>
            <Link to="/admin" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                ← Volver al Panel
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '24px' }}>
                <h1 style={{ color: 'white', fontSize: '1.75rem' }}>Gestión de Clientes</h1>
                <button
                    onClick={() => { setShowModal(true); resetForm(); }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    + Nuevo Cliente
                </button>
            </div>

            {loading ? (
                <div style={{ color: colors.text }}>Cargando...</div>
            ) : (
                <div style={{ backgroundColor: colors.bgSecondary, borderRadius: '8px', overflow: 'auto', border: `1px solid ${colors.border}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text }}>Nombre</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text }}>RIF/Cédula</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text }}>Teléfono</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text }}>Asesora</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: colors.text }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                                    <td style={{ padding: '12px', color: colors.text }}>{fixEncoding(client.client_name)}</td>
                                    <td style={{ padding: '12px', color: colors.text }}>{client.rif_cedula || '-'}</td>
                                    <td style={{ padding: '12px', color: colors.text }}>{client.phone || '-'}</td>
                                    <td style={{ padding: '12px', color: colors.text }}>{getAdvisorName(client.advisor_id)}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button onClick={() => handleEdit(client)} style={{ marginRight: '8px', padding: '6px 12px', cursor: 'pointer' }}>Editar</button>
                                        <button onClick={() => handleDelete(client.id)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px' }}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    overflowY: 'auto'
                }}>
                    <div style={{
                        backgroundColor: colors.bgSecondary,
                        padding: '24px',
                        borderRadius: '8px',
                        width: '500px',
                        maxWidth: '90%',
                        margin: '20px'
                    }}>
                        <h2 style={{ color: colors.text, marginBottom: '16px' }}>
                            {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value.toUpperCase() })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: `1px solid ${colors.border}`,
                                            backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                            color: colors.text
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>Razón Social</label>
                                    <input
                                        type="text"
                                        value={formData.business_name}
                                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value.toUpperCase() })}
                                        placeholder="Si se deja vacío, se usará el nombre del cliente"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: `1px solid ${colors.border}`,
                                            backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                            color: colors.text
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>RIF/Cédula *</label>
                                    <input
                                        type="text"
                                        value={formData.rif_cedula}
                                        onChange={(e) => setFormData({ ...formData, rif_cedula: e.target.value.toUpperCase() })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: `1px solid ${colors.border}`,
                                            backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                            color: colors.text
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>Teléfono *</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.toUpperCase() })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: `1px solid ${colors.border}`,
                                            backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                            color: colors.text
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>Dirección *</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                                        rows={2}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: `1px solid ${colors.border}`,
                                            backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                            color: colors.text,
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>Asesora *</label>
                                    <select
                                        value={formData.advisor_id}
                                        onChange={(e) => setFormData({ ...formData, advisor_id: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: `1px solid ${colors.border}`,
                                            backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                            color: colors.text
                                        }}
                                    >
                                        <option value="">Seleccionar</option>
                                        {advisors.map(advisor => (
                                            <option key={advisor.id} value={advisor.id}>{advisor.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{
                                    padding: '10px 20px',
                                    backgroundColor: colors.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}>
                                    {editingClient ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
