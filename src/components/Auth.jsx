// filename: src/components/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';


export default function Auth() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');


    async function handleSignUp(e) {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { setMessage(error.message); setLoading(false); return; }
        // create profile row
        const userId = data.user?.id;
        if (userId) {
            await supabase.from('profiles').upsert({ id: userId, full_name: fullName, role });
        }
        setMessage('Check your email for a confirmation link (if email signup).');
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
                        <h4>{isSignUp ? 'Sign up' : 'Sign in'}</h4>
                        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                            {isSignUp && (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label">Full name</label>
                                        <input className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Role</label>
                                        <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                                            <option value="student">Student</option>
                                            <option value="staff">Staff</option>
                                        </select>
                                    </div>
                                </>
                            )}


                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>


                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>


                            <div className="d-flex justify-content-between align-items-center">
                                <button className="btn btn-primary" disabled={loading} type="submit">{isSignUp ? 'Create account' : 'Sign in'}</button>
                                <button type="button" className="btn btn-link" onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}>{isSignUp ? 'Have an account? Sign in' : 'Create an account'}</button>
                            </div>
                        </form>
                        {message && <div className="alert alert-info mt-3">{message}</div>}
                        <hr />
                        <div>
                            <small className="text-muted">This demo uses Supabase Auth. If you sign up as staff, your profile role will be saved in the profiles table. You may need to confirm email depending on your Supabase settings.</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}