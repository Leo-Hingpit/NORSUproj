// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // ✅ Load on first render
    async function loadAuth() {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session || null);

      const savedProfile = localStorage.getItem("profile");
      if (savedProfile) setProfile(JSON.parse(savedProfile));
    }

    loadAuth();

    // ✅ Live auth listener!
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        if (!session) {
          setProfile(null);
          localStorage.removeItem("profile");
          return;
        }

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(userProfile);
        localStorage.setItem("profile", JSON.stringify(userProfile));
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/admin", { replace: true });
    setTimeout(() => window.location.reload(), 100);
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">🍽️ Canteen</Link>

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

            {/* ✅ Menu always visible */}
            <li className="nav-item">
              <Link className="nav-link" to="/menu">Menu</Link>
            </li>

            {/* ✅ Student-only */}
            {profile?.role === "student" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/cart">Cart</Link>
                </li>
                <li className="nav-item">
                  {/* ✅ Fixed the incorrect route */}
                  <Link className="nav-link" to="/orders/history">Order History</Link>
                </li>
              </>
            )}

            {/* ✅ Staff-only */}
            {profile?.role === "staff" && (
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

          {/* ✅ Sign-in / profile */}
          <div className="d-flex align-items-center">
            {session?.user ? (
              <>
                <span className="me-3 text-muted">
                  {profile?.fullName || session.user.email}
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
