import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState({}); // 💰 Stores input per order

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('table_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      setOrders(data || []);
      applyFilter(filter, data);
    }
    setLoading(false);
  }

  function applyFilter(selectedFilter, sourceOrders = orders) {
    setFilter(selectedFilter);
    selectedFilter === 'All'
      ? setFilteredOrders(sourceOrders)
      : setFilteredOrders(sourceOrders.filter((o) => o.status === selectedFilter));
  }

  async function updateStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('table_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) alert('Failed to update status.');
    else fetchOrders();
  }

  function handlePaymentChange(orderId, value) {
    setPayments((prev) => ({ ...prev, [orderId]: value }));
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-4">🍳 Kitchen Orders</h3>

      {/* Filter */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <label className="fw-bold">Filter:</label>
        {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
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
        <p>No orders found</p>
      ) : (
        filteredOrders.map((order) => {
          const paid = parseFloat(payments[order.id] || 0);
          const total = parseFloat(order.total || 0);
          const change = paid - total;

          return (
            <div key={order.id} className="card mb-3 shadow-sm">
              <div className="card-body">
                <h5>
                  Order #{order.id}{' '}
                  <span className={`badge ${
                    order.status === 'Pending'
                      ? 'bg-secondary'
                      : order.status === 'In Progress'
                      ? 'bg-warning text-dark'
                      : 'bg-success'
                  }`}>
                    {order.status}
                  </span>
                </h5>

                <p className="text-muted">
                  {new Date(order.created_at).toLocaleString()}
                </p>

                <p><strong>Customer:</strong> {order.profiles?.fullName}</p>

                <ul className="list-group mb-3">
                  {order.items?.map((item, idx) => (
                    <li key={idx} className="list-group-item d-flex justify-content-between">
                      {item.name} <span>₱{item.price} × {item.qty}</span>
                    </li>
                  ))}
                </ul>

                <h6><strong>Total:</strong> ₱{total.toFixed(2)}</h6>

                {/* ✅ Payment Calculator */}
                <div className="mt-3">
                  <label className="form-label">Amount Paid:</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount paid"
                    value={payments[order.id] || ''}
                    onChange={(e) => handlePaymentChange(order.id, e.target.value)}
                  />
                  {payments[order.id] && (
                    <p className="mt-2 fw-bold">
                      Change:{' '}
                      {change < 0 ? (
                        <span className="text-danger">
                          Insufficient Amount (₱{Math.abs(change).toFixed(2)} missing)
                        </span>
                      ) : (
                        <span className="text-success">
                          ₱{change.toFixed(2)}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="mt-3">
                  {order.status === 'Pending' && (
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => updateStatus(order.id, 'In Progress')}
                    >
                      Mark In Progress
                    </button>
                  )}

                  {order.status === 'In Progress' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => updateStatus(order.id, 'Completed')}
                    >
                      Mark Completed
                    </button>
                  )}  
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
