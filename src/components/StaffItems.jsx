import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function StaffItems() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '', available: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setItems(data || []);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', image_url: '', available: true });
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm(item);
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    if (editing) {
      const { error } = await supabase.from('items').update({ ...form }).eq('id', editing);
      if (!error) await fetchItems();
    } else {
      const id = uuidv4();
      const { error } = await supabase.from('items').insert([{ id, ...form }]);
      if (!error) await fetchItems();
    }
    setLoading(false);
  }

  async function remove(id) {
    if (!window.confirm('Delete item?')) return;
    await supabase.from('items').delete().eq('id', id);
    await fetchItems();
  }

  async function toggleAvailable(item) {
    await supabase.from('items').update({ available: !item.available }).eq('id', item.id);
    await fetchItems();
  }

  return (
    <div>
      <h3>Manage Items</h3>
      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={openCreate}>Create New</button>
        <button className="btn btn-secondary" onClick={fetchItems}>Refresh</button>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5>{editing ? 'Edit Item' : 'Create Item'}</h5>
              <form onSubmit={save}>
                <div className="mb-2">
                  <input className="form-control" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-2">
                  <textarea className="form-control" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="mb-2">
                  <input className="form-control" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="mb-2">
                  <input className="form-control" placeholder="Image URL (optional)" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                </div>
                <div className="mb-2 form-check">
                  <input type="checkbox" className="form-check-input" id="avail" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
                  <label className="form-check-label" htmlFor="avail">Available</label>
                </div>
                <button className="btn btn-primary" disabled={loading} type="submit">Save</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <h5>Items List</h5>
          {items.map(it => (
            <div key={it.id} className="card mb-2">
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <strong>{it.name}</strong> <br />
                  <small>{it.description}</small><br />
                  <small>₱{it.price}</small>
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(it)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger me-2" onClick={() => remove(it.id)}>Delete</button>
                  <button className={`btn btn-sm ${it.available ? 'btn-success' : 'btn-warning'}`} onClick={() => toggleAvailable(it)}>
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
