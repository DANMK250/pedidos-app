import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabase';
import { fixEncoding } from '../../utils/stringUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // Date State
    const [selectedWeek, setSelectedWeek] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        // Get ISO week number
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${year}-W${weekNo.toString().padStart(2, '0')}`;
    });
    const [dateRangeStr, setDateRangeStr] = useState('');

    useEffect(() => {
        loadData();
    }, [selectedWeek]);

    const getWeeklyRange = (weekStr) => {
        if (!weekStr) return null;

        const [year, week] = weekStr.split('-W');
        const simpleYear = parseInt(year);
        const simpleWeek = parseInt(week);

        // Simple calculation for Monday of ISO week
        const simple = new Date(simpleYear, 0, 1 + (simpleWeek - 1) * 7);
        const dayOfWeek = simple.getDay();
        const ISOweekStart = simple;
        if (dayOfWeek <= 4)
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

        const monday = new Date(ISOweekStart);
        monday.setHours(0, 0, 0, 0);

        // Calculate Sunday (End of week)
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { start: monday, end: sunday };
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all data
            // IMPORTANT: Table name is 'pedidos', not 'orders'
            const { data: ordersData } = await supabase.from('pedidos').select('*');
            const { data: advisorsData } = await supabase.from('asesoras').select('*');
            const { data: clientsData } = await supabase.from('clientes').select('*');

            if (ordersData && advisorsData && clientsData) {
                // Filter orders by selected week
                const range = getWeeklyRange(selectedWeek);

                if (range) {
                    const { start, end } = range;
                    // Format range for display
                    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
                    setDateRangeStr(`${start.toLocaleDateString('es-VE', options)} - ${end.toLocaleDateString('es-VE', options)}`);

                    const weeklyOrders = ordersData.filter(o => {
                        const orderDate = new Date(o.created_at);
                        return orderDate >= start && orderDate <= end;
                    });

                    setOrders(weeklyOrders);
                    setAdvisors(advisorsData);
                    setClients(clientsData);
                    calculateStats(weeklyOrders, advisorsData, clientsData);
                }
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

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.text(`Reporte Semanal: ${dateRangeStr}`, 14, 20);

            // 1. Advisor Ranking
            doc.setFontSize(14);
            doc.text('Ranking de Asesoras', 14, 35);

            const advisorRows = advisorStats.map((stat, i) => [
                `${i + 1}. ${stat.name}`,
                stat.count,
                `$${stat.total.toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: 40,
                head: [['Asesora', 'Pedidos', 'Total Vendido']],
                body: advisorRows,
            });

            // 2. Top Clients
            let finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 50;
            finalY += 15;

            doc.text('Mejores Clientes', 14, finalY);

            const clientRows = topClients.map(client => [
                fixEncoding(client.name),
                client.advisor,
                `$${client.total.toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Cliente', 'Asesora', 'Total Comprado']],
                body: clientRows,
            });

            doc.save(`reporte_semanal_${selectedWeek}.pdf`);
        } catch (error) {
            console.error("Export Error:", error);
            alert("Error al exportar PDF: " + error.message);
        }
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
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Link to="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>
                        ← Volver al Panel
                    </Link>
                    <h1 style={{ color: 'white', marginTop: '12px', fontSize: '1.75rem', marginBottom: '8px' }}>
                        Reportes y Estadísticas
                    </h1>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        Mostrando datos del: <strong>{dateRangeStr}</strong>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: colors.text, fontSize: '0.9rem' }}>Seleccionar Semana:</span>
                    <input
                        type="week"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: colors.bgSecondary,
                            color: colors.text,
                            cursor: 'pointer'
                        }}
                    />
                    <button
                        onClick={exportToPDF}
                        style={{
                            backgroundColor: colors.primary,
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        📄 Exportar PDF
                    </button>
                </div>
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
