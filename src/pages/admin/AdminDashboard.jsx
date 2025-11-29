import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
    const { colors, theme } = useTheme();
    const { session } = useAuth();

    const adminCards = [
        { title: 'Gestión de Asesoras', path: '/admin/advisors', icon: '👥', description: 'Crear, editar y eliminar asesoras' },
        { title: 'Gestión de Clientes', path: '/admin/clients', icon: '📋', description: 'Administrar clientes y sus datos' },
        { title: 'Gestión de Usuarios', path: '/admin/users', icon: '🔐', description: 'Administrar usuarios y roles' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: colors.bgPrimary,
            padding: '24px'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <Link to="/" style={{ color: colors.primary, textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Volver al Dashboard
                </Link>
                <h1 style={{ color: colors.text, marginTop: '16px', fontSize: '2rem' }}>Panel de Administración</h1>
                <p style={{ color: colors.textMuted, marginTop: '8px' }}>
                    Bienvenido, {session?.user?.email}
                </p>
            </div>

            {/* Admin Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                maxWidth: '1200px'
            }}>
                {adminCards.map(card => (
                    <Link
                        key={card.path}
                        to={card.path}
                        style={{
                            textDecoration: 'none',
                            backgroundColor: colors.bgSecondary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            padding: '24px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{card.icon}</div>
                        <h2 style={{ color: colors.text, fontSize: '1.25rem', marginBottom: '8px' }}>{card.title}</h2>
                        <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>{card.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
