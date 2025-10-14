import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import StudentAuth from './components/StudentAuth';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './components/AdminDashboard';
import StaffOrders from './components/StaffOrders';
import StudentMenu from './components/StudentMenu';
import Cart from './components/Cart';
import Navbar from './components/Navbar';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) await fetchProfile(data.session.user.id);
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session);
      if (session?.user) await fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  }

  function ProtectedRoute({ children, role }) {
    if (!session) return <Navigate to="/admin" replace />;
    if (role && profile?.role !== role) return <Navigate to="/menu" replace />;
    return children;
  }

  return (
    <Router>
      <Navbar session={session} profile={profile} />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/student-auth" element={<StudentAuth />} />
          <Route path="/admin" element={<AdminAuth />} />

          {/* Student pages */}
          <Route path="/menu" element={<StudentMenu session={session} profile={profile} />} />
          <Route path="/cart" element={<Cart session={session} profile={profile} />} />

          {/* Admin pages */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="staff">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/orders"
            element={
              <ProtectedRoute role="staff">
                <StaffOrders />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </div>
    </Router>
  );
}
