import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';
import { fixEncoding } from '../../utils/stringUtils';

export default function AdminReports() {
    const { colors, theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [advisors, setAdvisors] = useState([]);
    const [clients, setClients] = useState([]);

    // Stats
    const [advisorStats, setAdvisorStats] = useState([]);
    const [topOrders, setTopOrders] = useState([]);
    const [topClients, setTopClients] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all data
            const { data: ordersData } = await supabase.from('orders').select('*');
            const { data: advisorsData } = await supabase.from('asesoras').select('*');
            const { data: clientsData } = await supabase.from('clientes').select('*');

            if (ordersData && advisorsData && clientsData) {
                setOrders(ordersData);
                setAdvisors(advisorsData);
                setClients(clientsData);
                calculateStats(ordersData, advisorsData, clientsData);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (orders, advisors, clients) => {
        // 1. Advisor Rankings (Orders & Revenue)
        const advisorMap = {};
        advisors.forEach(a => {
            advisorMap[a.name] = { name: a.name, count: 0, total: 0 };
        });

        orders.forEach(o => {
            // Normalize advisor name from order to match advisor list if possible
            // Note: Orders store 'asesora' as name string currently
            const name = o.asesora;
            if (!advisorMap[name]) {
                advisorMap[name] = { name: name, count: 0, total: 0 };
            }
            advisorMap[name].count += 1;
            advisorMap[name].total += o.total || 0;
        });

        const sortedAdvisors = Object.values(advisorMap).sort((a, b) => b.count - a.count);
        setAdvisorStats(sortedAdvisors);

        // 2. Top Orders (Most Expensive)
        const sortedOrders = [...orders].sort((a, b) => b.total - a.total).slice(0, 10);
        setTopOrders(sortedOrders);

        // 3. Top Clients (Most Purchases)
        const clientMap = {};
        orders.forEach(o => {
            const name = o.customer;
            if (!clientMap[name]) {
                clientMap[name] = { name: name, count: 0, total: 0, advisor: o.asesora };
            }
            clientMap[name].count += 1;
            clientMap[name].total += o.total || 0;
        });

        const sortedClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 10);
        setTopClients(sortedClients);
    };

    const Card = ({ title, children }) => (
        <div style={{
            backgroundColor: colors.bgSecondary,
            borderRadius: '8px',
            padding: '20px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: colors.text, fontSize: '1.1rem' }}>{title}</h3>
            {children}
        </div>
    );

    const Table = ({ headers, children }) => (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: `2px solid ${colors.border}`, textAlign: 'left' }}>
                        {headers.map((h, i) => (
                            <th key={i} style={{ padding: '8px', color: colors.textMuted, fontWeight: '600' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    );

    if (loading) return <div style={{ padding: '24px', color: colors.text }}>Cargando reportes...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: colors.bgPrimary, padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Link to="/admin" style={{ color: colors.primary, textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Volver al Panel
                </Link>
                <h1 style={{ color: colors.text, marginTop: '12px', fontSize: '1.75rem' }}>Reportes y Estadísticas</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                {/* Advisor Ranking */}
                <Card title="🏆 Ranking de Asesoras (Por Pedidos)">
                    <Table headers={['Asesora', 'Pedidos', 'Total Vendido']}>
                        {advisorStats.map((stat, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                <td style={{ padding: '8px', color: colors.text }}>
                                    {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}
                                    {stat.name}
                                </td>
                                <td style={{ padding: '8px', color: colors.text }}>{stat.count}</td>
                                <td style={{ padding: '8px', color: colors.text }}>${stat.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </Table>
                </Card>

                {/* Top Clients */}
                <Card title="💎 Mejores Clientes (Por Monto)">
                    <Table headers={['Cliente', 'Asesora', 'Total Comprado']}>
                        {topClients.map((client, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                <td style={{ padding: '8px', color: colors.text }}>{fixEncoding(client.name)}</td>
                                <td style={{ padding: '8px', color: colors.textMuted, fontSize: '0.85rem' }}>{client.advisor}</td>
                                <td style={{ padding: '8px', color: colors.text, fontWeight: '600' }}>${client.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </Table>
                </Card>

                {/* Top Orders */}
                <Card title="💰 Pedidos Más Caros">
                    <Table headers={['ID', 'Cliente', 'Monto', 'Fecha']}>
                        {topOrders.map((order) => (
                            <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                <td style={{ padding: '8px', color: colors.textMuted }}>#{order.id}</td>
                                <td style={{ padding: '8px', color: colors.text }}>{fixEncoding(order.customer)}</td>
                                <td style={{ padding: '8px', color: colors.text, fontWeight: '600' }}>${order.total.toFixed(2)}</td>
                                <td style={{ padding: '8px', color: colors.textMuted, fontSize: '0.85rem' }}>
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </Table>
                </Card>

            </div>
        </div>
    );
}
