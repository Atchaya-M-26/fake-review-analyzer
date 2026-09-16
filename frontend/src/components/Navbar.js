import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Listen for custom login/logout events
    const handleUserChange = () => {
      const updatedUser = localStorage.getItem('user');
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      } else {
        setUser(null);
      }
    };

    window.addEventListener('userLoggedIn', handleUserChange);
    window.addEventListener('userLoggedOut', handleUserChange);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserChange);
      window.removeEventListener('userLoggedOut', handleUserChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Dispatch custom event
    window.dispatchEvent(new Event('userLoggedOut'));
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Fake Review Analyzer
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Home</Link>
          </li>
          {user && (
            <>
              <li className="nav-item">
                <Link to="/analyzer" className="nav-link">Analyze</Link>
              </li>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
              </li>
            </>
          )}
          <li className="nav-item">
            {user ? (
              <div className="user-menu">
                <span className="username">{user.username}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="nav-link login-link">Login</Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
