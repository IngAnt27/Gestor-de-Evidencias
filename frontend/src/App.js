import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Evidencias from './pages/Evidencias';
import Reportes from './pages/Reportes';
import CadenaCustodia from './pages/CadenaCustodia';
import Configuracion from './pages/Configuracion';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="App app-shell">
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/dashboard" /> : <Register />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
            />
            <Route
              path="/evidencias"
              element={user ? <Evidencias user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/reportes"
              element={user ? <Reportes /> : <Navigate to="/login" />}
            />
            <Route
              path="/cadena-custodia"
              element={user ? <CadenaCustodia /> : <Navigate to="/login" />}
            />
            <Route
              path="/configuracion"
              element={user ? <Configuracion /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={<Navigate to={user ? "/dashboard" : "/login"} />}
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
