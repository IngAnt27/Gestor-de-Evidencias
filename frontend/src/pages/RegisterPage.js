import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const RegisterPage = ({ onSwitch }) => {
  const { register, loading, error } = useContext(AuthContext);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('consulta');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      await register({ nombre, email, password, rol });
      setMessage('Registro realizado. Por favor inicia sesión.');
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('consulta');
    } catch (err) {
      setMessage(err.message || 'No se pudo registrar');
    }
  };

  return (
    <div className="page auth-page">
      <div className="card auth-card">
        <h2>Registro</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre completo
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Nombre completo"
            />
          </label>
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
          <label>
            Rol
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="consulta">Consulta</option>
              <option value="investigador">Investigador</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          {(message || error) && <p className="error">{message || error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : 'Registrar cuenta'}
          </button>
        </form>
        <div className="footer-link">
          <span>¿Ya tienes cuenta?</span>
          <button className="link-btn" onClick={onSwitch}>Ir a ingreso</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
