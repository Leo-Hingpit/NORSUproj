// src/components/StudentAuth.jsx new code
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      await supabase.from('profiles').upsert({ id: userId, fullName: fullName, role: 'student' });
    }
    setMessage('Signup successful! You can now sign in.');
    setLoading(false);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    setLoading(false);
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <h4>{isSignUp ? 'Student Sign Up' : 'Student Sign In'}</h4>
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
              {isSignUp && (
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-control"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
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
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <button className="btn btn-primary" disabled={loading} type="submit">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage('');
                  }}
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Create new account'}
                </button>
              </div>
            </form>
            {message && <div className="alert alert-info mt-3">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
