import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { supabase } from './supabaseClient';
import StudentAuth from './components/StudentAuth';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './components/AdminDashboard';
import StaffOrders from './components/StaffOrders';
import StudentMenu from './components/StudentMenu';
import Cart from './components/Cart';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let timeout;
    const initAuth = async () => {
      console.log('🔍 Checking for existing Supabase session...');
      try {
        // Timeout fallback in case Supabase hangs
        timeout = setTimeout(() => {
          console.warn('⚠️ Session check timeout reached, continuing...');
          setLoadingSession(false);
        }, 4000);

        // ✅ Get saved session
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('❌ Error getting session:', error.message);

        const currentSession = data?.session;
        setSession(currentSession);

        if (currentSession?.user) {
          console.log('✅ Restored session:', currentSession.user.email);
          await fetchProfile(currentSession.user.id);
        } else {
          console.log('🚫 No active session found.');
          setProfile(null);
        }
      } catch (err) {
        console.error('💥 Exception during session load:', err.message);
      } finally {
        clearTimeout(timeout);
        setLoadingSession(false);
      }
    };

    initAuth();

    // ✅ Listen for login/logout/tab changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 Auth event: ${event}`, session);
        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function fetchProfile(userId) {
    console.log('📄 Fetching profile for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching profile:', error.message);
    } else {
      console.log('✅ Profile loaded:', data);
      setProfile(data);
    }
  }

  // ✅ Protect routes and prevent premature redirect
  function ProtectedRoute({ children, role }) {
    if (loadingSession) {
      return (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p>Checking session...</p>
        </div>
      );
    }

    if (!session) {
      console.warn('⚠️ No session found — redirecting to /admin');
      return <Navigate to="/admin" state={{ from: location }} replace />;
    }

    if (role && profile?.role !== role) {
      console.warn('⚠️ Unauthorized role — redirecting to /menu');
      return <Navigate to="/menu" replace />;
    }

    return children;
  }

  // ✅ Wait for Supabase before showing anything
  if (loadingSession) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p>Checking session...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar session={session} profile={profile} />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/student-auth" element={<StudentAuth />} />
          <Route path="/admin" element={<AdminAuth />} />

          {/* Student pages */}
          <Route
            path="/menu"
            element={<StudentMenu session={session} profile={profile} />}
          />
          <Route
            path="/cart"
            element={<Cart session={session} profile={profile} />}
          />

          {/* Admin/Staff pages */}
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
    </>
  );
}
