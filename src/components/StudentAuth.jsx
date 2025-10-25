// src/components/StudentAuth.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from "react-router-dom";

export default function StudentAuth() {
  const navigate = useNavigate();
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

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setMessage("Signup complete — check your email to confirm.");
      setLoading(false);
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      fullName,
      role: "student"
    });

    setMessage("✅ Signup successful! Please sign in.");
    setIsSignUp(false);
    setLoading(false);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    if (userId) {
      localStorage.setItem("user_id", userId);
      console.log("✅ Logged in:", userId);
    }

    setMessage("✅ Signed in successfully!");

    // ✅ Redirect to the Menu page
    setTimeout(() => {
      navigate("/menu");
    }, 300); // slight delay so the alert can show

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
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Processing..." :
                    isSignUp ? "Sign Up" : "Sign In"}
                </button>

                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage('');
                  }}
                >
                  {isSignUp ? "Already have an account? Sign in"
                    : "Create new account"}
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
