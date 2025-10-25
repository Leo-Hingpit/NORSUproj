import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function StudentMenu({ session, profile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isStaff = profile?.role === "staff";

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data } = await supabase
      .from("table_items")
      .select("*")
      .eq("available", true)
      .order("created_at", { ascending: false });

    setItems(data || []);
    setLoading(false);
  }

  function addToCart(item) {
    if (!session || isStaff) {
      alert("Please login as a student to order!");
      navigate("/student-auth");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const found = cart.find((c) => c.id === item.id);

    if (found) found.qty += 1;
    else cart.push({ ...item, qty: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${item.name} added to cart 🛒`);
  }

  if (loading) return <div className="text-center mt-5">⏳ Loading...</div>;

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Menu</h3>

      <div className="row">
        {items.map((it) => (
          <div key={it.id} className="col-md-4 mb-3">
            <div className="card h-100 shadow-sm">

              {it.image_url ? (
                <img src={it.image_url} className="card-img-top" style={{ height: 180, objectFit: "cover" }} />
              ) : (
                <div className="bg-light d-flex justify-content-center align-items-center" style={{ height: 180 }}>
                  <span className="text-muted">No Image</span>
                </div>
              )}

              <div className="card-body d-flex flex-column">
                <h5>{it.name}</h5>
                <p className="text-muted">{it.description}</p>

                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <strong>₱{it.price}</strong>

                  {/* ✅ Hide Add button for staff */}
                  {!isStaff && (
                    <button className="btn btn-sm btn-primary" onClick={() => addToCart(it)}>
                      Add
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
