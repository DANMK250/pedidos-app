import { useState } from 'react';
import { supabase } from '../services/supabase';

export default function Login() {
    const [cedula, setCedula] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [selectedRole, setSelectedRole] = useState('coordinador');
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        if (showForgotPassword) {
            setErrorMsg('❌ Función no disponible. Contacta al administrador.');
            setLoading(false);
            return;
        }

        if (isSignUp) {
            // Validate cedula is numeric
            if (!/^\d+$/.test(cedula)) {
                setErrorMsg('❌ La cédula debe contener solo números.');
                setLoading(false);
                return;
            }

            // Check if cedula already exists using secure RPC
            const { data: exists } = await supabase
                .rpc('check_cedula_exists', { cedula_to_check: cedula });

            if (exists) {
                setErrorMsg('❌ Esta cédula ya está registrada.');
                setLoading(false);
                return;
            }

            // Check if name + surname + role combination already exists
            const { data: existingPerson } = await supabase
                .from('profiles')
                .select('id')
                .eq('first_name', firstName)
                .eq('last_name', lastName)
                .eq('role', selectedRole)
                .maybeSingle();

            if (existingPerson) {
                setErrorMsg('❌ Ya existe una persona con este nombre, apellido y departamento.');
                setLoading(false);
                return;
            }

            // Generate email from cedula with valid domain
            const generatedEmail = `${cedula}@pedidos.app`;

            const { error, data } = await supabase.auth.signUp({
                email: generatedEmail,
                password,
                options: {
                    data: {
                        cedula,
                        first_name: firstName,
                        last_name: lastName,
                        role: selectedRole
                    }
                }
            });

            if (error) {
                setErrorMsg('❌ ' + error.message);
            } else if (data.user) {
                // Success - switch to login mode
                setIsSignUp(false);
                setCedula('');
                setFirstName('');
                setLastName('');
                setPassword('');
                setErrorMsg('✅ Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
            }
        } else {
            // Login with cedula
            const generatedEmail = `${cedula}@pedidos.app`;
            const { error } = await supabase.auth.signInWithPassword({
                email: generatedEmail,
                password
            });

            if (error) {
                setErrorMsg('❌ Cédula o contraseña incorrecta.');
            }
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
                        ? 'Función no disponible'
                        : (isSignUp ? 'Ingresa tus datos para registrarte' : 'Ingresa tu cédula para continuar')}
                </p>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Cédula Field */}
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                            Cédula *
                        </label>
                        <input
                            type="text"
                            placeholder="12345678"
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            required
                            pattern="\d*"
                            title="Solo números"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Name fields (only for signup) */}
                    {isSignUp && !showForgotPassword && (
                        <>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Juan"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Pérez"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                        </>
                    )}

                    {/* Password Field */}
                    {!showForgotPassword && (
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                                Contraseña *
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

                    {/* Department Selector (only for signup) */}
                    {isSignUp && !showForgotPassword && (
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                                Departamento *
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
                                <option value="coordinador">Coordinador</option>
                                <option value="deposito">Depósito</option>
                                <option value="cobranzas">Cobranzas</option>
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
                        {loading ? 'Procesando...' : (showForgotPassword ? 'Recuperar' : (isSignUp ? 'Registrarse' : 'Iniciar Sesión'))}
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
