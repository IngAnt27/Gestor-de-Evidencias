import React, { useState } from 'react';
import './SubirEvidencia.css';

function SubirEvidencia({ user, onEvidenciaSubida }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha_recoleccion: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!file) {
      setError('Debes seleccionar un archivo');
      setLoading(false);
      return;
    }

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('nombre', formData.nombre || file.name);
      form.append('descripcion', formData.descripcion);
      if (formData.fecha_recoleccion) {
        form.append('fecha_recoleccion', formData.fecha_recoleccion);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/evidencias', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Evidencia "${data.nombre}" subida exitosamente. Código: ${data.codigo}`);
        setFormData({ nombre: '', descripcion: '' });
        setFile(null);
        
        setTimeout(() => {
          onEvidenciaSubida();
        }, 1500);
      } else {
        setError(data.msg || 'Error al subir la evidencia');
      }
    } catch (error) {
      setError('Error de conexión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subir-evidencia-card">
      <h3>Subir Nueva Evidencia</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre de la Evidencia:</label>
          <input
            id="nombre"
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Nombre descriptivo (opcional)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder="Detalles sobre la evidencia"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fecha_recoleccion">Fecha de recolección:</label>
          <input
            id="fecha_recoleccion"
            type="date"
            name="fecha_recoleccion"
            value={formData.fecha_recoleccion}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="file">Seleccionar Archivo:</label>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            required
            className="file-input"
          />
          {file && (
            <div className="file-info">
              <p><strong>Archivo seleccionado:</strong> {file.name}</p>
              <p><strong>Tamaño:</strong> {(file.size / 1024).toFixed(2)} KB</p>
              <p><strong>Tipo:</strong> {file.type}</p>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Subiendo...' : 'Subir Evidencia'}
        </button>
      </form>
    </div>
  );
}

export default SubirEvidencia;
