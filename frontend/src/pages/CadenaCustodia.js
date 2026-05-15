import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/api';
import './CadenaCustodia.css';

function CadenaCustodia({ user }) {
  const [evidencias, setEvidencias] = useState([]);
  const [selectedEvidencia, setSelectedEvidencia] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [error, setError] = useState('');
  const [estadoIntegridad, setEstadoIntegridad] = useState(null);
  const [estadoFirma, setEstadoFirma] = useState(null);
  const [firmaMessage, setFirmaMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [firmaLoading, setFirmaLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [doubleCheckResult, setDoubleCheckResult] = useState(null);
  const [doubleChecking, setDoubleChecking] = useState(false);
  const [deletingHistory, setDeletingHistory] = useState(false);

  const parseJSON = async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  // 1. Carga inicial de evidencias - Solo ocurre una vez al montar el componente
  useEffect(() => {
    fetchEvidencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const errorData = await parseJSON(response);
        throw new Error(errorData?.msg || 'Error al obtener evidencias');
      }

      const data = await parseJSON(response) || [];
      setEvidencias(data);
      if (selectedEvidencia) {
        const refreshed = data.find((item) => item.id === selectedEvidencia.id);
        if (refreshed) {
          setSelectedEvidencia(refreshed);
        }
      } else if (data.length > 0) {
        setSelectedEvidencia(data[0]);
        fetchHistorial(data[0].id);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Historial - Función PURA (solo trae datos, no dispara verificaciones)
  const fetchHistorial = async (evidenciaId) => {
    setLoadingHistorial(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/custodia/${evidenciaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await parseJSON(response);
        throw new Error(errorData?.msg || 'Error al obtener historial');
      }

      const data = await parseJSON(response) || [];
      setHistorial(data);
    } catch (error) {
      setError('No se pudo cargar el historial: ' + error.message);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // 3. Selección de evidencia - Rompemos el ciclo aquí
  const handleSelectEvidencia = (evidencia) => {
    setSelectedEvidencia(evidencia);
    setHistorial([]);
    setEstadoIntegridad(null); // Limpiamos estados previos
    setEstadoFirma(null);
    setFirmaMessage('');
    setDoubleCheckResult(null);
    setError('');
    fetchHistorial(evidencia.id); // Solo pedimos el historial existente
  };

  // 4. Verificación de Integridad - Ejecutada por el botón
  const verificarIntegridad = async (evidenciaId) => {
    const evidencia = evidencias.find(e => e.id === evidenciaId);
    if (!evidencia) return;

    setVerifying(true);
    setError('');
    setEstadoIntegridad(null);
    setFirmaMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/custodia/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          evidenciaId: evidenciaId
        })
      });

      if (!response.ok) {
        const errorData = await parseJSON(response);
        throw new Error(errorData?.msg || 'Error al verificar integridad');
      }

      const data = await parseJSON(response);
      setEstadoIntegridad(data);

      await fetchEvidencias();
      await fetchHistorial(evidenciaId);
      
    } catch (error) {
      setError('Archivo no coincide o corrupto: ' + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const firmarElectronica = async (evidenciaId) => {
    setFirmaLoading(true);
    setError('');
    setFirmaMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/custodia/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ evidenciaId })
      });

      const data = await parseJSON(response);
      if (!response.ok) {
        throw new Error(data?.msg || 'Error al firmar electrónicamente');
      }

      setFirmaMessage(data.msg);
      await fetchEvidencias();
      await fetchHistorial(evidenciaId);
    } catch (error) {
      setError('Error en firma electrónica: ' + error.message);
    } finally {
      setFirmaLoading(false);
    }
  };

  const verificarFirmaElectronica = async (evidenciaId) => {
    setFirmaLoading(true);
    setError('');
    setEstadoFirma(null);
    setFirmaMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/custodia/verify-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ evidenciaId })
      });

      const data = await parseJSON(response);
      if (!response.ok) {
        throw new Error(data?.msg || 'Error al verificar firma');
      }

      setEstadoFirma(data);
      setFirmaMessage(data.msg);
      await fetchEvidencias();
      await fetchHistorial(evidenciaId);
    } catch (error) {
      setError('Error en verificación de firma: ' + error.message);
    } finally {
      setFirmaLoading(false);
    }
  };

  const verificarDobleCheck = async (evidenciaId) => {
    setDoubleChecking(true);
    setError('');
    setDoubleCheckResult(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/custodia/verify-double`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ evidenciaId })
      });

      const data = await parseJSON(response);
      if (!response.ok) {
        throw new Error(data?.msg || 'Error en verificación judicial');
      }

      setDoubleCheckResult(data);
      await fetchEvidencias();
      await fetchHistorial(evidenciaId);
    } catch (error) {
      setError('Error en verificación judicial: ' + error.message);
    } finally {
      setDoubleChecking(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedEvidencia) return;
    setDownloadingPDF(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/custodia/pdf/${selectedEvidencia.id}`, {
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
        const errorData = await parseJSON(response);
        setError(errorData?.msg || 'Error al descargar el PDF');
      }
    } catch (error) {
      setError('Error de conexión: ' + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleEliminarHistorial = async () => {
    if (!selectedEvidencia) return;
    const confirmed = window.confirm('¿Deseas eliminar todo el historial de custodia para esta evidencia? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    setDeletingHistory(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/custodia/${selectedEvidencia.id}/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await parseJSON(response);
      if (!response.ok) {
        throw new Error(data?.msg || 'No se pudo eliminar el historial');
      }

      setHistorial([]);
      setError('');
    } catch (error) {
      setError(error.message);
    } finally {
      setDeletingHistory(false);
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
      'verificacion_hash': '🔐',
      'firma_avanzada': '🖋️',
      'verificacion_judicial': '⚖️'
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
      'verificacion_hash': 'Verificación de Hash',
      'firma_avanzada': 'Firma Avanzada',
      'verificacion_firma': 'Verificación de Firma',
      'verificacion_judicial': 'Verificación Judicial'
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
                >
                  <div className="item-code">{evidencia.codigo}</div>
                  <div className="item-name">{evidencia.nombre}</div>
                  <div className="item-tipo">{evidencia.tipo}</div>
                </button>
              ))}
            </div>
          )}
        </div>

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
                    disabled={verifying || firmaLoading}
                    className="btn-verify"
                  >
                    {verifying ? '⏳ Verificando...' : '🔐 Verificar Integridad'}
                  </button>
                  {selectedEvidencia.firma_avanzada ? (
                    <button
                      onClick={() => verificarFirmaElectronica(selectedEvidencia.id)}
                      disabled={firmaLoading || verifying}
                      className="btn-verify"
                    >
                      {firmaLoading ? '⏳ Verificando Firma...' : '✍️ Verificar Firma'}
                    </button>
                  ) : (
                    <button
                      onClick={() => firmarElectronica(selectedEvidencia.id)}
                      disabled={firmaLoading || verifying}
                      className="btn-download-pdf"
                    >
                      {firmaLoading ? '⏳ Firmando...' : '✍️ Firmar Electrónicamente'}
                    </button>
                  )}
                  <button
                    onClick={() => verificarDobleCheck(selectedEvidencia.id)}
                    disabled={doubleChecking || verifying || firmaLoading}
                    className="btn-judge-verify"
                  >
                    {doubleChecking ? '⏳ Verificación Judicial...' : '⚖️ Verificación Judicial'}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="btn-download-pdf"
                  >
                    {downloadingPDF ? '⏳ Descargando...' : '📄 Descargar PDF'}
                  </button>
                  {user && selectedEvidencia && (user.rol === 'admin' || String(user.id) === String(selectedEvidencia.usuario_id)) && (
                    <button
                      onClick={handleEliminarHistorial}
                      disabled={deletingHistory || verifying || firmaLoading || doubleChecking}
                      className="btn-delete-history"
                    >
                      {deletingHistory ? '⏳ Eliminando historial...' : '🗑️ Eliminar Historial'}
                    </button>
                  )}
                </div>
              </div>

              {selectedEvidencia.firma_avanzada && (
                <div className="firma-info" style={{ padding: '0 20px 20px 20px' }}>
                  <p><strong>Firma Avanzada:</strong> {selectedEvidencia.firma_usuario_nombre}</p>
                  {selectedEvidencia.firma_timestamp && (
                    <p><strong>Fecha de firma:</strong> {new Date(selectedEvidencia.firma_timestamp).toLocaleString('es-GT')}</p>
                  )}
                </div>
              )}

              {estadoIntegridad && (
                <div className={`estado-integridad ${estadoIntegridad.valido ? 'valido' : 'invalido'}`}>
                  <p className="estado-titulo">
                    {estadoIntegridad.valido ? '✓ Integridad Válida' : '✗ Integridad Comprometida'}
                  </p>
                  <p>{estadoIntegridad.msg}</p>
                  {!estadoIntegridad.valido && (
                    <p className="warning">Advertencia: La evidencia puede haber sido alterada. Revise el historial judicial.</p>
                  )}
                </div>
              )}

              {estadoFirma && (
                <div className={`estado-integridad ${estadoFirma.valido ? 'valido' : 'invalido'}`}>
                  <p className="estado-titulo">
                    {estadoFirma.valido ? '✓ Firma Avanzada Válida' : '✗ Firma Avanzada Inválida'}
                  </p>
                  <p>{estadoFirma.msg}</p>
                </div>
              )}

              {doubleCheckResult && (
                <div className={`estado-integridad ${doubleCheckResult.verificacionCompleta ? 'valido' : 'invalido'}`}>
                  <p className="estado-titulo">
                    {doubleCheckResult.verificacionCompleta ? '⚖️ Verificación Judicial Completa' : '⚖️ Anomalías Detectadas'}
                  </p>
                  <div className="double-check-details">
                    <p><strong>Archivo existe:</strong> {doubleCheckResult.archivoExiste ? '✅' : '❌'}</p>
                    <p><strong>Hash válido:</strong> {doubleCheckResult.hashValido ? '✅' : '❌'}</p>
                    <p><strong>Tamaño coincide:</strong> {doubleCheckResult.tamanoCoincide ? '✅' : '❌'}</p>
                    <p><strong>Tipo coincide:</strong> {doubleCheckResult.tipoCoincide ? '✅' : '❌'}</p>
                    <div className="detalles-lista">
                      <strong>Detalles:</strong>
                      <ul>
                        {doubleCheckResult.detalles.map((detalle, index) => (
                          <li key={index}>{detalle}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {firmaMessage && !estadoFirma && (
                <div className="estado-integridad valido">
                  <p className="estado-titulo">{firmaMessage}</p>
                </div>
              )}

              <div className="historial-container">
                {loadingHistorial ? (
                  <p className="loading">Cargando historial...</p>
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
                        <tr key={entrada.id} className={entrada.hash_valido === 0 ? 'row-error' : ''}>
                          <td className="fecha">{new Date(entrada.fecha).toLocaleString('es-GT')}</td>
                          <td className="accion">
                            <span className="accion-icon">{getAccionIcon(entrada.accion)}</span>
                            <span>{formatAccion(entrada.accion)}</span>
                          </td>
                          <td className="usuario">{entrada.usuario_nombre}</td>
                          <td className="detalle">{entrada.detalle || '—'}</td>
                          <td className="hash-estado">
                            {entrada.accion === 'verificacion_hash' ? (
                              <span className={`badge ${entrada.hash_valido === 1 ? 'badge-valido' : 'badge-invalido'}`}>
                                {entrada.hash_valido === 1 ? '✓ Válido' : '✗ Inválido'}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="historial-footer">
                <p>Total de entradas: {historial.length}</p>
                <p className="decreto-ref">Conforme al Decreto 47-2008 de Guatemala.</p>
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