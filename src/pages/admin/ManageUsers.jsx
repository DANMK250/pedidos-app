import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';

export default function ManageUsers() {
    const { colors, theme } = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId, newRole) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            alert('Rol actualizado');
            loadUsers();
        } else {
            alert('Error al actualizar rol');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: colors.bgPrimary, padding: '24px' }}>
            <Link to="/admin" style={{ color: colors.primary, textDecoration: 'none' }}>
                ← Volver al Panel
            </Link>

            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
                <h1 style={{ color: colors.text, fontSize: '1.75rem' }}>Gestión de Usuarios</h1>
                <p style={{ color: colors.textMuted, marginTop: '8px' }}>
                    Administra los roles de los usuarios del sistema
                </p>
            </div>

            {loading ? (
                <div style={{ color: colors.text }}>Cargando...</div>
            ) : (
                <div style={{ backgroundColor: colors.bgSecondary, borderRadius: '8px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600' }}>Rol</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: colors.text, fontWeight: '600' }}>Fecha de Registro</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: colors.text, fontWeight: '600' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                                    <td style={{ padding: '12px', color: colors.text }}>{user.email}</td>
                                    <td style={{ padding: '12px', color: colors.text }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            backgroundColor: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                                            color: user.role === 'admin' ? '#1e40af' : '#4b5563'
                                        }}>
                                            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', color: colors.text }}>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                border: `1px solid ${colors.border}`,
                                                backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                                color: colors.text,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="user">Usuario</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
