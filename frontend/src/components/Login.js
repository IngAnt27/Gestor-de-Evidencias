import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../services/api';
import './Login.css';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.msg || 'Error en el login');
      }
    } catch (error) {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-title">Iniciar Sesion</h1>
          <p className="login-subtitle">Accede al panel seguro de gestion de evidencias.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="login-field">
            <label htmlFor="password">Contrasena</label>
            <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="login-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar Sesion'}
            </button>
          </div>

          <div className="login-meta">
            <span>No tienes cuenta?</span>
            <Link to="/register">Registrate aqui</Link>
          </div>
        </form>

        <div className="login-footer">
          <p>
            Accede siempre con credenciales seguras y protege la cadena de custodia digital de tus evidencias.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
