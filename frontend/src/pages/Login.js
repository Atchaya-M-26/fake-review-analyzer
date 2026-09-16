import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [mode, setMode] = useState('login'); // login or register
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' 
        ? { username, password }
        : { username, email, password };

      const response = await axios.post(`${API_URL}${endpoint}`, payload);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Dispatch custom event to update Navbar
        window.dispatchEvent(new Event('userLoggedIn'));
        navigate('/dashboard');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-visual">
          <div className="visual-brand">Review Trust Lab</div>
          <div className="visual-copy">
            <p className="visual-kicker">Fake review analysis</p>
            <h1>
              Sign in to review
              <br />
              trust scores.
            </h1>
          </div>

          <div className="visual-graphic" aria-hidden="true">
            <span className="orb orb-one" />
            <span className="orb orb-two" />
            <span className="orb orb-three" />
            <span className="wave wave-one" />
            <span className="wave wave-two" />
            <span className="wave wave-three" />
          </div>

          <div className="visual-footer">
            <span>Sentiment</span>
            <span>Patterns</span>
            <span>Confidence</span>
          </div>
        </aside>

        <section className="login-card">
          <div className="login-header">
            <p className="login-eyebrow">Review Trust Lab</p>
            <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <p>
              {mode === 'login'
                ? 'Access your saved review analyses and continue checking trust scores.'
                : 'Create an account to save analyses, compare scores, and track suspicious reviews.'}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="name-row">
              {mode === 'register' && (
                <>
                  <div className="form-group">
                    <label>First name</label>
                    <input type="text" placeholder="First name" autoComplete="given-name" />
                  </div>
                  <div className="form-group">
                    <label>Last name</label>
                    <input type="text" placeholder="Last name" autoComplete="family-name" />
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter email"
                  autoComplete="email"
                />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Loading...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="divider">
            <span>or continue with email</span>
          </div>

          <div className="social-row">
            <button type="button" className="social-btn">Google</button>
            <button type="button" className="social-btn">Facebook</button>
          </div>

          <div className="mode-toggle">
            <p>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
