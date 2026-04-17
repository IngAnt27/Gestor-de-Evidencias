import React, { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import {
  apiDeleteEvidence,
  apiGetCustodyLogs,
  apiGetEvidences,
  apiUpdateEvidence,
  apiUploadEvidence,
} from '../services/api';

const DashboardPage = () => {
  const { token, user, logout } = useContext(AuthContext);
  const [evidencias, setEvidencias] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [logs, setLogs] = useState([]);
  const [uploadData, setUploadData] = useState({ nombre: '', descripcion: '', file: null });
  const [editData, setEditData] = useState({ nombre: '', descripcion: '', estado: 'activa' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadEvidencias = async () => {
    try {
      const data = await apiGetEvidences(token);
      setEvidencias(data);
    } catch (error) {
      setMessage(error.message || 'No se pudo cargar evidencias');
    }
  };

  useEffect(() => {
    if (token) {
      loadEvidencias();
    }
  }, [token]);

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!uploadData.file) {
      setMessage('Selecciona un archivo para cargar.');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', uploadData.nombre);
    formData.append('descripcion', uploadData.descripcion);
    formData.append('file', uploadData.file);

    setLoading(true);
    try {
      await apiUploadEvidence(token, formData);
      setUploadData({ nombre: '', descripcion: '', file: null });
      await loadEvidencias();
      setMessage('Evidencia cargada correctamente.');
    } catch (error) {
      setMessage(error.message || 'Error al subir la evidencia.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (evidencia) => {
    setSelectedEvidence(evidencia);
    setEditData({
      nombre: evidencia.nombre || '',
      descripcion: evidencia.descripcion || '',
      estado: evidencia.estado || 'activa',
    });
    setLogs([]);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selectedEvidence) return;
    setMessage('');
    setLoading(true);

    try {
      const updated = await apiUpdateEvidence(token, selectedEvidence._id, editData);
      setSelectedEvidence(updated);
      await loadEvidencias();
      setMessage('Meta datos actualizados correctamente.');
    } catch (error) {
      setMessage(error.message || 'Error al actualizar evidencia.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (evidencia) => {
    const confirmed = window.confirm('¿Estás seguro de eliminar esta evidencia?');
    if (!confirmed) return;
    setMessage('');
    setLoading(true);

    try {
      await apiDeleteEvidence(token, evidencia._id);
      setSelectedEvidence(null);
      await loadEvidencias();
      setMessage('Evidencia eliminada.');
    } catch (error) {
      setMessage(error.message || 'Error al eliminar la evidencia.');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    if (!selectedEvidence) return;
    setMessage('');
    try {
      const data = await apiGetCustodyLogs(token, selectedEvidence._id);
      setLogs(data);
    } catch (error) {
      setMessage(error.message || 'No se pudieron cargar los registros de custodia.');
    }
  };

  const downloadUrl = (ruta) => {
    if (!ruta) return '#';
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}/${ruta.replace('\\', '/').replace(/^\//, '')}`;
  };

  return (
    <div className="page dashboard-page">
      <Navbar onView={() => {}} />

      <main className="dashboard-grid">
        <section className="panel upload-panel">
          <h2>Cargar nueva evidencia</h2>
          <form onSubmit={handleUpload} className="form-stack">
            <label>
              Nombre
              <input
                type="text"
                value={uploadData.nombre}
                onChange={(e) => setUploadData({ ...uploadData, nombre: e.target.value })}
                required
              />
            </label>
            <label>
              Descripción
              <textarea
                value={uploadData.descripcion}
                onChange={(e) => setUploadData({ ...uploadData, descripcion: e.target.value })}
                rows="3"
                required
              />
            </label>
            <label>
              Archivo
              <input
                type="file"
                accept="*/*"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Subiendo...' : 'Subir evidencia'}
            </button>
          </form>
        </section>

        <section className="panel list-panel">
          <div className="section-header">
            <h2>Evidencias</h2>
            <button className="secondary" onClick={logout}>Cerrar sesión</button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Usuario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {evidencias.length === 0 && (
                  <tr>
                    <td colSpan="5">No hay evidencias cargadas.</td>
                  </tr>
                )}
                {evidencias.map((evidencia) => (
                  <tr key={evidencia._id}>
                    <td>{evidencia.nombre}</td>
                    <td>{evidencia.descripcion}</td>
                    <td>{evidencia.estado}</td>
                    <td>{evidencia.usuario?.nombre || evidencia.usuario?.email || 'Desconocido'}</td>
                    <td className="actions-cell">
                      <button onClick={() => handleSelect(evidencia)}>Ver</button>
                      {user?.rol === 'admin' && (
                        <button className="danger" onClick={() => handleDelete(evidencia)}>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel details-panel">
          <h2>Detalle de evidencia</h2>
          {!selectedEvidence && <p>Selecciona una evidencia para ver detalles y custodia.</p>}
          {selectedEvidence && (
            <>
              <div className="detail-card">
                <p><strong>Nombre:</strong> {selectedEvidence.nombre}</p>
                <p><strong>Descripción:</strong> {selectedEvidence.descripcion}</p>
                <p><strong>Tipo:</strong> {selectedEvidence.tipo}</p>
                <p><strong>Hash SHA-256:</strong> {selectedEvidence.hash}</p>
                <p><strong>Estado:</strong> {selectedEvidence.estado}</p>
                <p><strong>Subido por:</strong> {selectedEvidence.usuario?.nombre || selectedEvidence.usuario?.email}</p>
                <a className="link-button" href={downloadUrl(selectedEvidence.ruta_archivo)} target="_blank" rel="noreferrer">
                  Descargar documento
                </a>
              </div>

              <form onSubmit={handleUpdate} className="form-stack">
                <h3>Editar metadata</h3>
                <label>
                  Nombre
                  <input
                    type="text"
                    value={editData.nombre}
                    onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Descripción
                  <textarea
                    value={editData.descripcion}
                    onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                    rows="3"
                    required
                  />
                </label>
                <label>
                  Estado
                  <select
                    value={editData.estado}
                    onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
                  >
                    <option value="activa">Activa</option>
                    <option value="analisis">En análisis</option>
                    <option value="cerrada">Cerrada</option>
                  </select>
                </label>
                <button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>

              <div className="custody-section">
                <div className="section-header">
                  <h3>Registros de custodia</h3>
                  <button onClick={loadLogs}>Actualizar registros</button>
                </div>
                {logs.length === 0 ? (
                  <p>No hay registros. Presiona "Actualizar registros".</p>
                ) : (
                  <ul className="logs-list">
                    {logs.map((log) => (
                      <li key={log._id}>
                        <strong>{log.accion}</strong>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        <span>{log.usuario?.nombre || log.usuario?.email || 'Usuario'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {message && <div className="toast">{message}</div>}
    </div>
  );
};

export default DashboardPage;
