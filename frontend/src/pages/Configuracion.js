import React, { useState } from 'react';
import './Configuracion.css';

function Configuracion() {
  const [settings, setSettings] = useState({
    notificaciones: true,
    autoActualizar: true,
    itemsPorPagina: 10,
    tema: 'claro'
  });

  const [guardado, setGuardado] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleGuardar = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="configuracion-container">
      <div className="configuracion-header">
        <h2>Configuración</h2>
        <p className="subtitle">Personaliza tu experiencia en el sistema</p>
      </div>

      {guardado && (
        <div className="success-message">✓ Configuración guardada correctamente</div>
      )}

      <div className="configuracion-content">
        <div className="settings-section">
          <h3>Preferencias Generales</h3>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="notificaciones">Habilitar Notificaciones</label>
              <p className="setting-description">Recibe notificaciones sobre cambios en evidencias</p>
            </div>
            <input
              type="checkbox"
              id="notificaciones"
              name="notificaciones"
              checked={settings.notificaciones}
              onChange={handleChange}
              className="setting-toggle"
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="autoActualizar">Actualización Automática</label>
              <p className="setting-description">Actualizar listados automáticamente cada minuto</p>
            </div>
            <input
              type="checkbox"
              id="autoActualizar"
              name="autoActualizar"
              checked={settings.autoActualizar}
              onChange={handleChange}
              className="setting-toggle"
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="itemsPorPagina">Ítems por Página</label>
              <p className="setting-description">Número de registros a mostrar por página</p>
            </div>
            <select
              id="itemsPorPagina"
              name="itemsPorPagina"
              value={settings.itemsPorPagina}
              onChange={handleChange}
              className="setting-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="tema">Tema</label>
              <p className="setting-description">Elige el tema visual de la aplicación</p>
            </div>
            <select
              id="tema"
              name="tema"
              value={settings.tema}
              onChange={handleChange}
              className="setting-select"
            >
              <option value="claro">Claro</option>
              <option value="oscuro">Oscuro</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Seguridad</h3>

          <div className="setting-info">
            <p>📝 Tu contraseña se almacena de forma segura utilizando bcryptjs.</p>
            <p>🔐 Los tokens JWT expiran después de 8 horas de inactividad.</p>
            <p>✓ Todas tus evidencias están protegidas con hash SHA-256.</p>
          </div>
        </div>

        <div className="settings-section">
          <h3>Información del Sistema</h3>

          <div className="info-item">
            <span className="info-label">Versión:</span>
            <span className="info-value">1.0.0</span>
          </div>

          <div className="info-item">
            <span className="info-label">Base Legal:</span>
            <span className="info-value">Decreto 47-2008 de Guatemala</span>
          </div>

          <div className="info-item">
            <span className="info-label">Última Actualización:</span>
            <span className="info-value">{new Date().toLocaleDateString('es-GT')}</span>
          </div>
        </div>

        <div className="button-group">
          <button onClick={handleGuardar} className="btn-guardar">
            💾 Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

export default Configuracion;
