import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const LoginPage = ({ onSwitch }) => {
  const { login, loading, error } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      await login({ email, password });
    } catch (err) {
      setMessage(err.message || 'No se pudo iniciar sesión');
    }
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h2>Ingreso</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="usuario@dominio.com"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {(message || error) && <p className="error">{message || error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </form>
        <div className="footer-link">
          <span>¿No tienes cuenta?</span>
          <button className="link-btn" onClick={onSwitch}>Crear cuenta</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
