import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = ({ onView }) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="navbar">
      <div className="brand">Gestor de Evidencias</div>
      <div className="nav-actions">
        {user && (
          <>
            <span className="nav-user">{user?.rol?.toUpperCase()} | {user?.id}</span>
            <button className="secondary" onClick={logout}>Cerrar sesión</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
