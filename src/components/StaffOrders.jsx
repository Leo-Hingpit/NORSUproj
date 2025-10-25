import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";

export default function StaffOrders() {
  const queryClient = useQueryClient();

  // 🔥 Fetch orders from Supabase
  async function fetchOrders() {
    const { data, error } = await supabase
      .from("table_orders")
      .select(
        `
        id,
        created_at,
        user_id,
        items,
        total,
        status,
        profiles ( fullName )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // 🧠 React Query for caching
  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  // 🔁 Supabase realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "table_orders" },
        () => queryClient.invalidateQueries(["orders"])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "table_orders" },
        () => queryClient.invalidateQueries(["orders"])
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "table_orders" },
        () => queryClient.invalidateQueries(["orders"])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  // 🧭 Filter state
  const [filter, setFilter] = useState("All");

  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((order) => order.status === filter);

  // 💰 Payments state
  const [payments, setPayments] = useState({});

  const handlePaymentChange = (orderId, value) => {
    setPayments((prev) => ({
      ...prev,
      [orderId]: value === "" ? "" : parseFloat(value),
    }));
  };

  // 🔄 Update order status in Supabase + Optimistic Update
  async function updateStatus(orderId, newStatus) {
    try {
      // Optimistically update cache
      queryClient.setQueryData(["orders"], (old) =>
        old.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      const { error } = await supabase
        .from("table_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
    } catch (err) {
      console.error("❌ Update failed:", err.message);
      alert("Failed to update order status.");
      refetch(); // rollback
    }
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-4">🍳 Kitchen Orders</h3>

      {/* Filter Buttons */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <label className="form-label fw-bold me-2">Filter:</label>
        {["All", "Pending", "In Progress", "Complete"].map((status) => (
          <button
            key={status}
            className={`btn btn-sm ${
              filter === status ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        filteredOrders.map((order) => {
          const total =
            order.items?.reduce((sum, item) => sum + item.price * item.qty, 0) ||
            0;
          const paymentAmount = payments[order.id] || 0;
          const change = paymentAmount - total;

          return (
            <div key={order.id} className="card mb-3 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">
                  Order #{order.id}{" "}
                  <span
                    className={`badge ${
                      order.status === "Pending"
                        ? "bg-secondary"
                        : order.status === "In Progress"
                        ? "bg-warning text-dark"
                        : "bg-success"
                    }`}
                  >
                    {order.status}
                  </span>
                </h5>

                <p className="text-muted mb-1">
                  Placed on: {new Date(order.created_at).toLocaleString()}
                </p>
                <p className="mb-3">
                  <strong>Customer:</strong>{" "}
                  {order.profiles?.fullName || "Unknown User"}
                </p>

                <ul className="list-group mb-3">
                  {order.items?.map((item, idx) => (
                    <li
                      key={idx}
                      className="list-group-item d-flex justify-content-between"
                    >
                      {item.name} <span>₱{item.price} × {item.qty}</span>
                    </li>
                  ))}
                </ul>

                <h6>
                  <strong>Total:</strong> ₱{total.toFixed(2)}
                </h6>

                {/* Payment Calculator */}
                <div className="mt-3">
                  <label className="form-label">Amount Paid:</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount paid"
                    value={payments[order.id] || ""}
                    onChange={(e) =>
                      handlePaymentChange(order.id, e.target.value)
                    }
                  />
                  {payments[order.id] !== undefined && (
                    <p className="mt-2 fw-bold">
                      Change:{" "}
                      {change < 0 ? (
                        <span className="text-danger">
                          Insufficient Amount (₱{Math.abs(change).toFixed(2)} missing)
                        </span>
                      ) : (
                        <span className="text-success">₱{change.toFixed(2)}</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="mt-3">
                  {order.status === "Pending" && (
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => updateStatus(order.id, "In Progress")}
                    >
                      Mark In Progress
                    </button>
                  )}
                  {order.status === "In Progress" && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => updateStatus(order.id, "Completed")}
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
