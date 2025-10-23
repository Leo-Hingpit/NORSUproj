import React, { useEffect, useState, useRef } from 'react';
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
    available: true,
  });
  const [loading, setLoading] = useState(false);
  const hasFetchedOnce = useRef(false); // Prevent redundant fetches

  // ✅ Fast fetch with caching behavior
  async function fetchItems(showLog = true) {
    if (showLog) console.log('📦 Fetching items...');
    const { data, error } = await supabase
      .from('table_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch error:', error.message);
      return;
    }

    setItems(data || []);
    if (showLog) console.log(`✅ Fetched ${data?.length || 0} items`);
  }

  // ✅ Handle realtime table changes
  function handleRealtimeUpdate(payload) {
    console.log('🔄 Realtime event:', payload.eventType);
    fetchItems(false);
  }

  useEffect(() => {
    // Fetch once when mounted
    if (!hasFetchedOnce.current) {
      fetchItems();
      hasFetchedOnce.current = true;
    }

    // ✅ Subscribe to realtime changes
    const channel = supabase
      .channel('table_items_realtime_fast')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_items' },
        (payload) => handleRealtimeUpdate(payload)
      )
      .subscribe((status) => {
        console.log('🔌 Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('🟢 Reconnected — refreshing data...');
          fetchItems(false);
        }
      });

    // ✅ Re-fetch when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 Tab focused — refreshing data...');
        fetchItems(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ✅ Heartbeat to keep Supabase session alive (every 5 mins)
    const heartbeat = setInterval(async () => {
      await supabase.auth.getSession();
    }, 300000);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
    };
  }, []);

  // ✅ Reset form for new item
  function openCreate() {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      price: '',
      imageFile: null,
      image_url: '',
      available: true,
    });
  }

  // ✅ Load item into edit form
  function openEdit(item) {
    setEditing(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      imageFile: null,
      available: item.available,
    });
  }

  // ✅ Upload image to Supabase bucket 'item'
  async function uploadImage(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    console.log('📤 Uploading image to Supabase bucket: item');
    const { error: uploadError } = await supabase.storage.from('item').upload(filePath, file);
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('item').getPublicUrl(filePath);
    console.log('✅ Image uploaded:', data.publicUrl);
    return data.publicUrl;
  }

  // ✅ Save (insert/update) item
  async function save(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = form.image_url;
      if (form.imageFile) imageUrl = await uploadImage(form.imageFile);

      const itemData = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        available: form.available,
        image_url: imageUrl,
      };

      const { error } = editing
        ? await supabase.from('table_items').update(itemData).eq('id', editing)
        : await supabase.from('table_items').insert([itemData]);

      if (error) throw error;

      await fetchItems(false);
      openCreate();
    } catch (err) {
      console.error('❌ Save failed:', err.message);
    }

    setLoading(false);
  }

  async function remove(id) {
    if (!window.confirm('Delete this item?')) return;
    const { error } = await supabase.from('table_items').delete().eq('id', id);
    if (error) console.error('❌ Delete error:', error.message);
    else fetchItems(false);
  }

  async function toggleAvailable(item) {
    const { error } = await supabase
      .from('table_items')
      .update({ available: !item.available })
      .eq('id', item.id);
    if (error) console.error('❌ Toggle error:', error.message);
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
        {/* 📝 Form Section */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5>{editing ? 'Edit Item' : 'Create Item'}</h5>
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
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <input
                  className="form-control mb-2"
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
                <label className="form-label">Image Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control mb-2"
                  onChange={(e) => setForm({ ...form, imageFile: e.target.files[0] })}
                />
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="mt-2"
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                )}
                <div className="form-check mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="avail"
                    checked={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="avail">
                    Available
                  </label>
                </div>
                <button className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Save'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 📋 Items List Section */}
        <div className="col-md-6">
          <h5>Items List</h5>
          {items.map((it) => (
            <div key={it.id} className="card mb-2 shadow-sm">
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
                    <strong>{it.name}</strong>
                    <br />
                    <small>{it.description}</small>
                    <br />
                    <small>₱{it.price}</small>
                  </div>
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(it)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger me-2" onClick={() => remove(it.id)}>
                    Delete
                  </button>
                  <button
                    className={`btn btn-sm ${it.available ? 'btn-success' : 'btn-warning'}`}
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
