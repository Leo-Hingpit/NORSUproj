// src/components/AdminAuth.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🧹 On load: if already logged in, redirect to dashboard
  useEffect(() => {
    async function checkExistingSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('✅ Existing staff session detected, redirecting to dashboard...');
        navigate('/admin/dashboard');
      }
    }
    checkExistingSession();
  }, [navigate]);

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 🔥 Clear any previous session
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error('No user ID returned.');

      // Add staff profile
      const { error: insertError } = await supabase.from('profiles').upsert({
        id: userId,
        fullName,
        role: 'staff',
      });
      if (insertError) throw insertError;

      setMessage('✅ Account created successfully! You can now sign in.');
    } catch (err) {
      console.error('❌ Signup failed:', err);
      setMessage(err.message);
    }

    setLoading(false);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 🔥 Clear any old session before logging in
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('No user returned from sign-in.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.role !== 'staff') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Only staff accounts can log in here.');
      }

      console.log('✅ Staff verified, redirecting...');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('❌ Signin error:', err);
      setMessage(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="text-center mb-4">{isSignUp ? 'Staff Sign Up' : 'Staff Sign In'}</h3>

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                {isSignUp && (
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-control"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                  {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-3">
                <button
                  className="btn btn-link"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Create a staff account'}
                </button>
              </div>

              {message && <div className="alert alert-info mt-3">{message}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
