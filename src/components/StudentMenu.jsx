import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function StudentMenu({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
  console.log("📦 Fetching menu items...");
  try {
    const { data, error } = await supabase
      .from("table_items") // ✅ Correct table name
      .select("*")
      .eq("available", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("✅ Items fetched:", data);
    setItems(data || []);
  } catch (err) {
    console.error("❌ Error fetching items:", err.message);
  } finally {
    setLoading(false);
  }
}

  function addToCart(item) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((c) => c.id === item.id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${item.name} added to cart 🛒`);
  }

  if (loading) {
    return <div className="text-center mt-5">⏳ Loading menu...</div>;
  }

  if (items.length === 0) {
    return <div className="text-center mt-5">🍽️ No available items right now.</div>;
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Menu</h3>
      <div className="row">
        {items.map((it) => (
          <div key={it.id} className="col-md-4 mb-3">
            <div className="card h-100 shadow-sm">
              {it.image_url ? (
                <img
                  src={it.image_url}
                  className="card-img-top"
                  alt={it.name}
                  style={{ height: 180, objectFit: "cover" }}
                />
              ) : (
                <div
                  className="bg-light d-flex align-items-center justify-content-center"
                  style={{ height: 180 }}
                >
                  <span className="text-muted">No Image</span>
                </div>
              )}

              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{it.name}</h5>
                <p className="card-text text-muted">{it.description}</p>

                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <strong>₱{it.price}</strong>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => addToCart(it)}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
