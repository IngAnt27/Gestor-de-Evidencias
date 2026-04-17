import './App.css';
import React, { useContext, useState } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function AppContent() {
  const { user } = useContext(AuthContext);
  const [view, setView] = useState('login');

  if (!user) {
    return view === 'register' ? (
      <RegisterPage onSwitch={() => setView('login')} />
    ) : (
      <LoginPage onSwitch={() => setView('register')} />
    );
  }

  return <DashboardPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
