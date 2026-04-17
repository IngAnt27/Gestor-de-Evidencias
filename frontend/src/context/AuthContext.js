import React, { createContext, useEffect, useState } from 'react';
import { apiLogin, apiRegister } from '../services/api';

export const AuthContext = createContext();

const STORAGE_KEY = 'gestor_evidencias_token';

const decodeToken = (token) => {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(decodeToken(localStorage.getItem(STORAGE_KEY)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
      setUser(decodeToken(token));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    }
  }, [token]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiLogin(credentials);
      setToken(response.token);
      return response;
    } catch (err) {
      setError(err.message || 'Error de autenticación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRegister(userData);
      return response;
    } catch (err) {
      setError(err.message || 'Error en registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
