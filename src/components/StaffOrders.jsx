import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';


export default function StudentMenu({ session }) {
    const [items, setItems] = useState([]);


    useEffect(() => { fetchItems(); }, []);


    async function fetchItems() {
        const { data, error } = await supabase.from('items').select('*').eq('available', true).order('created_at', { ascending: false });
        if (!error) setItems(data || []);
    }


    function addToCart(item) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const found = cart.find(c => c.id === item.id);
        if (found) found.qty += 1; else cart.push({ ...item, qty: 1 });
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Added to cart');
    }

    return (
        <div>
            <h3>Menu</h3>
            <div className="row">
                {items.map(it => (
                    <div key={it.id} className="col-md-4 mb-3">
                        <div className="card h-100">
                            {it.image_url && <img src={it.image_url} className="card-img-top" alt={it.name} style={{ height: 180, objectFit: 'cover' }} />}
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{it.name}</h5>
                                <p className="card-text">{it.description}</p>
                                <div className="mt-auto d-flex justify-content-between align-items-center">
                                    <strong>₱{it.price}</strong>
                                    <button className="btn btn-sm btn-primary" onClick={() => addToCart(it)}>Add</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}