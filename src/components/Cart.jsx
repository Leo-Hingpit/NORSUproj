import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';


export default function Cart({ session }) {
    const [cart, setCart] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => { loadCart(); fetchHistory(); }, [session]);


    function loadCart() {
        const c = JSON.parse(localStorage.getItem('cart') || '[]');
        setCart(c);
    }


    function changeQty(id, delta) {
        const c = cart.map(it => it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it);
        setCart(c); localStorage.setItem('cart', JSON.stringify(c));
    }


    function removeItem(id) {
        const c = cart.filter(it => it.id !== id);
        setCart(c); localStorage.setItem('cart', JSON.stringify(c));
    }


    async function placeOrder() {
        if (!session?.user) { alert('Please sign in first'); return; }
        if (cart.length === 0) { alert('Cart is empty'); return; }
        setLoading(true);
        const total = cart.reduce((s, it) => s + Number(it.price) * it.qty, 0);
        const order = { user_id: session.user.id, items: cart.map(it => ({ id: it.id, name: it.name, price: it.price, qty: it.qty })), total };
        const { error } = await supabase.from('orders').insert([order]);
        if (error) alert('Error placing order: ' + error.message); else {
            localStorage.removeItem('cart'); setCart([]); fetchHistory(); alert('Order placed');
        }
        setLoading(false);
    }


    async function fetchHistory() {
        if (!session?.user) return;
        const { data } = await supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        setHistory(data || []);
    }

    return (
        <div>
            <h3>Cart</h3>
            <div className="row">
                <div className="col-md-6">
                    <h5>Current</h5>
                    {cart.length === 0 && <div className="alert alert-secondary">Your cart is empty</div>}
                    {cart.map(it => (
                        <div key={it.id} className="card mb-2">
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{it.name}</strong><br /><small>₱{it.price}</small>
                                </div>
                                <div>
                                    <div className="btn-group me-2" role="group">
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => changeQty(it.id, -1)}>-</button>
                                        <button className="btn btn-sm btn-outline-secondary" disabled>{it.qty}</button>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => changeQty(it.id, +1)}>+</button>
                                    </div>
                                    <button className="btn btn-sm btn-danger" onClick={() => removeItem(it.id)}>Remove</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="mt-3">
                        <h5>Total: ₱{cart.reduce((s, it) => s + Number(it.price) * it.qty, 0)}</h5>
                        <button className="btn btn-primary" onClick={placeOrder} disabled={loading}>{loading ? 'Placing...' : 'Place Order'}</button>
                    </div>
                </div>


                <div className="col-md-6">
                    <h5>Order History</h5>
                    {history.length === 0 && <div className="text-muted">No past orders</div>}
                    {history.map(h => (
                        <div key={h.id} className="card mb-2">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <strong>Order {h.id}</strong><br />
                                        <small>{new Date(h.created_at).toLocaleString()}</small>
                                    </div>
                                    <div className="text-end">
                                        <div>₱{h.total}</div>
                                        <div className="badge bg-info">{h.status}</div>
                                    </div>
                                </div>
                                <hr />
                                <ul>
                                    {(h.items || []).map((it, i) => <li key={i}>{it.name} x{it.qty} — ₱{it.price}</li>)}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}