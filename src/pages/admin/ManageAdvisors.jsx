import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';

export default function ManageAdvisors() {
    const { colors, theme } = useTheme();
    const [advisors, setAdvisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAdvisor, setEditingAdvisor] = useState(null);
    const [formData, setFormData] = useState({ name: '', active: true });

    useEffect(() => {
        loadAdvisors();
    }, []);

    const loadAdvisors = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('asesoras')
            .select('*')
            .order('name');

        if (!error && data) {
            setAdvisors(data);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingAdvisor) {
            // Update
            const { error } = await supabase
                .from('asesoras')
                .update(formData)
                .eq('id', editingAdvisor.id);

            if (!error) {
                alert('Asesora actualizada exitosamente');
            }
        } else {
            // Create
            const { error } = await supabase
                .from('asesoras')
                .insert([formData]);

            if (!error) {
                alert('Asesora creada exitosamente');
            }
        }

        setShowModal(false);
        setFormData({ name: '', active: true });
        setEditingAdvisor(null);
        loadAdvisors();
    };

    const handleEdit = (advisor) => {
        setEditingAdvisor(advisor);
        setFormData({ name: advisor.name, active: advisor.active });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta asesora?')) return;

        const { error } = await supabase
            .from('asesoras')
            .delete()
            .eq('id', id);

        if (!error) {
            alert('Asesora eliminada');
            loadAdvisors();
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: colors.bgPrimary, padding: '24px' }}>
            <Link to="/admin" style={{ color: colors.primary, textDecoration: 'none' }}>
                ← Volver al Panel
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '24px' }}>
                <h1 style={{ color: colors.text, fontSize: '1.75rem' }}>Gestión de Asesoras</h1>
                <button
                    onClick={() => { setShowModal(true); setEditingAdvisor(null); setFormData({ name: '', active: true }); }}
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
                    + Nueva Asesora
                </button>
            </div>

            {loading ? (
                <div style={{ color: colors.text }}>Cargando...</div>
            ) : (
                <div style={{ backgroundColor: colors.bgSecondary, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600' }}>Nombre</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600' }}>Estado</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: colors.text, fontWeight: '600' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {advisors.map(advisor => (
                                <tr key={advisor.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                                    <td style={{ padding: '12px', color: colors.text }}>{advisor.name}</td>
                                    <td style={{ padding: '12px', color: colors.text }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            backgroundColor: advisor.active ? '#d1fae5' : '#fee2e2',
                                            color: advisor.active ? '#065f46' : '#b91c1c'
                                        }}>
                                            {advisor.active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button onClick={() => handleEdit(advisor)} style={{ marginRight: '8px', padding: '6px 12px', cursor: 'pointer' }}>Editar</button>
                                        <button onClick={() => handleDelete(advisor.id)} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px' }}>Eliminar</button>
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
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: colors.bgSecondary,
                        padding: '24px',
                        borderRadius: '8px',
                        width: '400px',
                        maxWidth: '90%'
                    }}>
                        <h2 style={{ color: colors.text, marginBottom: '16px' }}>
                            {editingAdvisor ? 'Editar Asesora' : 'Nueva Asesora'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>Nombre *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: `1px solid ${colors.border}`,
                                        backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                        color: colors.text
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', color: colors.text }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        style={{ marginRight: '8px' }}
                                    />
                                    Activa
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                                    {editingAdvisor ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
