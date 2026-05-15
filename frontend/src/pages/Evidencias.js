import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/api';
import './Evidencias.css';
import SubirEvidencia from '../components/SubirEvidencia';
import ListaEvidencias from '../components/ListaEvidencias';

function Evidencias({ user }) {
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEvidencia, setSelectedEvidencia] = useState(null);

  const fetchEvidencias = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/evidencias`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener evidencias');
      }

      const data = await response.json();
      setEvidencias(data);
      if (!selectedEvidencia && data.length > 0) {
        setSelectedEvidencia(data[0]);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidencias();
  }, []);

  const handleEvidenciaSubida = () => {
    setShowForm(false);
    fetchEvidencias();
  };

  const [deleting, setDeleting] = useState(false);

  const handleSeleccionar = (evidencia) => {
    setSelectedEvidencia(evidencia);
  };

  const handleEliminarEvidencia = async () => {
    if (!selectedEvidencia) return;
    const confirmed = window.confirm('¿Deseas eliminar esta evidencia? Esta acción marcará la evidencia como eliminada.');
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/evidencias/${selectedEvidencia.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.msg || 'No se pudo eliminar la evidencia');
      }

      setSelectedEvidencia(null);
      fetchEvidencias();
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleVerEvidencia = () => {
    if (!selectedEvidencia || !selectedEvidencia.ruta_archivo) return;
    const normalizedPath = selectedEvidencia.ruta_archivo.replace(/\\/g, '/').replace(/^\/+/, '');
    const fileUrl = `${API_BASE}/${normalizedPath}`;
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="evidencias-container">
      <div className="evidencias-header">
        <h2>Gestión de Evidencias</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Evidencia'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <SubirEvidencia user={user} onEvidenciaSubida={handleEvidenciaSubida} />
      )}

      <div className="evidencias-content">
        <div className="lista-section">
          {loading ? (
            <p>Cargando evidencias...</p>
          ) : (
            <ListaEvidencias
              evidencias={evidencias}
              onSeleccionar={handleSeleccionar}
              selectedId={selectedEvidencia?.id}
            />
          )}
        </div>

        {selectedEvidencia && (
          <div className="detalle-section">
            <h3>Detalles de la Evidencia</h3>
            <div className="detalle-card">
              <div className="detalle-row">
                <label>Código:</label>
                <span>{selectedEvidencia.codigo}</span>
              </div>
              <div className="detalle-row">
                <label>Nombre:</label>
                <span>{selectedEvidencia.nombre}</span>
              </div>
              <div className="detalle-row">
                <label>Descripción:</label>
                <span>{selectedEvidencia.descripcion || 'Sin descripción'}</span>
              </div>
              <div className="detalle-row">
                <label>Tipo:</label>
                <span>{selectedEvidencia.tipo}</span>
              </div>
              <div className="detalle-row">
                <label>Hash SHA-256:</label>
                <span className="hash-value">{selectedEvidencia.hash_sha256}</span>
              </div>
              <div className="detalle-row">
                <label>Tamaño:</label>
                <span>{(selectedEvidencia.tamano_bytes / 1024).toFixed(2)} KB</span>
              </div>
              <div className="detalle-row">
                <label>Estado:</label>
                <span className={`estado-${selectedEvidencia.estado}`}>{selectedEvidencia.estado}</span>
              </div>
              <div className="detalle-row">
                <label>Subido por:</label>
                <span>{selectedEvidencia.usuario_nombre}</span>
              </div>
              <div className="detalle-row">
                <label>Fecha de Subida:</label>
                <span>{new Date(selectedEvidencia.fecha_subida).toLocaleString()}</span>
              </div>
            </div>
            <div className="detalle-actions">
              {selectedEvidencia.ruta_archivo && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleVerEvidencia}
                >
                  Ver evidencia
                </button>
              )}
              {user && (user.rol === 'admin' || String(user.id) === String(selectedEvidencia.usuario_id)) ? (
                <button
                  className="btn-delete"
                  onClick={handleEliminarEvidencia}
                  disabled={deleting}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar Evidencia'}
                </button>
              ) : (
                <div className="permission-note">
                  Solo el administrador o el usuario que subió esta evidencia puede eliminarla.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Evidencias;
