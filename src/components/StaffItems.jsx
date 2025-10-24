import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function StaffItems() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    available: true,
    image_url: "",
    imageFile: null,
  });

  // ✅ Fetch items (fast + cached behavior)
  async function fetchItems(showLog = true) {
    if (showLog) console.log("📌 Fetching items...");

    const { data, error } = await supabase
      .from("table_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Fetch error:", error.message);
      return;
    }

    setItems(data || []);
    if (showLog) console.log("✅ Items fetched:", data?.length);
  }

  // ✅ Realtime Updates
  function onRealtimeEvent(payload) {
    console.log("🔄 DB changed:", payload.eventType);
    fetchItems(false);
  }

  useEffect(() => {
    if (!hasFetched.current) {
      fetchItems();
      hasFetched.current = true;
    }

    const channel = supabase
      .channel("table_items_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_items" },
        (payload) => onRealtimeEvent(payload)
      )
      .subscribe((status) => {
        console.log("📡 Realtime status:", status);
        if (status === "SUBSCRIBED") fetchItems(false);
      });

    const handleFocus = () => {
      console.log("👀 Tab focused — refreshing...");
      fetchItems(false);
    };
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) handleFocus();
    });

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      available: true,
      image_url: "",
      imageFile: null,
    });
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      available: item.available,
      image_url: item.image_url,
      imageFile: null,
    });
  }

  // ✅ Upload to "items/items/" inside bucket
  async function uploadImage(file) {
    if (!file) return form.image_url;

    const ext = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `items/${fileName}`;

    console.log("📤 Uploading image:", filePath);

    const { error } = await supabase.storage
      .from("items")
      .upload(filePath, file);

    if (error) {
      console.error("❌ Upload failed:", error.message);
      alert("Upload failed: " + error.message);
      return form.image_url;
    }

    const { data } = supabase.storage
      .from("items")
      .getPublicUrl(filePath);

    console.log("✅ Image URL:", data.publicUrl);
    return data.publicUrl;
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = form.image_url;
      if (form.imageFile) {
        imageUrl = await uploadImage(form.imageFile);
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        available: form.available,
        image_url: imageUrl,
      };

      let res;
      if (editing) {
        res = await supabase
          .from("table_items")
          .update(payload)
          .eq("id", editing);
      } else {
        res = await supabase.from("table_items").insert([payload]);
      }

      if (res.error) throw res.error;

      fetchItems(false);
      openCreate();
    } catch (err) {
      console.error("❌ Save failed:", err.message);
    }

    setLoading(false);
  }

  async function remove(id) {
    if (!window.confirm("Delete this item?")) return;

    const { error } = await supabase
      .from("table_items")
      .delete()
      .eq("id", id);

    if (error) console.error("❌ Delete error:", error.message);
    else fetchItems(false);
  }

  async function toggleAvailable(item) {
    const { error } = await supabase
      .from("table_items")
      .update({ available: !item.available })
      .eq("id", item.id);

    if (error) console.error("❌ Toggle error:", error.message);
    else fetchItems(false);
  }

  return (
    <div>
      <h3>Manage Items</h3>
      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={openCreate}>
          Create New
        </button>
        <button className="btn btn-secondary" onClick={() => fetchItems(false)}>
          Refresh
        </button>
      </div>

      <div className="row">
        {/* Form */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5>{editing ? "Edit Item" : "Create Item"}</h5>

              <form onSubmit={save}>
                <input
                  className="form-control mb-2"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />

                <textarea
                  className="form-control mb-2"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />

                <input
                  className="form-control mb-2"
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  required
                />

                <label className="form-label">Image Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control mb-2"
                  onChange={(e) =>
                    setForm({ ...form, imageFile: e.target.files[0] })
                  }
                />

                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="mt-2"
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                )}

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={form.available}
                    onChange={(e) =>
                      setForm({ ...form, available: e.target.checked })
                    }
                  />
                  <label className="form-check-label">Available</label>
                </div>

                <button className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="col-md-6">
          <h5>Items List</h5>
          {items.map((it) => (
            <div key={it.id} className="card mb-2 shadow-sm">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  {it.image_url && (
                    <img
                      src={it.image_url}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                      alt="item"
                    />
                  )}

                  <div>
                    <strong>{it.name}</strong>
                    <br />
                    <small>{it.description}</small>
                    <br />
                    <small>₱{it.price}</small>
                  </div>
                </div>

                <div>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => openEdit(it)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-sm btn-outline-danger me-2"
                    onClick={() => remove(it.id)}
                  >
                    Delete
                  </button>

                  <button
                    className={`btn btn-sm ${
                      it.available ? "btn-success" : "btn-warning"
                    }`}
                    onClick={() => toggleAvailable(it)}
                  >
                    {it.available ? "Available" : "Unavailable"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
