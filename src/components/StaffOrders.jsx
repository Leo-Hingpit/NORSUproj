import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // 🔁 Listen for realtime changes
    const channel = supabase
      .channel('table_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_orders' },
        (payload) => {
          console.log('🔁 Realtime update:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 📦 Fetch orders with profile relation
  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('table_orders')
      .select(`
        id,
        created_at,
        user_id,
        items,
        total,
        status,
        profiles ( fullName )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching orders:', error.message);
      setOrders([]);
    } else {
      console.log('📦 Orders fetched:', data);
      setOrders(data || []);
      applyFilter(filter, data);
    }
    setLoading(false);
  }

  // 🎯 Apply filter logic
  function applyFilter(selectedFilter, sourceOrders = orders) {
    setFilter(selectedFilter);

    if (selectedFilter === 'All') {
      setFilteredOrders(sourceOrders);
    } else {
      setFilteredOrders(sourceOrders.filter((order) => order.status === selectedFilter));
    }
  }

  // 🔄 Update order status in database
  async function updateStatus(orderId, newStatus) {
    console.log(`⚙️ Updating order ${orderId} → ${newStatus}`);

    const { error } = await supabase
      .from('table_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Error updating status:', error.message);
      alert('Failed to update order status.');
    } else {
      console.log(`✅ Order ${orderId} status updated to ${newStatus}`);
      fetchOrders();
    }
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-4">🍳 Kitchen Orders</h3>

      {/* 🧭 Filter Controls */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <label className="form-label fw-bold me-2">Filter:</label>
        {['All', 'Pending', 'In Progress', 'Complete'].map((status) => (
          <button
            key={status}
            className={`btn btn-sm ${
              filter === status ? 'btn-primary' : 'btn-outline-primary'
            }`}
            onClick={() => applyFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p>No orders to display.</p>
      ) : (
        filteredOrders.map((order) => (
          <div key={order.id} className="card mb-3 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                Order #{order.id}{' '}
                <span
                  className={`badge ${
                    order.status === 'Pending'
                      ? 'bg-secondary'
                      : order.status === 'In Progress'
                      ? 'bg-warning text-dark'
                      : 'bg-success'
                  }`}
                >
                  {order.status}
                </span>
              </h5>

              <p className="text-muted mb-1">
                Placed on: {new Date(order.created_at).toLocaleString()}
              </p>
              <p className="mb-3">
                <strong>Customer:</strong> {order.profiles?.fullName || 'Unknown User'}
              </p>

              <ul className="list-group mb-3">
                {Array.isArray(order.items) &&
                  order.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span>{item.name}</span>
                      <span>
                        ₱{item.price} × {item.qty}
                      </span>
                    </li>
                  ))}
              </ul>

              <h6>
                <strong>Total:</strong> ₱{Number(order.total || 0).toFixed(2)}
              </h6>

              {/* 🧩 Status Buttons */}
              <div className="mt-3">
                {order.status === 'Pending' && (
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => updateStatus(order.id, 'In Progress')}
                  >
                    Mark In Progress
                  </button>
                )}
                {order.status === 'In Progress' && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => updateStatus(order.id, 'Complete')}
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
