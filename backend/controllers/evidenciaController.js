const db = require('../db');
const { generateHash } = require('../utils/hash');
const fs = require('fs');
const crypto = require('crypto');

const logAction = async (userId, evidenciaId, accion, detalle = null) => {
  try {
    await db.runAsync(
      'INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, detalle) VALUES (?, ?, ?, ?)',
      [evidenciaId, userId, accion, detalle]
    );
  } catch (error) {
    console.error('Error logging action:', error.message);
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
    
    const codigo = 'EV-' + Date.now();
    const result = await db.runAsync(
      `INSERT INTO evidencias 
       (codigo, nombre, descripcion, tipo, ruta_archivo, nombre_original, hash_sha256, tamano_bytes, usuario_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        req.body.nombre || req.file.originalname,
        req.body.descripcion || '',
        req.file.mimetype,
        filePath,
        req.file.originalname,
        hash,
        req.file.size,
        req.user.id
      ]
    );

    await logAction(req.user.id, result.lastID, 'subida', 'Archivo subido');

    res.status(201).json({
      id: result.lastID,
      codigo,
      nombre: req.body.nombre,
      hash,
      msg: 'Evidencia registrada exitosamente'
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