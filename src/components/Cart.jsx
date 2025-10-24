import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Cart({ session }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  }, []);

  function updateCart(newCart) {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  }

  function removeItem(id) {
    const updated = cart.filter((it) => it.id !== id);
    updateCart(updated);
  }

  function clearCart() {
    updateCart([]);
  }

  function calculateTotal() {
    return cart.reduce((sum, it) => sum + it.price * it.qty, 0).toFixed(2);
  }

  async function placeOrder() {
    if (!session?.user) {
      alert('Please sign in first!');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    setLoading(true);
    setMessage('');

    const orderData = {
      user_id: session.user.id,
      items: cart,
      total: parseFloat(calculateTotal()),
      status: 'Pending',
    };

    try {
      const { error } = await supabase.from('table_orders').insert([orderData]);
      if (error) throw error;

      clearCart();
      setMessage('✅ Order placed successfully!');
    } catch (err) {
      console.error('❌ Error placing order:', err.message);
      setMessage('Error placing order: ' + err.message);
    }

    setLoading(false);
  }

  return (
    <div>
      <h3>Your Cart</h3>
      {cart.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        <>
          <ul className="list-group mb-3">
            {cart.map((it) => (
              <li
                key={it.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{it.name}</strong> <br />
                  <small>₱{it.price} × {it.qty}</small>
                </div>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeItem(it.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <h5>Total: ₱{calculateTotal()}</h5>

          <button
            className="btn btn-success mt-3"
            onClick={placeOrder}
            disabled={loading}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>

          {message && <div className="alert alert-info mt-3">{message}</div>}
        </>
      )}
    </div>
  );
}
