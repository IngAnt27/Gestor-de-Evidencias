import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE } from '../services/api';
import {
  ShieldCheck,
  ShieldIcon,
  FileText,
  LayoutDashboard,
  Lock,
  Activity,
  ArrowRight,
  ArrowUpRight,
  Clock,
  LogOut,
  Sparkles,
  ClipboardList,
  BarChart3,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Dashboard.css';

const navItems = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/evidencias', label: 'Evidencias', icon: ClipboardList },
  { to: '/cadena-custodia', label: 'Cadena de Custodia', icon: ShieldIcon },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/configuracion', label: 'Configuracion', icon: Activity }
];

const initialStats = [
  { label: 'Evidencias Registradas', value: '0', icon: FileText, tone: 'primary' },
  { label: 'Hashes Verificados', value: '0', icon: ShieldCheck, tone: 'success' },
  { label: 'Firmas Emitidas', value: '0', icon: Sparkles, tone: 'secondary' },
  { label: 'Alertas de Integridad', value: '0', icon: Lock, tone: 'danger' }
];

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(initialStats);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentEvidences, setRecentEvidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleNewEvidence = () => {
    navigate('/evidencias');
  };

  const loadDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/evidencias`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los datos de evidencias');
      }

      const data = await response.json();
      const total = data.length;
      const verified = data.filter((item) => item.estado === 'Verificada').length;
      const signed = data.filter((item) => item.estado === 'Firmada').length;
      const alerts = data.filter((item) => item.estado === 'Pendiente').length;

      setStats([
        { label: 'Evidencias Registradas', value: total.toString(), icon: FileText, tone: 'primary' },
        { label: 'Hashes Verificados', value: verified.toString(), icon: ShieldCheck, tone: 'success' },
        { label: 'Firmas Emitidas', value: signed.toString(), icon: Sparkles, tone: 'secondary' },
        { label: 'Alertas de Integridad', value: alerts.toString(), icon: Lock, tone: 'danger' }
      ]);

      setRecentEvidences(data.slice(0, 4).map((item) => ({
        code: item.codigo,
        name: item.nombre,
        type: item.tipo,
        status: item.estado,
        uploaded: item.fecha_subida ? new Date(item.fecha_subida).toLocaleDateString() : '-',
        owner: item.usuario_nombre || 'N/A'
      })));

      setRecentActivity(data.slice(0, 4).map((item) => ({
        time: item.fecha_subida ? new Date(item.fecha_subida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora',
        title: `Evidencia ${item.codigo || item.nombre}`,
        subtitle: item.descripcion || 'Carga de nueva evidencia',
        status: item.estado === 'Verificada' ? 'success' : item.estado === 'Firmada' ? 'primary' : 'secondary'
      })));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardMetrics();

    const handleDashboardRefresh = () => {
      loadDashboardMetrics();
    };

    // Escuchar cambios en evidencias desde otras páginas
    window.addEventListener('dashboardRefresh', handleDashboardRefresh);
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadDashboardMetrics, 30000);

    return () => {
      window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
      clearInterval(interval);
    };
  }, [loadDashboardMetrics]);

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">GD</div>
          <div>
            <p className="brand-title">Gestor de Evidencias</p>
            <p className="brand-subtitle">LegalTech forense premium</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className={`sidebar-link ${item.to === '/dashboard' ? 'active' : ''}`}>
                <Icon className="sidebar-icon" size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <div>
            <span className="status-dot success"></span>
            Conectado como <strong>{user?.nombre || 'Usuario'}</strong>
            <div className="status-info">
              <p className="status-user">{user?.nombre || 'Usuario'}</p>
              <p className="status-role">{user?.rol || 'Investigador'}</p>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} /> Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="topbar-intro">
            <p className="eyebrow">Panel Corporativo</p>
            <h1>Monitoreo de Evidencias y Cadena de Custodia</h1>
            <div className="topbar-badge">
              <ShieldCheck size={12} />
              <span>Cumplimiento Decreto 47-2008</span>
            </div>
            <h1>Panel de Control Forense</h1>
            <p className="topbar-copy">
              Visualiza el flujo forense, audita integridad hash y controla la trazabilidad con una interfaz disenada para equipos de ciberseguridad y fiscalias.
              Gestión centralizada de evidencias digitales con integridad garantizada mediante SHA-256.
            </p>
          </div>
          <div className="topbar-actions">
            <button className="btn-outline" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            <button className="btn-primary" onClick={handleNewEvidence}>Nueva evidencia</button>
          </div>
        </div>

        <section className="hero-grid">
          <motion.article className="hero-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="hero-card-header">
              <div>
                <p className="eyebrow">Vision General</p>
                <h2>Estado operativo del sistema</h2>
              </div>
              <div className="pulse-indicator">
                <span className="pulse-dot"></span>
                <span className="badge primary">Sistema Activo</span>
              </div>
            </div>
            <div className="hero-statistics">
              {stats.length > 0 ? (
                <>
                  <div className="hero-stat-main">
                    <strong>{stats[0].value}</strong>
                    <span>Evidencias totales bajo custodia</span>
                  </div>
                  <div className="hero-stat-footer">
                    <p><Clock size={14} /> Última sincronización: {new Date().toLocaleTimeString()}</p>
                  </div>
                </>
              ) : (
                <p>No hay datos operativos disponibles.</p>
              )}
            </div>
          </motion.article>

          <div className="stats-grid">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <motion.article key={item.label} className={`stat-card stat-${item.tone}`} whileHover={{ y: -4 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="stat-card-top">
                    <Icon size={22} />
                    <span>{item.label}</span>
                  </div>
                  <strong>{item.value}</strong>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="dashboard-grid-panels">
          <motion.div className="panel-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="panel-header">
              <div>
                <p className="panel-label">Cadena de Custodia</p>
                <h3>Integridad y control judicial</h3>
              </div>
              <ShieldIcon size={20} />
            </div>
            <div className="panel-content">
              <p>Supervisa registros de custodia en tiempo real y clasifica eventos de conservacion, verificacion y firma.</p>
              <div className="panel-list">
                {recentEvidences.length > 0 ? (
                  <>
                    <p className="panel-stat"><strong>{stats[0].value}</strong> Evidencias totales bajo custodia</p>
                    <p className="panel-meta">Última sincronización: {new Date().toLocaleTimeString()}</p>
                  </>
                ) : (
                  <p>No hay datos de custodia disponibles.</p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div className="panel-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="panel-header">
              <div>
                <p className="panel-label">Verificacion Hash</p>
                <h3>SHA-256 y validacion juridica</h3>
              </div>
              <ShieldCheck size={20} />
            </div>
            <div className="panel-content">
              <p>Obtiene un resumen rapido del analisis de integridad. Cada hash se registra como evidencia digital certificada.</p>
              <div className="panel-list">
                {stats[1] && stats[1].value !== '0' ? (
                  <>
                    <p className="panel-stat"><strong>{stats[1].value}</strong> Hashes verificados</p>
                    <p className="panel-meta">Integridad garantizada mediante SHA-256</p>
                  </>
                ) : (
                  <p>No hay datos de verificación disponibles.</p>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="section-block">
          <div className="section-header">
            <div className="section-title">
              <p className="eyebrow">Actividad Reciente</p>
              <h2>Timeline de operaciones</h2>
            </div>
            <Link to="/reportes" className="link-action">
              Ver historial completo <ArrowRight size={16} />
            </Link>
          </div>

          <div className="timeline-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <motion.div key={item.time} className="timeline-item" whileHover={{ x: 4 }}>
                  <span className={`timeline-dot timeline-${item.status}`} />
                  <div>
                    <p className="timeline-time">{item.time}</p>
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-state">
                No hay actividad reciente disponible.
              </div>
            )}
          </div>
        </section>

        <section className="section-block">
          <div className="section-header">
            <div className="section-title">
              <p className="eyebrow">Evidencias Recientes</p>
              <h2>Registros con mayor prioridad</h2>
            </div>
            <button className="btn-outline">Exportar tabla</button>
          </div>

          <div className="table-wrapper">
            {recentEvidences.length > 0 ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Nombre de evidencia</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvidences.map((evidence) => (
                    <tr key={evidence.code}>
                      <td>{evidence.code}</td>
                      <td>{evidence.name}</td>
                      <td>{evidence.type}</td>
                      <td>
                        <span className={`badge ${evidence.status === 'Verificada' ? 'success' : evidence.status === 'Firmada' ? 'primary' : evidence.status === 'Pendiente' ? 'danger' : 'secondary'}`}>
                          {evidence.status}
                        </span>
                      </td>
                      <td>{evidence.uploaded}</td>
                      <td>{evidence.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                No hay evidencias recientes disponibles.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;