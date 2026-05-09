const db = require('../db');
const { signHash } = require('../utils/signature');
const fs = require('fs');
const crypto = require('crypto');

const getTipoFromMimeType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'imagen';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('text/')) return 'documento';

  const documentoMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
    'application/vnd.oasis.opendocument.text'
  ];

  return documentoMimes.includes(mimetype) ? 'documento' : 'documento';
};

const logAction = async (userId, evidenciaId, accion, detalle = null) => {
  try {
    await db.runAsync(
      'INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, detalle) VALUES (?, ?, ?, ?)',
      [evidenciaId, userId, accion, detalle]
    );
  } catch (error) {
    if (accion === 'firma_avanzada' && /CHECK|constraint/i.test(error.message)) {
      console.warn('Schema fallback: registro de firma avanzada usando acción verificacion_hash');
      await db.runAsync(
        'INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, detalle) VALUES (?, ?, ?, ?)',
        [evidenciaId, userId, 'verificacion_hash', detalle || 'Firma electrónica avanzada generada']
      );
    } else {
      console.error('Error logging action:', error.message);
    }
  }
};

exports.uploadEvidence = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Archivo no proporcionado' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    const usuario = await db.getAsync('SELECT nombre FROM usuarios WHERE id = ?', [req.user.id]);
    const firmaAvanzada = signHash(hash, usuario?.nombre || 'Sistema');
    
    const codigo = 'EV-' + Date.now();
    const fechaRecoleccion = req.body.fecha_recoleccion || new Date().toISOString().slice(0, 10);

    const tipo = getTipoFromMimeType(req.file.mimetype);
    const result = await db.runAsync(
      `INSERT INTO evidencias 
       (codigo, nombre, descripcion, tipo, ruta_archivo, nombre_original, hash_sha256, firma_avanzada, tamano_bytes, fecha_recoleccion, usuario_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        req.body.nombre || req.file.originalname,
        req.body.descripcion || '',
        tipo,
        filePath,
        req.file.originalname,
        hash,
        firmaAvanzada,
        req.file.size,
        fechaRecoleccion,
        req.user.id
      ]
    );

    await logAction(req.user.id, result.lastID, 'subida', 'Archivo subido');
    await logAction(req.user.id, result.lastID, 'firma_avanzada', 'Firma electrónica avanzada generada');

    res.status(201).json({
      id: result.lastID,
      codigo,
      nombre: req.body.nombre,
      hash,
      firma_avanzada: firmaAvanzada,
      msg: 'Evidencia registrada exitosamente'
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.signEvidence = async (req, res) => {
  try {
    const { id } = req.params;

    const evidencia = await db.getAsync(
      'SELECT id, hash_sha256 FROM evidencias WHERE id = ? AND eliminado = 0',
      [id]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    const usuario = await db.getAsync('SELECT nombre FROM usuarios WHERE id = ?', [req.user.id]);
    const firmaAvanzada = signHash(evidencia.hash_sha256, usuario?.nombre || 'Sistema');

    await db.runAsync(
      'UPDATE evidencias SET firma_avanzada = ? WHERE id = ?',
      [firmaAvanzada, id]
    );

    await logAction(req.user.id, id, 'firma_avanzada', 'Firma electrónica avanzada generada');

    res.json({
      id,
      firma_avanzada: firmaAvanzada,
      msg: 'Firma electrónica avanzada generada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const evidencias = await db.allAsync(
      `SELECT e.*, u.nombre as usuario_nombre 
       FROM evidencias e 
       JOIN usuarios u ON e.usuario_id = u.id 
       WHERE e.eliminado = 0`
    );
    res.json(evidencias);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const evidencia = await db.getAsync(
      `SELECT e.*, u.nombre as usuario_nombre 
       FROM evidencias e 
       JOIN usuarios u ON e.usuario_id = u.id 
       WHERE e.id = ? AND e.eliminado = 0`,
      [req.params.id]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    await logAction(req.user.id, req.params.id, 'visualizacion');

    res.json(evidencia);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, descripcion, estado } = req.body;
    
    const result = await db.runAsync(
      `UPDATE evidencias 
       SET nombre = ?, descripcion = ?, estado = ? 
       WHERE id = ?`,
      [nombre, descripcion, estado, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    await logAction(req.user.id, req.params.id, 'edicion_metadata', 'Metadatos actualizados');

    res.json({ msg: 'Evidencia actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const evidencia = await db.getAsync(
      'SELECT id FROM evidencias WHERE id = ?',
      [req.params.id]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    // Marcar como eliminada (soft delete - cumple principio de no borrado legal)
    const result = await db.runAsync(
      `UPDATE evidencias 
       SET eliminado = 1, fecha_eliminado = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [req.params.id]
    );

    await logAction(req.user.id, req.params.id, 'eliminacion', 'Evidencia marcada como eliminada');

    res.json({ msg: 'Evidencia eliminada (soft delete)' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};