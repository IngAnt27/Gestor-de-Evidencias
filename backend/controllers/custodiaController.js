const db = require('../db');

exports.getChain = async (req, res) => {
  try {
    const { evidenciaId } = req.params;

    const [chain] = await db.execute(
      `SELECT cc.*, u.nombre as usuario_nombre 
       FROM cadena_custodia cc 
       JOIN usuarios u ON cc.usuario_id = u.id 
       WHERE cc.evidencia_id = ? 
       ORDER BY cc.fecha DESC`,
      [evidenciaId]
    );

    res.json(chain);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.verifyIntegrity = async (req, res) => {
  try {
    const { evidenciaId, hashProvided } = req.body;

    const [evidencias] = await db.execute(
      'SELECT hash_sha256 FROM evidencias WHERE id = ?',
      [evidenciaId]
    );

    if (evidencias.length === 0) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    const isValid = evidencias[0].hash_sha256 === hashProvided;

    // Registrar verificación
    await db.execute(
      `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido) 
       VALUES (?, ?, 'verificacion_hash', ?)`,
      [evidenciaId, req.user.id, isValid ? 1 : 0]
    );

    res.json({
      valido: isValid,
      hashEsperado: evidencias[0].hash_sha256,
      msg: isValid ? 'Hash verificado exitosamente' : 'Hash no coincide'
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
