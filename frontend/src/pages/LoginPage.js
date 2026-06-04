import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Plane } from 'lucide-react';
import '../styles/auth.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand"><Plane size={40} /><span>DataArt Travel</span></div>
        <h2>Welcome Back!</h2>
        <p>Log in to access your bookings, exclusive deals, and wallet balance.</p>
        <div className="auth-benefits">
          {['✈ Exclusive member fares', '🏨 Saved hotel preferences', '💰 Wallet & cashback rewards', '📋 Easy booking management'].map(b => <div key={b} className="auth-benefit">{b}</div>)}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Login or Create Account</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="pass-input-wrap">
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" className="show-pass" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <a href="#" className="forgot-link">Forgot Password?</a>
            <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
          <div className="auth-divider"><span>or continue with</span></div>
          <div className="social-auth">
            <button className="social-btn">G Google</button>
            <button className="social-btn">f Facebook</button>
          </div>
          <div className="auth-switch">Don't have an account? <Link to="/register">Sign Up</Link></div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand"><Plane size={40} /><span>DataArt Travel</span></div>
        <h2>Join DataArt Travel</h2>
        <p>Create an account and unlock exclusive travel deals, wallet rewards, and more.</p>
        <div className="auth-benefits">
          {['🎁 Welcome bonus in wallet', '✈ Special first-booking offer', '🏆 Loyalty points on every trip', '📧 Personalised deal alerts'].map(b => <div key={b} className="auth-benefit">{b}</div>)}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Create Your Account</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
            ].map(f => (
              <div className="form-group" key={f.key}>
                <label>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.key !== 'phone'} />
              </div>
            ))}
            <div className="form-group">
              <label>Password</label>
              <div className="pass-input-wrap">
                <input type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" className="show-pass" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</button>
          </form>
          <div className="auth-switch">Already have an account? <Link to="/login">Login</Link></div>
          <div className="auth-terms">By registering, you agree to our <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a></div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
