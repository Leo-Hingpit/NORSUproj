// src/App.jsx
import React, { useEffect, useState } from "react";
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
import StudentOrderHistory from './components/StudentOrderHistory';
import StaffOrders from './components/StaffOrders';
import StudentMenu from './components/StudentMenu';
import Cart from './components/Cart';
import Navbar from './components/Navbar';
import {
  QueryClient,
} from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";


// 🧠 Create the QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      cacheTime: 1000 * 60 * 10, // cache for 10 min
    },
  },
});

// 💾 Create a persister (this uses sessionStorage so no extra library needed)
const persister = createSyncStoragePersister({
  storage: window.sessionStorage,
});

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <Router>
        <AppContent />
      </Router>
    </PersistQueryClientProvider>
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
      console.log("🔍 Checking for existing Supabase session...");
      try {
        timeout = setTimeout(() => {
          console.warn("⚠️ Session check timeout, continuing...");
          setLoadingSession(false);
        }, 3000);

        // ✅ Get session from Supabase
        const { data } = await supabase.auth.getSession();
        const current = data?.session;
        setSession(current);

        if (current?.user) {
          console.log("✅ Restored user:", current.user.email);
          await fetchProfile(current.user.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("💥 Session load error:", err);
      } finally {
        clearTimeout(timeout);
        setLoadingSession(false);
      }
    };

    initAuth();

    // ✅ Listen for login/logout/tab changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        console.log("🔄 Auth event fired", session);
        setSession(session);

        if (session?.user) await fetchProfile(session.user.id);
        else setProfile(null);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function fetchProfile(userId) {
    console.log("📄 Fetching profile:", userId);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("✅ Profile loaded:", data);

    setProfile(data);
    localStorage.setItem("profile", JSON.stringify(data));
  }

  function ProtectedRoute({ children, role }) {
    const savedSession = localStorage.getItem(
      "sb-afwetlctquuvyuefmjme-auth-token"
    );
    const savedProfile = localStorage.getItem("profile");

    const effectiveSession = session || (savedSession && JSON.parse(savedSession));
    const effectiveProfile = profile || (savedProfile && JSON.parse(savedProfile));

    if (loadingSession || (effectiveSession && !effectiveProfile)) {
      return (
        <div className="text-center mt-5">
          <div className="spinner-border"></div>
          <p>Loading profile...</p>
        </div>
      );
    }

    // 🚫 If logged out → redirect
    if (!effectiveSession)
      return <Navigate to="/admin" state={{ from: location }} replace />;

    // 🚫 Role mismatch
    if (role && effectiveProfile?.role !== role)
      return <Navigate to="/menu" replace />;

    return children;
  }

  if (loadingSession) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border"></div>
        <p>Checking session...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/student-auth" element={<StudentAuth />} />
          <Route path="/admin" element={<AdminAuth />} />

          {/* ✅ Student pages */}
          <Route
            path="/menu"
            element={<StudentMenu session={session} profile={profile} />}
          />
          <Route
            path="/orders/history"
            element={
              <ProtectedRoute role="student">
                <StudentOrderHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute role="student">
                <Cart session={session} profile={profile} />
              </ProtectedRoute>
            }
          />

          {/* ✅ Staff pages */}
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
