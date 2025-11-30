// Import the createClient function from the Supabase client library.
// This function is used to initialize the connection to your Supabase project.
import { createClient } from '@supabase/supabase-js';

// Retrieve the Supabase URL from the environment variables.
// Vite exposes environment variables prefixed with VITE_ through import.meta.env.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Retrieve the Supabase Anonymous Key from the environment variables.
// This key is safe to use in the browser as long as you have Row Level Security (RLS) enabled on your database.
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export a single instance of the Supabase client.
// This instance will be used throughout the application to interact with the database and authentication services.
export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// PEDIDOS (ORDERS) FUNCTIONS
// ============================================

/**
 * Create a new order in the database
 * @param {Object} orderData - Order data including asesora, items, total, etc.
 * @returns {Object} - { data, error }
 */
export async function createOrder(orderData) {
    try {
        // Try to get user, but don't fail if not authenticated
        const { data: { user } } = await supabase.auth.getUser();

        console.log('Creating order with data:', orderData);
        console.log('Current user:', user);

        const orderToInsert = {
            asesora: orderData.asesora,
            customer: orderData.customer || orderData.asesora,
            items: orderData.items,
            total: orderData.total,
            tipo_pedido: orderData.tipoPedido,
            canal: orderData.canal,
            moneda: orderData.moneda,
            status: 'Creado',
            pdf_url: orderData.pdfUrl || null,
            user_id: user?.id || null
        };

        console.log('Inserting order:', orderToInsert);

        const { data, error } = await supabase
            .from('pedidos')
            .insert([orderToInsert])
            .select();

        if (error) {
            console.error('Supabase error:', error);
        } else {
            console.log('Order created successfully:', data);
        }

        return { data, error };
    } catch (err) {
        console.error('Unexpected error in createOrder:', err);
        return { data: null, error: err };
    }
}

/**
 * Update an existing order
 * @param {string} orderId - The ID of the order to update
 * @param {Object} orderData - Updated order data
 * @returns {Object} - { data, error }
 */
export async function updateOrder(orderId, orderData) {
    try {
        console.log('Updating order:', orderId, 'with data:', orderData);

        const orderToUpdate = {
            asesora: orderData.asesora,
            customer: orderData.customer || orderData.asesora,
            items: orderData.items,
            total: orderData.total,
            tipo_pedido: orderData.tipoPedido,
            canal: orderData.canal,
            moneda: orderData.moneda,
            // Don't update status or user_id unless specifically needed
        };

        if (orderData.pdfUrl) {
            orderToUpdate.pdf_url = orderData.pdfUrl;
        }

        const { data, error } = await supabase
            .from('pedidos')
            .update(orderToUpdate)
            .eq('id', orderId)
            .select();

        if (error) {
            console.error('Supabase error updating order:', error);
        } else {
            console.log('Order updated successfully:', data);
        }

        return { data, error };
    } catch (err) {
        console.error('Unexpected error in updateOrder:', err);
        return { data: null, error: err };
    }
}

/**
 * Get all orders from the database
 * @returns {Object} - { data, error }
 */
export async function getOrders() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Get a single order by ID
 * @param {string} orderId - The order ID
 * @returns {Object} - { data, error }
 */
export async function getOrderById(orderId) {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .single();

    return { data, error };
}

/**
 * Update an order's status
 * @param {string} orderId - The order ID
 * @param {string} newStatus - The new status
 * @returns {Object} - { data, error }
 */
export async function updateOrderStatus(orderId, newStatus) {
    const { data, error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select();

    return { data, error };
}

/**
 * Delete an order
 * @param {string} orderId - The order ID
 * @returns {Object} - { data, error }
 */
export async function deleteOrder(orderId) {
    const { data, error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', orderId);

    return { data, error };
}

/**
 * Get all active advisors
 * @returns {Object} - { data, error }
 */
export async function getAsesoras() {
    const { data, error } = await supabase
        .from('asesoras')
        .select('*')
        .eq('active', true)
        .order('name');
    return { data, error };
}

/**
 * Get clients by advisor ID
 * @param {string} advisorId
 * @returns {Object} - { data, error }
 */
export async function getClientesByAdvisor(advisorId) {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('advisor_id', advisorId)
        .order('client_name');
    return { data, error };
}

/**
 * Search products by code or description
 * @param {string} query - The search query
 * @returns {Object} - { data, error }
 */
export async function searchProducts(query) {
    if (!query) return { data: [], error: null };

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`codigo.ilike.%${query}%,prd_descripcion.ilike.%${query}%`)
        .limit(10);

    return { data, error };
}
