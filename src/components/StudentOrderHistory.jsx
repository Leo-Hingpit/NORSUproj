// src/components/StudentOrderHistory.jsx
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";

export default function StudentOrderHistory() {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem("user_id");

  // 🔄 React Query: Cached fetch
  const {
    data: orders = [],
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: ["orderHistory", userId],
    queryFn: async () => {
      console.log("📌 Fetching order history for:", userId);

      const { data, error } = await supabase
        .from("table_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("✅ History:", data);
      return data;
    },
    enabled: !!userId,
    refetchOnWindowFocus: true, // ✅ reload if tab switches back
    staleTime: 1000 * 60, // ✅ 1 min cache
  });

  // ✅ Supabase realtime auto refresh
  React.useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_orders" },
        (payload) => {
          console.log("🔁 Realtime order update:", payload);
          queryClient.invalidateQueries(["orderHistory", userId]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient, userId]);

  if (!userId) {
    return (
      <div className="text-center mt-5">
        <p>You must be signed in to view orders.</p>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border"></div>
        <p>Loading order history...</p>
      </div>
    );

  return (
    <div className="container mt-4">
      <h3 className="mb-3">📜 Order History {isFetching && "(Refreshing...)"}</h3>

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
