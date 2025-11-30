import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';
import { createClient } from '@supabase/supabase-js';

export default function ManageUsers() {
    const { colors, theme } = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [creatingUser, setCreatingUser] = useState(false);

    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUserForReset, setSelectedUserForReset] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resettingPassword, setResettingPassword] = useState(false);

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

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setResettingPassword(true);

        try {
            // Use the admin API to update user password
            // Note: This requires the service_role key or being logged in as an admin with proper RLS
            // Since we are client-side, we can only update if we are the user or if we have an edge function.
            // However, Supabase client allows updating other users if you have the right permissions setup in Supabase.
            // BUT, standard client-side update only works for the logged-in user.
            // To update ANOTHER user's password from the client, we need a workaround or an Edge Function.
            // WORKAROUND: We will use a Remote Procedure Call (RPC) if available, or alert the user.

            // Actually, for security, Supabase doesn't allow client-side admin updates easily without service role.
            // We will try to use the 'updateUser' method which might fail without service role key.
            // If it fails, we'll inform the user they need to use the Supabase dashboard.

            // Wait! We can't use updateUser on client side for other users.
            // We need to create a Postgres function to handle this securely or use Edge Functions.
            // Let's try to call a custom RPC function 'admin_reset_password' which we will create.

            const { error } = await supabase.rpc('admin_reset_password', {
                user_id: selectedUserForReset.id,
                new_password: newPassword
            });

            if (error) throw error;

            alert('Contraseña actualizada exitosamente');
            setShowResetModal(false);
            setNewPassword('');
            setSelectedUserForReset(null);
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Error al actualizar contraseña: ' + error.message + '\n\nNota: Asegúrate de haber ejecutado el script SQL "fix_admin_and_duplicates.sql" que incluye la función de reset.');
        } finally {
            setResettingPassword(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreatingUser(true);

        try {
            // Check if user already exists in profiles
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', newUserEmail)
                .maybeSingle();

            if (existingUser) {
                alert('Error: Ya existe un usuario registrado con este correo electrónico.');
                setCreatingUser(false);
                return;
            }

            // Create a temporary client with memory storage to avoid logging out the admin
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false, // Don't persist session to localStorage
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            const { data, error } = await tempSupabase.auth.signUp({
                email: newUserEmail,
                password: newUserPassword
            });

            if (error) {
                if (error.message.includes('already registered')) {
                    alert('Error: Este correo ya está registrado en el sistema de autenticación.');
                } else {
                    throw error;
                }
                return;
            }

            if (data.user) {
                alert('Usuario creado exitosamente. ' + (data.session ? 'El usuario ha sido registrado.' : 'Se ha enviado un correo de confirmación.'));
                setShowCreateModal(false);
                setNewUserEmail('');
                setNewUserPassword('');
                // Wait a bit for the trigger to create the profile
                setTimeout(loadUsers, 1000);
            }
        } catch (error) {
            alert('Error al crear usuario: ' + error.message);
        } finally {
            setCreatingUser(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: colors.bgPrimary, padding: '24px' }}>
            <Link to="/admin" style={{ color: colors.primary, textDecoration: 'none' }}>
                ← Volver al Panel
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ color: colors.text, fontSize: '1.75rem' }}>Gestión de Usuarios</h1>
                    <p style={{ color: colors.textMuted, marginTop: '8px' }}>
                        Administra los roles de los usuarios del sistema
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
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
                    + Nuevo Usuario
                </button>
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
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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
                                                <option value="coordinador">Coordinador</option>
                                                <option value="deposito">Depósito</option>
                                                <option value="cobranzas">Cobranzas</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    setSelectedUserForReset(user);
                                                    setNewPassword('');
                                                    setShowResetModal(true);
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    border: `1px solid ${colors.border}`,
                                                    backgroundColor: theme === 'dark' ? '#334155' : 'white',
                                                    color: colors.text,
                                                    cursor: 'pointer'
                                                }}
                                                title="Resetear Contraseña"
                                            >
                                                🔑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Password Reset Modal */}
            {showResetModal && (
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
                        <h2 style={{ color: colors.text, marginBottom: '16px' }}>Resetear Contraseña</h2>
                        <p style={{ color: colors.textMuted, marginBottom: '16px' }}>
                            Ingresa la nueva contraseña para el usuario {selectedUserForReset?.email}
                        </p>
                        <form onSubmit={handlePasswordReset}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>Nueva Contraseña</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Ej: temporal123"
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
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowResetModal(false)}
                                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={resettingPassword}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: colors.primary,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {resettingPassword ? 'Guardando...' : 'Guardar Contraseña'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
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
                        <h2 style={{ color: colors.text, marginBottom: '16px' }}>Crear Nuevo Usuario</h2>
                        <form onSubmit={handleCreateUser}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>Email</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
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
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>Contraseña</label>
                                <input
                                    type="password"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    required
                                    minLength={6}
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
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingUser}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: colors.primary,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {creatingUser ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
