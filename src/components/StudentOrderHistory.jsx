// src/components/StudentOrderHistory.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function StudentOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      console.log("📌 Fetching order history...");

      const userId = localStorage.getItem("user_id");
      console.log("👤 Loaded userId:", userId);

      if (!userId) {
        console.warn("🚫 No stored userId. User may not be signed in.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("table_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Failed to load history:", error.message);
      } else {
        console.log("✅ Orders:", data);
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
        <p>No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="card mb-3 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Order #{order.id}</h5>
              <p className="text-muted">
                {new Date(order.created_at).toLocaleString()}
              </p>

              <ul className="list-group mb-3">
                {(order.items || []).map((item, i) => (
                  <li key={i} className="list-group-item d-flex justify-content-between">
                    <span>{item.name}</span>
                    <span>₱{item.price} × {item.qty}</span>
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
