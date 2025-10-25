// src/components/StudentAuth.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    console.log("📌 Signing up user:", email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error("❌ Signup failed:", error.message);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setMessage("Signup incomplete. Check inbox for confirmation.");
      setLoading(false);
      return;
    }

    console.log("✅ Signup success. Saving profile...");

    // ✅ Insert profile row
    await supabase.from('profiles').upsert({
      id: user.id,
      fullName,
      role: 'student'
    });

    setMessage('✅ Signup successful! Please sign in.');
    setIsSignUp(false);
    setLoading(false);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    console.log("🔐 Signing in:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("❌ Sign in failed:", error.message);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    if (userId) {
      console.log("✅ Login success. Storing user_id:", userId);
      localStorage.setItem("user_id", userId);
    }

    setMessage("✅ Signed in successfully!");
    setLoading(false);
  }

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <h4 className="mb-3 text-center">
              {isSignUp ? "Student Sign Up" : "Student Sign In"}
            </h4>

            <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
              {isSignUp && (
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
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

              <div className="d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-primary"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                </button>

                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage('');
                  }}
                >
                  {isSignUp ? "Already have an account? Sign in" : "Create new account"}
                </button>
              </div>
            </form>

            {message && (
              <div className="alert alert-info mt-3">
                {message}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
