import React from 'react'; //new code
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ session, profile }) {
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/student-auth');
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
            <li className="nav-item">
              <Link className="nav-link" to="/menu">Menu</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/cart">Cart</Link>
            </li>

            {profile?.role === 'staff' && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin/dashboard">Admin Dashboard</Link>
              </li>
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
