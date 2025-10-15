import React, { useState } from 'react';
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

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    console.log('🔹 handleSignUp() called');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Full name:', fullName);

    try {
      console.log('➡️ Calling supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({ email, password });
      console.log('📬 Signup response:', { data, error });

      if (error) {
        console.error('❌ Supabase signup error:', error);
        setMessage(`Signup failed: ${error.message}`);
        setLoading(false);
        return;
      }

      const userId = data?.user?.id;
      console.log('🆔 New user ID:', userId);

      if (!userId) {
        console.warn('⚠️ No user ID returned from Supabase signup.');
        setMessage('Signup failed: No user ID returned.');
        setLoading(false);
        return;
      }

      console.log('📝 Inserting into profiles table...');
      const { error: insertError } = await supabase.from('profiles').upsert({
        id: userId,
        fullName: fullName,
        role: 'staff',
      });

      if (insertError) {
        console.error('❌ Error inserting profile:', insertError);
        setMessage(`Profile insert failed: ${insertError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Profile successfully inserted!');
      setMessage('Account created successfully. You can now sign in.');
    } catch (err) {
      console.error('💥 Unexpected error during signup:', err);
      setMessage('Unexpected error: ' + err.message);
    }

    setLoading(false);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    console.log('🔹 handleSignIn() called');
    console.log('📧 Email:', email);

    try {
      console.log('➡️ Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('📬 Signin response:', { data, error });

      if (error) {
        console.error('❌ Signin error:', error);
        setMessage(`Signin failed: ${error.message}`);
        setLoading(false);
        return;
      }

      const user = data.user;
      console.log('👤 Logged in user:', user);

      if (user) {
        console.log('➡️ Checking role in profiles table...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        console.log('📄 Profile lookup:', { profile, profileError });

        if (profileError) {
          console.error('❌ Error fetching profile:', profileError);
          setMessage('Error fetching profile info.');
          setLoading(false);
          return;
        }

        if (profile?.role !== 'staff') {
          console.warn('⚠️ Access denied: non-staff user tried to log in');
          await supabase.auth.signOut();
          setMessage('Access denied. Only staff accounts can log in here.');
          setLoading(false);
          return;
        }

        console.log('✅ Staff verified, navigating to /admin/dashboard');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('💥 Unexpected error during signin:', err);
      setMessage('Unexpected error: ' + err.message);
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
