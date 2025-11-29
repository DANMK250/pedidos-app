import { useState } from 'react';
import { supabase } from '../services/supabase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign Up
    const [selectedRole, setSelectedRole] = useState('user'); // Role selection for signup

    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        let result;
        if (showForgotPassword) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password', // Ensure this route exists or just redirects to home
            });
            if (error) {
                setErrorMsg(error.message);
            } else {
                setErrorMsg('✅ Se ha enviado un correo para restablecer tu contraseña.');
            }
            setLoading(false);
            return;
        }

        if (isSignUp) {
            result = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: selectedRole
                    }
                }
            });

            // Also insert into profiles table with the selected role
            if (!result.error && result.data.user) {
                await supabase
                    .from('profiles')
                    .update({ role: selectedRole })
                    .eq('id', result.data.user.id);
            }
        } else {
            result = await supabase.auth.signInWithPassword({ email, password });
        }

        const { error, data } = result;

        if (error) {
            setErrorMsg(error.message);
        } else if (isSignUp && data.user && !data.session) {
            setErrorMsg('✅ Registro exitoso. ¡Revisa tu correo para confirmar!');
        }

        setLoading(false);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100%',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div className="card">
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.8rem', fontWeight: '700' }}>
                    {showForgotPassword ? 'Recuperar Contraseña' : (isSignUp ? 'Crear Cuenta' : 'Bienvenido')}
                </h2>
                <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.95rem' }}>
                    {showForgotPassword
                        ? 'Ingresa tu correo para recibir instrucciones'
                        : (isSignUp ? 'Ingresa tus datos para registrarte' : 'Ingresa a tu cuenta para continuar')}
                </p>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    {!showForgotPassword && (
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}

                    {isSignUp && !showForgotPassword && (
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                                Departamento
                            </label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '0.625rem',
                                    fontSize: '1rem',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db'
                                }}
                            >
                                <option value="user">Usuario</option>
                                <option value="coordinador">Coordinador</option>
                                <option value="deposito">Depósito</option>
                                <option value="cobranzas">Cobranzas</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    )}

                    {errorMsg && (
                        <div style={{
                            backgroundColor: errorMsg.includes('✅') ? '#d1fae5' : '#fee2e2',
                            color: errorMsg.includes('✅') ? '#065f46' : '#b91c1c',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            textAlign: 'left'
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            width: '100%'
                        }}
                    >
                        {loading ? 'Procesando...' : (showForgotPassword ? 'Enviar Correo' : (isSignUp ? 'Registrarse' : 'Iniciar Sesión'))}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {!showForgotPassword && (
                        <div>
                            {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#3f75cc',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '0 0.25rem',
                                    textDecoration: 'underline'
                                }}
                            >
                                {isSignUp ? 'Inicia Sesión' : 'Regístrate'}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => { setShowForgotPassword(!showForgotPassword); setErrorMsg(''); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        {showForgotPassword ? 'Volver al inicio de sesión' : '¿Olvidaste tu contraseña?'}
                    </button>
                </div>
            </div>
        </div>
    );
}
