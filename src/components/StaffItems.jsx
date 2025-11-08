// src/components/StaffItems.jsx
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function StaffItems() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    available: true,
    image_url: "",
    imageFile: null,
  });

  // ✅ Fetch items using React Query
  const {
    data: items = [],
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("table_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
  });

  // ✅ Enable realtime refresh
  useEffect(() => {
    const channel = supabase
      .channel("realtime-items")
      .on("*", { schema: "public", table: "table_items" }, () => {
        console.log("🔄 Realtime Update Triggered");
        queryClient.invalidateQueries(["items"]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  // ✅ Upload images to Supabase Storage
  async function uploadImage(file) {
    if (!file) return form.image_url;

    const ext = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `items/${fileName}`;

    const { error } = await supabase.storage.from("items").upload(filePath, file);
    if (error) {
      alert("Upload failed: " + error.message);
      return form.image_url;
    }

    const { data } = supabase.storage.from("items").getPublicUrl(filePath);
    return data.publicUrl;
  }

  // ✅ Save / Update item
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

      console.log("📝 Payload:", payload, "Editing ID:", editing);

      let res;
      if (editing) {
        // ✅ Must include primary key OR RLS blocks update
        res = await supabase
          .from("table_items")
          .update({ ...payload, id: editing })
          .eq("id", editing);
      } else {
        res = await supabase.from("table_items").insert([payload]);
      }

      if (res.error) throw res.error;

      console.log("✅ Save successful");
      queryClient.invalidateQueries(["items"]);
      openCreate();
    } catch (err) {
      console.error("❌ Save failed:", err.message);
      alert("Failed to save: " + err.message);
    }

    setLoading(false);
  }

  // ✅ Reset form for new item
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

  // ✅ Load selected item into form
  function openEdit(item) {
    console.log("✏️ Editing Item:", item);
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

  // ✅ Delete item
  async function remove(id) {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    const { error } = await supabase.from("table_items").delete().eq("id", id);
    if (error) console.error("❌ Delete error:", error.message);
    else queryClient.invalidateQueries(["items"]);
  }

  // ✅ Toggle available state
  async function toggleAvailable(item) {
    await supabase
      .from("table_items")
      .update({ available: !item.available })
      .eq("id", item.id);

    queryClient.invalidateQueries(["items"]);
  }

  return (
    <div>
      <h3>Manage Items</h3>

      <div className="row">
        {/* ✅ Form Section */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5>{editing ? "✏️ Edit Item" : "➕ Create Item"}</h5>

              <form onSubmit={save}>
                <input
                  className="form-control mb-2"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  {loading ? "Saving..." : editing ? "Update" : "Save"}
                </button>

                {editing && (
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={openCreate}
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ✅ Items List */}
        <div className="col-md-6">
          <h5>Items List {isFetching && "(Refreshing...)"}</h5>

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

          {items.length === 0 && <p>No items found.</p>}
        </div>
      </div>
    </div>
  );
}
