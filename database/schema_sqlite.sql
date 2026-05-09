CREATE TABLE IF NOT EXISTS usuarios (
id INTEGER PRIMARY KEY AUTOINCREMENT,
nombre TEXT NOT NULL,
email TEXT NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
rol TEXT NOT NULL DEFAULT 'consulta' CHECK (rol IN ('admin','investigador','consulta')),
activo INTEGER NOT NULL DEFAULT 1,
fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
ultimo_acceso DATETIME
);

CREATE TABLE IF NOT EXISTS evidencias (
id INTEGER PRIMARY KEY AUTOINCREMENT,
codigo TEXT NOT NULL UNIQUE,
nombre TEXT NOT NULL,
descripcion TEXT,
tipo TEXT NOT NULL CHECK (tipo IN ('imagen','video','documento','audio')),
ruta_archivo TEXT NOT NULL,
nombre_original TEXT NOT NULL,
hash_sha256 TEXT NOT NULL,
tamano_bytes INTEGER NOT NULL DEFAULT 0,
estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','en_analisis','cerrada')),
fecha_recoleccion DATE NOT NULL,
fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
usuario_id INTEGER NOT NULL,
firma_avanzada TEXT,
firma_usuario_nombre TEXT,
firma_timestamp DATETIME,
eliminado INTEGER NOT NULL DEFAULT 0,
fecha_eliminado DATETIME,
FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS cadena_custodia (
id INTEGER PRIMARY KEY AUTOINCREMENT,
evidencia_id INTEGER NOT NULL,
usuario_id INTEGER NOT NULL,
accion TEXT NOT NULL CHECK (accion IN (
    'subida',
    'visualizacion',
    'descarga',
    'edicion_metadata',
    'cambio_estado',
    'eliminacion',
    'firma_avanzada',
    'verificacion_hash',
    'verificacion_firma'
)),
detalle TEXT,
ip_origen TEXT,
user_agent TEXT,
hash_valido INTEGER,
fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (evidencia_id) REFERENCES evidencias(id),
FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);