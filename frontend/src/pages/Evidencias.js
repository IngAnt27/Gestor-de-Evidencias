import React, { useState, useEffect } from 'react';
import './Evidencias.css';
import SubirEvidencia from '../components/SubirEvidencia';
import ListaEvidencias from '../components/ListaEvidencias';

function Evidencias({ user }) {
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEvidencia, setSelectedEvidencia] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState(null);
  const [signing, setSigning] = useState(false);
  const [verifyingFirma, setVerifyingFirma] = useState(false);

  const fetchEvidencias = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/evidencias', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener evidencias');
      }

      const data = await response.json();
      setEvidencias(data);
      return data;
    } catch (error) {
      setError(error.message);
      return [];
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

  const handleSeleccionar = (evidencia) => {
    setSelectedEvidencia(evidencia);
    setSignatureStatus(null);
  };

  const handleSignEvidencia = async (evidenciaId) => {
    setSigning(true);
    setError('');
    setSignatureStatus(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/evidencias/${evidenciaId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Error al firmar la evidencia');
      }

      setSignatureStatus({ type: 'signed', msg: data.msg });
      const all = await fetchEvidencias();
      const updated = all.find((item) => item.id === evidenciaId);
      if (updated) setSelectedEvidencia(updated);
    } catch (error) {
      setError(error.message);
    } finally {
      setSigning(false);
    }
  };

  const handleVerifyFirma = async (evidenciaId) => {
    setVerifyingFirma(true);
    setError('');
    setSignatureStatus(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/custodia/verify-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ evidenciaId })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Error al verificar la firma avanzada');
      }

      setSignatureStatus({ type: data.valido ? 'valid' : 'invalid', msg: data.msg });
    } catch (error) {
      setError(error.message);
    } finally {
      setVerifyingFirma(false);
    }
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
                <label>Firma Avanzada:</label>
                <span className="hash-value">{selectedEvidencia.firma_avanzada ? selectedEvidencia.firma_avanzada.slice(0, 32) + '...' : 'No generada'}</span>
              </div>
              <div className="detalle-actions">
                <button
                  className="btn-primary"
                  onClick={() => handleSignEvidencia(selectedEvidencia.id)}
                  disabled={signing}
                >
                  {signing ? 'Firmando...' : selectedEvidencia.firma_avanzada ? 'Re-firmar electrónicamente' : 'Firmar electrónicamente'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleVerifyFirma(selectedEvidencia.id)}
                  disabled={verifyingFirma}
                >
                  {verifyingFirma ? 'Verificando...' : 'Verificar firma avanzada'}
                </button>
              </div>
              {signatureStatus && (
                <div className={`signature-status signature-${signatureStatus.type}`}>
                  {signatureStatus.msg}
                </div>
              )}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Evidencias;
