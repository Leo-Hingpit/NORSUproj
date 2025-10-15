import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function StaffItems() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    imageFile: null,
    image_url: '',
    available: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setItems(data || []);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      price: '',
      imageFile: null,
      image_url: '',
      available: true
    });
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      imageFile: null,
      available: item.available
    });
  }

  async function uploadImage(file) {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload image to the 'items' bucket
    const { error: uploadError } = await supabase.storage
      .from('items')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ Error uploading image:', uploadError.message);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage.from('items').getPublicUrl(filePath);
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

      const itemData = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        available: form.available,
        image_url: imageUrl
      };

      if (editing) {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', editing);
        if (error) throw error;
      } else {
        const id = uuidv4();
        const { error } = await supabase
          .from('items')
          .insert([{ id, ...itemData }]);
        if (error) throw error;
      }

      await fetchItems();
      openCreate();
    } catch (err) {
      console.error('❌ Save failed:', err.message);
    }

    setLoading(false);
  }

  async function remove(id) {
    if (!window.confirm('Delete this item?')) return;
    await supabase.from('items').delete().eq('id', id);
    await fetchItems();
  }

  async function toggleAvailable(item) {
    await supabase
      .from('items')
      .update({ available: !item.available })
      .eq('id', item.id);
    await fetchItems();
  }

  return (
    <div>
      <h3>Manage Items</h3>
      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={openCreate}>
          Create New
        </button>
        <button className="btn btn-secondary" onClick={fetchItems}>
          Refresh
        </button>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5>{editing ? 'Edit Item' : 'Create Item'}</h5>
              <form onSubmit={save}>
                <div className="mb-2">
                  <input
                    className="form-control"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-2">
                  <textarea
                    className="form-control"
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div className="mb-2">
                  <input
                    className="form-control"
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Image Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) =>
                      setForm({ ...form, imageFile: e.target.files[0] })
                    }
                  />
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="mt-2"
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  )}
                </div>
                <div className="mb-2 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="avail"
                    checked={form.available}
                    onChange={(e) =>
                      setForm({ ...form, available: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="avail">
                    Available
                  </label>
                </div>
                <button className="btn btn-primary" disabled={loading} type="submit">
                  {loading ? 'Processing...' : 'Save'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <h5>Items List</h5>
          {items.map((it) => (
            <div key={it.id} className="card mb-2">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {it.image_url && (
                    <img
                      src={it.image_url}
                      alt={it.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  )}
                  <div>
                    <strong>{it.name}</strong> <br />
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
                      it.available ? 'btn-success' : 'btn-warning'
                    }`}
                    onClick={() => toggleAvailable(it)}
                  >
                    {it.available ? 'Available' : 'Unavailable'}
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
