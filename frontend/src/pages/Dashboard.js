import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Gestor de Evidencias Digitales</h1>
          <div className="user-info">
            <span className="user-name">Bienvenido, {user.nombre}</span>
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      <main className="dashboard-main">
        <nav className="dashboard-nav">
          <Link to="/evidencias" className="nav-link">
            <span className="icon">📋</span>
            <span>Gestión de Evidencias</span>
          </Link>
          <Link to="/cadena-custodia" className="nav-link">
            <span className="icon">🔒</span>
            <span>Cadena de Custodia</span>
          </Link>
          <Link to="/reportes" className="nav-link">
            <span className="icon">📊</span>
            <span>Reportes</span>
          </Link>
          <Link to="/configuracion" className="nav-link">
            <span className="icon">⚙️</span>
            <span>Configuración</span>
          </Link>
        </nav>
        <section className="dashboard-content">
          <div className="welcome-card">
            <h2>Bienvenido al Sistema</h2>
            <p>
              Este sistema permite gestionar, almacenar y firmar digitalmente evidencias digitales
              con validez legal según el Decreto 47-2008 de Guatemala.
            </p>
            <div className="features">
              <div className="feature">
                <h3>🔐 Seguridad</h3>
                <p>Protección de datos con encriptación y autenticación JWT</p>
              </div>
              <div className="feature">
                <h3>📝 Firma Electrónica</h3>
                <p>Firma digital avanzada con validez legal</p>
              </div>
              <div className="feature">
                <h3>🔍 Verificación</h3>
                <p>Hash SHA-256 para verificación de integridad</p>
              </div>
              <div className="feature">
                <h3>📋 Cadena de Custodia</h3>
                <p>Registro automático de acciones y modificaciones</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;