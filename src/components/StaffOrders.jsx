import React, { useEffect } from "react";
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

  // 🧠 Use React Query for caching
  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    staleTime: 0, // always stale, forces fresh fetch on reload
    cacheTime: 1000 * 60 * 5, // keeps cache for 5 min (tab switch safe)
    refetchOnMount: "always", // always refetch when the component mounts (reload)
    refetchOnWindowFocus: true, // refetch when user switches back to the tab
    refetchInterval: 5000, // optional auto-refresh every 5 seconds
  });

  // 🔁 Supabase realtime updates
  useEffect(() => {
  const channel = supabase
    .channel("orders-realtime")
    // 👇 Listen specifically for INSERT, UPDATE, DELETE events
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "table_orders" },
      (payload) => {
        console.log("🟢 New order received:", payload.new);
        queryClient.invalidateQueries(["orders"]);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "table_orders" },
      (payload) => {
        console.log("🟡 Order updated:", payload.new);
        queryClient.invalidateQueries(["orders"]);
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "table_orders" },
      (payload) => {
        console.log("🔴 Order deleted:", payload.old);
        queryClient.invalidateQueries(["orders"]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [queryClient]);

  // 🧭 Filter state
  const [filter, setFilter] = React.useState("All");

  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((order) => order.status === filter);

  // 🔄 Update order status in Supabase + Optimistic Update
  async function updateStatus(orderId, newStatus) {
    console.log(`⚙️ Updating order ${orderId} → ${newStatus}`);
    try {
      // Optimistically update cache first
      queryClient.setQueryData(["orders"], (old) =>
        old.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      const { error } = await supabase
        .from("table_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      console.log(`✅ Order ${orderId} updated successfully`);
    } catch (err) {
      console.error("❌ Update failed:", err.message);
      alert("Failed to update order status.");
      refetch(); // rollback if error
    }
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-4">🍳 Kitchen Orders</h3>

      {/* 🧭 Filter Buttons */}
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
        <p>No orders to display.</p>
      ) : (
        filteredOrders.map((order) => (
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

              <div className="mt-3">
                {order.status === "Pending" && (
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => updateStatus(order.id, "In Progress")}
                  >
                    Mark In Progress
                  </button>
                )}
                {order.status === "In Progress" && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => updateStatus(order.id, "Complete")}
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
