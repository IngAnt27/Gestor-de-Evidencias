import React, { useState, useEffect } from 'react';
import './CadenaCustodia.css';

function CadenaCustodia() {
  const [evidencias, setEvidencias] = useState([]);
  const [selectedEvidencia, setSelectedEvidencia] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [error, setError] = useState('');
  const [estadoIntegridad, setEstadoIntegridad] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    fetchEvidencias();
  }, []);

  const fetchEvidencias = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/evidencias', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener evidencias');
      }

      const data = await response.json();
      setEvidencias(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async (evidenciaId) => {
    setLoadingHistorial(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/custodia/${evidenciaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener historial');
      }

      const data = await response.json();
      setHistorial(data);

      // Verificar integridad automáticamente
      await verificarIntegridad(evidenciaId);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleSelectEvidencia = (evidencia) => {
    setSelectedEvidencia(evidencia);
    setHistorial([]);
    setEstadoIntegridad(null);
    fetchHistorial(evidencia.id);
  };

  const verificarIntegridad = async (evidenciaId) => {
    const evidencia = evidencias.find(e => e.id === evidenciaId);
    if (!evidencia) return;

    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/custodia/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          evidenciaId: evidenciaId,
          hashProvided: evidencia.hash_sha256
        })
      });

      if (!response.ok) {
        throw new Error('Error al verificar integridad');
      }

      const data = await response.json();
      setEstadoIntegridad(data);

      setTimeout(() => fetchHistorial(evidenciaId), 500);
    } catch (error) {
      setError(error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedEvidencia) return;
    setDownloadingPDF(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/custodia/pdf/${selectedEvidencia.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trazabilidad_${selectedEvidencia.codigo}.pdf`;
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
      setDownloadingPDF(false);
    }
  };

  const getAccionIcon = (accion) => {
    const iconMap = {
      'subida': '⬆️',
      'visualizacion': '👁️',
      'descarga': '⬇️',
      'edicion_metadata': '✏️',
      'cambio_estado': '🔄',
      'eliminacion': '🗑️',
      'verificacion_hash': '🔐'
    };
    return iconMap[accion] || '📌';
  };

  const formatAccion = (accion) => {
    const formatted = {
      'subida': 'Subida',
      'visualizacion': 'Visualización',
      'descarga': 'Descarga',
      'edicion_metadata': 'Edición de Metadatos',
      'cambio_estado': 'Cambio de Estado',
      'eliminacion': 'Eliminación',
      'verificacion_hash': 'Verificación de Hash'
    };
    return formatted[accion] || accion;
  };

  return (
    <div className="cadena-custodia-container">
      <div className="cadena-header">
        <h2>Cadena de Custodia</h2>
        <p className="subtitle">Historial de acciones y modificaciones de evidencias</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="cadena-content">
        {/* Panel de selección de evidencias */}
        <div className="evidencias-panel">
          <h3>Evidencias</h3>
          {loading ? (
            <p className="loading">Cargando evidencias...</p>
          ) : evidencias.length === 0 ? (
            <p className="no-data">No hay evidencias</p>
          ) : (
            <div className="evidencias-list">
              {evidencias.map((evidencia) => (
                <button
                  key={evidencia.id}
                  onClick={() => handleSelectEvidencia(evidencia)}
                  className={`evidencia-item ${selectedEvidencia?.id === evidencia.id ? 'selected' : ''}`}
                  title={evidencia.nombre}
                >
                  <div className="item-code">{evidencia.codigo}</div>
                  <div className="item-name">{evidencia.nombre}</div>
                  <div className="item-tipo">{evidencia.tipo}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel de historial */}
        <div className="historial-panel">
          {selectedEvidencia ? (
            <>
              <div className="historial-header">
                <div>
                  <h3>{selectedEvidencia.nombre}</h3>
                  <p className="codigo-ev">{selectedEvidencia.codigo}</p>
                </div>
                <div className="header-buttons">
                  <button
                    onClick={() => verificarIntegridad(selectedEvidencia.id)}
                    disabled={verifying}
                    className="btn-verify"
                  >
                    {verifying ? '⏳ Verificando...' : '🔐 Verificar Integridad'}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="btn-download-pdf"
                    title="Descargar Certificado de Trazabilidad Digital"
                  >
                    {downloadingPDF ? '⏳ Descargando...' : '📄 Descargar PDF'}
                  </button>
                </div>
              </div>

              {estadoIntegridad && (
                <div className={`estado-integridad ${estadoIntegridad.valido ? 'valido' : 'invalido'}`}>
                  <p className="estado-titulo">
                    {estadoIntegridad.valido ? '✓ Integridad Válida' : '✗ Integridad Comprometida'}
                  </p>
                  {!estadoIntegridad.valido && (
                    <p className="warning">Advertencia: El hash no coincide. La evidencia puede haber sido alterada.</p>
                  )}
                </div>
              )}

              <div className="historial-container">
                {loadingHistorial ? (
                  <p className="loading">Cargando historial...</p>
                ) : historial.length === 0 ? (
                  <p className="no-data">No hay historial registrado</p>
                ) : (
                  <table className="historial-table">
                    <thead>
                      <tr>
                        <th>Fecha/Hora</th>
                        <th>Acción</th>
                        <th>Usuario</th>
                        <th>Detalle</th>
                        <th>Estado Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((entrada) => (
                        <tr
                          key={entrada.id}
                          className={entrada.hash_valido === 0 ? 'row-error' : ''}
                        >
                          <td className="fecha">
                            {new Date(entrada.fecha).toLocaleString('es-GT')}
                          </td>
                          <td className="accion">
                            <span className="accion-icon">{getAccionIcon(entrada.accion)}</span>
                            <span>{formatAccion(entrada.accion)}</span>
                          </td>
                          <td className="usuario">{entrada.usuario_nombre}</td>
                          <td className="detalle">{entrada.detalle || '—'}</td>
                          <td className="hash-estado">
                            {entrada.accion === 'verificacion_hash' ? (
                              entrada.hash_valido === 1 ? (
                                <span className="badge badge-valido">✓ Válido</span>
                              ) : (
                                <span className="badge badge-invalido">✗ Inválido</span>
                              )
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="historial-footer">
                <p>Total de entradas en la cadena de custodia: {historial.length}</p>
                <p className="decreto-ref">
                  Conforme al Decreto 47-2008 de Guatemala, este historial es inmutable y constituye evidencia legal.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Selecciona una evidencia para ver su cadena de custodia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CadenaCustodia;
