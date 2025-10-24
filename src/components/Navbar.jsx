// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);

  // 🧠 Load session + profile from localStorage on mount
 useEffect(() => {
    function loadFromStorage() {
      try {
        const savedProfile = localStorage.getItem('profile');
        const savedSession = localStorage.getItem('sb-afwetlctquuvyuefmjme-auth-token');

        setProfile(savedProfile ? JSON.parse(savedProfile) : null);
        setSession(savedSession ? JSON.parse(savedSession) : null);
      } catch (err) {
        console.error('⚠️ Failed to parse localStorage data:', err);
      }
    }

    // ✅ Load initially
    loadFromStorage();

    // ✅ Listen for changes (like login)
    window.addEventListener('storage', loadFromStorage);

    // ✅ Also check every 1s (helps in single-tab apps)
    const interval = setInterval(loadFromStorage, 1000);

    // ✅ Cleanup
    return () => {
      window.removeEventListener('storage', loadFromStorage);
      clearInterval(interval);
    };
  }, []);

  async function signOut() {
    console.log('🧭 Sign-out button clicked');

    try {
      // Start Supabase sign out in background
      supabase.auth.signOut().then(({ error }) => {
        if (error) console.error('❌ Supabase signOut error:', error.message);
        else console.log('✅ Supabase signOut completed in background');
      });

      // 🔥 Instantly clear local/session tokens
      console.log('🧹 Clearing local storage...');
      localStorage.clear();
      sessionStorage.clear();

      // Navigate immediately
      console.log('➡️ Redirecting to /admin...');
      navigate('/admin', { replace: true });

      // Force reload to reset state
      setTimeout(() => {
        console.log('🔄 Hard reload for fresh state...');
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('💥 Sign-out failed:', error);
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          🍽️ Canteen
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navmenu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navmenu">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/menu">Menu</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/cart">Cart</Link></li>

            {profile?.role === 'staff' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/dashboard">Admin Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/staff/orders">Orders</Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center">
            {session?.user ? (
              <>
                <span className="me-3 text-muted">
                  {profile?.full_name || session.user.email}
                </span>
                <button className="btn btn-outline-danger" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : (
              <Link className="btn btn-primary" to="/student-auth">
                Student Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
