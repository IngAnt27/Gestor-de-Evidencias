import React from 'react';
import './ListaEvidencias.css';

function ListaEvidencias({ evidencias, onSeleccionar, selectedId }) {
  return (
    <div className="lista-evidencias">
      <div className="lista-header">
        <h3>Evidencias Registradas</h3>
        <span className="count">{evidencias.length}</span>
      </div>

      {evidencias.length === 0 ? (
        <div className="empty-state">
          <p>No hay evidencias registradas</p>
          <p className="hint">Sube una nueva evidencia para comenzar</p>
        </div>
      ) : (
        <ul className="evidencias-list">
          {evidencias.map((evidencia) => (
            <li
              key={evidencia.id}
              className={`evidencia-item ${selectedId === evidencia.id ? 'selected' : ''}`}
              onClick={() => onSeleccionar(evidencia)}
            >
              <div className="item-header">
                <h4>{evidencia.nombre}</h4>
                <span className={`tipo-badge tipo-${evidencia.tipo.replace('/', '-')}`}>
                  {evidencia.tipo}
                </span>
              </div>
              <p className="codigo">
                <strong>Código:</strong> {evidencia.codigo}
              </p>
              <p className="usuario">
                <strong>Por:</strong> {evidencia.usuario_nombre}
              </p>
              <p className="fecha">
                <strong>Fecha:</strong> {new Date(evidencia.fecha_subida).toLocaleDateString()}
              </p>
              <div className="item-footer">
                <span className={`estado estado-${evidencia.estado}`}>
                  {evidencia.estado}
                </span>
                <span className="tamaño">
                  {(evidencia.tamano_bytes / 1024).toFixed(2)} KB
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ListaEvidencias;
