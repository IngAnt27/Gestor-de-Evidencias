CREATE DATABASE IF NOT EXISTS gestor_evidencias;
USE gestor_evidencias;

CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','investigador','consulta') NOT NULL DEFAULT 'consulta',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso DATETIME
);

CREATE TABLE evidencias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo ENUM('imagen','video','documento','audio') NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  nombre_original VARCHAR(300) NOT NULL,
  hash_sha256 CHAR(64) NOT NULL,
  tamano_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  estado ENUM('activa','en_analisis','cerrada') NOT NULL DEFAULT 'activa',
  fecha_recoleccion DATE NOT NULL,
  fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT UNSIGNED NOT NULL,
  eliminado TINYINT(1) NOT NULL DEFAULT 0,
  fecha_eliminado DATETIME,
  CONSTRAINT fk_evidencia_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE cadena_custodia (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  evidencia_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  accion ENUM(
    'subida',
    'visualizacion',
    'descarga',
    'edicion_metadata',
    'cambio_estado',
    'eliminacion',
    'verificacion_hash'
  ) NOT NULL,
  detalle VARCHAR(500),
  ip_origen VARCHAR(45),
  user_agent VARCHAR(300),
  hash_valido TINYINT(1),
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_custodia_evidencia
    FOREIGN KEY (evidencia_id) REFERENCES evidencias(id),
  CONSTRAINT fk_custodia_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);