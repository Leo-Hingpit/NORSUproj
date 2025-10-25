// src/components/StudentOrderHistory.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function StudentOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      console.log("Fetching orders for:", userId);

      const { data, error } = await supabase
        .from("table_orders")
        .select(`
          id,
          created_at,
          items,
          total,
          status
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Load history failed:", error.message);
      } else {
        console.log("✅ Order history loaded:", data);
        setOrders(data || []);
      }

      setLoading(false);
    };

    loadOrders();
  }, []);

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p>Loading order history...</p>
      </div>
    );

  return (
    <div className="container mt-4">
      <h3 className="mb-3">📜 Order History</h3>

      {orders.length === 0 ? (
        <p>You have no past orders.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="card mb-3 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Order #{order.id}</h5>

              <p className="text-muted">
                {new Date(order.created_at).toLocaleString()}
              </p>

              <ul className="list-group mb-3">
                {Array.isArray(order.items) &&
                  order.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between"
                    >
                      <span>{item.name}</span>
                      <span>
                        ₱{item.price} × {item.qty}
                      </span>
                    </li>
                  ))}
              </ul>

              <strong>Total: ₱{Number(order.total).toFixed(2)}</strong>
              <br />
              <span
                className={`badge mt-2 ${
                  order.status === "Pending"
                    ? "bg-secondary"
                    : order.status === "In Progress"
                    ? "bg-warning text-dark"
                    : "bg-success"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
