import React, { useState, useEffect } from 'react';
import KanbanColumn from './KanbanColumn';
import OrderDetailsSidebar from './OrderDetailsSidebar';
import { getOrders } from '../../services/supabase';

// KanbanBoard Component
// Main container for the Kanban board.
export default function KanbanBoard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Fetch orders from Supabase
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await getOrders();

            if (error) throw error;

            // Transform data for the UI
            // Note: We keep the original order object for the sidebar details
            const formattedOrders = data.map(order => ({
                ...order, // Keep all original properties
                id: order.id,
                customer: order.customer,
                itemCount: order.items ? order.items.length : 0, // Use different name for count
                price: order.total,
                status: order.status,
                tags: [order.tipo_pedido] // Wrap in array for compatibility
            }));

            setOrders(formattedOrders);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle order updates from sidebar
    const handleOrderUpdate = (updatedOrder) => {
        setOrders(orders.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
        setSelectedOrder(updatedOrder);
        // Re-fetch to ensure consistency if needed, but local update is faster
    };

    // Filter orders by status
    const getOrdersByStatus = (status) => orders.filter(o => o.status === status);

    if (loading) {
        return <div style={{ padding: '24px', color: '#64748b' }}>Cargando pedidos...</div>;
    }

    if (error) {
        return <div style={{ padding: '24px', color: '#dc2626' }}>Error: {error}</div>;
    }

    return (
        <div className="kanban-board-mobile no-scrollbar">
            <KanbanColumn
                title="Creado"
                orders={getOrdersByStatus('Creado')}
                color="#3b82f6" // Blue
                onOrderClick={setSelectedOrder}
            />
            <KanbanColumn
                title="En Revisión"
                orders={getOrdersByStatus('En Revisión')}
                color="#eab308" // Yellow
                onOrderClick={setSelectedOrder}
            />
            <KanbanColumn
                title="Facturado"
                orders={getOrdersByStatus('Facturado')}
                color="#f97316" // Orange
                onOrderClick={setSelectedOrder}
            />
            <KanbanColumn
                title="Finalizado"
                orders={getOrdersByStatus('Finalizado')}
                color="#22c55e" // Green
                onOrderClick={setSelectedOrder}
            />

            {/* Order Details Sidebar */}
            <OrderDetailsSidebar
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
                onUpdateOrder={handleOrderUpdate}
            />
        </div>
    );
}
