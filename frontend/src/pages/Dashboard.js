import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ShieldIcon,
  FileText,
  LayoutDashboard,
  Lock,
  Activity,
  ArrowRight,
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

const stats = [
  { label: 'Evidencias Registradas', value: '1,248', icon: FileText, tone: 'primary' },
  { label: 'Hashes Verificados', value: '934', icon: ShieldCheck, tone: 'success' },
  { label: 'Firmas Emitidas', value: '582', icon: Sparkles, tone: 'secondary' },
  { label: 'Alertas de Integridad', value: '12', icon: Lock, tone: 'danger' }
];

const recentActivity = [
  { time: 'Ahora', title: 'Verificacion SHA-256 completada', subtitle: 'Documento EV-0012', status: 'success' },
  { time: 'Hace 1h', title: 'Firma digital generada', subtitle: 'Cadena de custodia actualizada', status: 'primary' },
  { time: 'Hace 3h', title: 'Nuevo caso cargado', subtitle: 'Evidencia EV-0231 recibida', status: 'secondary' },
  { time: 'Ayer', title: 'Reporte de auditoria generado', subtitle: 'Exportado a PDF', status: 'muted' }
];

const recentEvidences = [
  { code: 'EV-0012', name: 'Registro forense USB', type: 'Multimedia', status: 'Verificada', uploaded: '15 may', owner: 'Laura M.' },
  { code: 'EV-0198', name: 'Captura de red', type: 'Pcap', status: 'En revision', uploaded: '14 may', owner: 'Miguel G.' },
  { code: 'EV-0173', name: 'Documento juridico', type: 'PDF', status: 'Firmada', uploaded: '13 may', owner: 'Ana V.' },
  { code: 'EV-0231', name: 'Imagen de camara', type: 'Foto', status: 'Pendiente', uploaded: '12 may', owner: 'Jorge L.' }
];

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

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
            <p className="topbar-copy">
              Visualiza el flujo forense, audita integridad hash y controla la trazabilidad con una interfaz disenada para equipos de ciberseguridad y fiscalias.
            </p>
          </div>
          <div className="topbar-actions">
            <button className="btn-outline" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            <button className="btn-primary">Nueva evidencia</button>
          </div>
        </div>

        <section className="hero-grid">
          <motion.article className="hero-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="hero-card-header">
              <div>
                <p className="eyebrow">Vision General</p>
                <h2>Estado operativo del sistema</h2>
              </div>
              <span className="badge primary">Sistema Estable</span>
            </div>
            <div className="hero-statistics">
              <div>
                <span className="stat-value">98.7%</span>
                <p>Disponibilidad y respuesta</p>
              </div>
              <div>
                <span className="stat-value">462</span>
                <p>Verificaciones esta semana</p>
              </div>
            </div>
          </motion.article>

          <div className="stats-grid">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <motion.article key={item.label} className={`stat-card stat-${item.tone}`} whileHover={{ y: -4 }}>
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
                <div className="panel-item">
                  <p>Evidencias con sello legal</p>
                  <strong>198</strong>
                </div>
                <div className="panel-item">
                  <p>Revisiones pendientes</p>
                  <strong>27</strong>
                </div>
                <div className="panel-item">
                  <p>Alertas de integridad</p>
                  <strong>4</strong>
                </div>
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
                <div className="panel-item">
                  <p>Confirmaciones</p>
                  <strong>814</strong>
                </div>
                <div className="panel-item">
                  <p>Rechazos</p>
                  <strong>12</strong>
                </div>
                <div className="panel-item">
                  <p>Procesos recientes</p>
                  <strong>34</strong>
                </div>
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
            {recentActivity.map((item) => (
              <motion.div key={item.time} className="timeline-item" whileHover={{ x: 4 }}>
                <span className={`timeline-dot timeline-${item.status}`} />
                <div>
                  <p className="timeline-time">{item.time}</p>
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </div>
              </motion.div>
            ))}
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
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
