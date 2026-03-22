import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const d = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      login(d.token, d.user);
      nav('/');
    } catch (e2) {
      setErr(e2.message || 'Registration failed');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Create account</h1>
        <p className="subtitle">Start tracking projects with your team</p>
        <form onSubmit={handleSubmit}>
          {err && <div className="form-error">{err}</div>}
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            Register
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.25), transparent);
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
        }
        .auth-card h1 {
          margin: 0 0 0.25rem;
          font-size: 1.75rem;
        }
        .subtitle {
          color: var(--muted);
          margin: 0 0 1.5rem;
          font-size: 0.95rem;
        }
        .auth-card form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .auth-card label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--muted);
        }
        .form-error {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .auth-footer {
          margin-top: 1.25rem;
          text-align: center;
          color: var(--muted);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
