import React, { useState, useEffect } from 'react';
import './Reportes.css';

function Reportes() {
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchReportes();
    fetchEstadisticas();
  }, []);

  useEffect(() => {
    filterReportes();
  }, [searchTerm, filterEstado, reportes]);

  const fetchReportes = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/reportes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener reportes');
      }

      const data = await response.json();
      setReportes(data.evidencias || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/reportes/estadisticas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const filterReportes = () => {
    let filtered = reportes;

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterEstado !== 'todos') {
      filtered = filtered.filter(r => r.estado === filterEstado);
    }

    setFilteredReportes(filtered);
  };

  const handleDownloadPDF = async (evidenciaId, nombre) => {
    setDownloadingId(evidenciaId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/reportes/pdf/${evidenciaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado_${nombre}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Error al descargar el PDF');
      }
    } catch (error) {
      setError('Error de conexión: ' + error.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <h2>Reportes de Evidencias</h2>
        <button onClick={fetchReportes} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {estadisticas && (
        <div className="estadisticas-grid">
          <div className="estadistica-card">
            <h3>Total de Evidencias</h3>
            <p className="numero">{estadisticas.total_evidencias}</p>
          </div>
          <div className="estadistica-card">
            <h3>Evidencias Activas</h3>
            <p className="numero">{estadisticas.por_estado.activas}</p>
          </div>
          <div className="estadistica-card">
            <h3>Tamaño Total</h3>
            <p className="numero">{estadisticas.tamano_total_mb} MB</p>
          </div>
          <div className="estadistica-card">
            <h3>Verificaciones Fallidas</h3>
            <p className="numero alert">{estadisticas.verificaciones_fallidas}</p>
          </div>
        </div>
      )}

      <div className="filtros-section">
        <div className="filtro-group">
          <label htmlFor="buscar">Buscar por nombre o código:</label>
          <input
            id="buscar"
            type="text"
            placeholder="Ej: documento, EV-1234..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filtro-input"
          />
        </div>

        <div className="filtro-group">
          <label htmlFor="estado">Filtrar por estado:</label>
          <select
            id="estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos</option>
            <option value="activa">Activa</option>
            <option value="en_analisis">En Análisis</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </div>
      </div>

      <div className="reportes-table-container">
        {loading ? (
          <p className="loading">Cargando reportes...</p>
        ) : filteredReportes.length === 0 ? (
          <p className="no-data">No hay evidencias que mostrar</p>
        ) : (
          <table className="reportes-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Tamaño</th>
                <th>Estado</th>
                <th>Fecha de Carga</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportes.map((reporte) => (
                <tr key={reporte.id} className={`estado-${reporte.estado}`}>
                  <td className="codigo">{reporte.codigo}</td>
                  <td className="nombre">{reporte.nombre}</td>
                  <td className="tipo">{reporte.tipo}</td>
                  <td>{formatFileSize(reporte.tamano_bytes)}</td>
                  <td className="estado">
                    <span className={`badge badge-${reporte.estado}`}>
                      {reporte.estado === 'en_analisis' ? 'En Análisis' :
                       reporte.estado.charAt(0).toUpperCase() + reporte.estado.slice(1)}
                    </span>
                  </td>
                  <td>{new Date(reporte.fecha_subida).toLocaleString('es-GT')}</td>
                  <td>{reporte.usuario_nombre}</td>
                  <td>
                    <button
                      onClick={() => handleDownloadPDF(reporte.id, reporte.codigo)}
                      disabled={downloadingId === reporte.id}
                      className="btn-download"
                      title="Descargar Certificado de Integridad en PDF"
                    >
                      {downloadingId === reporte.id ? '⏳' : '📄'} PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="reportes-footer">
        <p>Total de registros: {filteredReportes.length} de {reportes.length}</p>
      </div>
    </div>
  );
}

export default Reportes;
