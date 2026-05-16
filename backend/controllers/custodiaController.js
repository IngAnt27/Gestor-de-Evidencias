const db = require('../db');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { signHash, verifyHashSignature } = require('../utils/signature');

exports.getChain = async (req, res) => {
  try {
    const { evidenciaId } = req.params;

    const chain = await db.allAsync(
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

exports.getIntegrityAlerts = async (req, res) => {
  try {
    // Obtener todos los registros de cadena de custodia donde hash_valido = 0 (inválido)
    const alerts = await db.allAsync(
      `SELECT cc.*, e.codigo, e.nombre, u.nombre as usuario_nombre
       FROM cadena_custodia cc
       JOIN evidencias e ON cc.evidencia_id = e.id
       JOIN usuarios u ON cc.usuario_id = u.id
       WHERE cc.hash_valido = 0
       ORDER BY cc.fecha DESC`
    );

    // Contar total de alertas
    const totalAlerts = alerts.length;

    res.json({
      total: totalAlerts,
      alerts: alerts
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.deleteHistory = async (req, res) => {
  try {
    const { evidenciaId } = req.params;

    const evidencia = await db.getAsync(
      'SELECT id, usuario_id FROM evidencias WHERE id = ? AND eliminado = 0',
      [evidenciaId]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    if (req.user.rol !== 'admin' && Number(req.user.id) !== evidencia.usuario_id) {
      return res.status(403).json({ msg: 'Acceso denegado. Solo el administrador o el propietario puede eliminar el historial.' });
    }

    await db.runAsync('DELETE FROM cadena_custodia WHERE evidencia_id = ?', [evidenciaId]);
    res.json({ msg: 'Historial de custodia eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.signAdvancedSignature = async (req, res) => {
  try {
    const { evidenciaId } = req.body;

    const evidencia = await db.getAsync(
      'SELECT hash_sha256 FROM evidencias WHERE id = ? AND eliminado = 0',
      [evidenciaId]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    const usuario = await db.getAsync(
      'SELECT id, nombre FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Generar firma electrónica avanzada
    const firma_timestamp = new Date().toISOString();
    const firma_avanzada = signHash(evidencia.hash_sha256, usuario.nombre, firma_timestamp);

    // Guardar firma en la evidencia
    await db.runAsync(
      `UPDATE evidencias 
       SET firma_avanzada = ?, firma_usuario_nombre = ?, firma_timestamp = ?
       WHERE id = ?`,
      [firma_avanzada, usuario.nombre, firma_timestamp, evidenciaId]
    );

    // Registrar en cadena de custodia
    await db.runAsync(
      `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, detalle, hash_valido)
       VALUES (?, ?, 'firma_avanzada', ?, 1)`,
      [evidenciaId, req.user.id, `Firmado por ${usuario.nombre}`]
    );

    res.json({
      msg: 'Firma electrónica avanzada generada exitosamente',
      firma_avanzada: firma_avanzada.substring(0, 50) + '...',
      usuario: usuario.nombre,
      timestamp: firma_timestamp
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.verifyIntegrity = async (req, res) => {
  try {
    const { evidenciaId, hashProvided } = req.body;

    const evidencia = await db.getAsync(
      'SELECT hash_sha256, ruta_archivo FROM evidencias WHERE id = ? AND eliminado = 0',
      [evidenciaId]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    const evidenciaPath = path.isAbsolute(evidencia.ruta_archivo)
      ? evidencia.ruta_archivo
      : path.join(__dirname, '..', evidencia.ruta_archivo);

    let hashCalculado = null;
    let isValid = false;
    let detalle = '';

    if (evidencia.ruta_archivo && fs.existsSync(evidenciaPath)) {
      const fileBuffer = fs.readFileSync(evidenciaPath);
      hashCalculado = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      isValid = hashCalculado === evidencia.hash_sha256;
      detalle = isValid
        ? 'Hash calculado coincide con el hash registrado'
        : 'Hash calculado no coincide con el hash registrado';
    } else if (hashProvided) {
      isValid = evidencia.hash_sha256 === hashProvided;
      detalle = isValid
        ? 'Hash proporcionado coincide con el hash registrado'
        : 'Hash proporcionado no coincide con el hash registrado';
    } else {
      return res.status(400).json({ msg: 'No se pudo verificar la integridad: archivo no disponible y no se proporcionó hash' });
    }

    await db.runAsync(
      `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido, detalle)
       VALUES (?, ?, 'verificacion_hash', ?, ?)`,
      [evidenciaId, req.user.id, isValid ? 1 : 0, detalle]
    );

    res.json({
      valido: isValid,
      hashEsperado: evidencia.hash_sha256,
      hashCalculado,
      msg: isValid ? 'Hash verificado exitosamente' : 'Archivo no coincide o corrupto - posible alteración detectada'
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.verifyDoubleCheck = async (req, res) => {
  try {
    const { evidenciaId } = req.body;

    const evidencia = await db.getAsync(
      'SELECT hash_sha256, ruta_archivo, nombre_original, tipo, tamano_bytes FROM evidencias WHERE id = ? AND eliminado = 0',
      [evidenciaId]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    const evidenciaPath = path.isAbsolute(evidencia.ruta_archivo)
      ? evidencia.ruta_archivo
      : path.join(__dirname, '..', evidencia.ruta_archivo);

    let resultados = {
      hashValido: false,
      archivoExiste: false,
      tamanoCoincide: false,
      tipoCoincide: false,
      verificacionCompleta: false,
      detalles: []
    };

    // Verificar existencia del archivo
    if (fs.existsSync(evidenciaPath)) {
      resultados.archivoExiste = true;
      resultados.detalles.push('Archivo encontrado en el sistema');

      const stats = fs.statSync(evidenciaPath);
      const fileBuffer = fs.readFileSync(evidenciaPath);

      // Verificar hash
      const hashCalculado = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      resultados.hashValido = hashCalculado === evidencia.hash_sha256;
      resultados.detalles.push(resultados.hashValido ?
        'Hash SHA-256 verificado correctamente' :
        'Hash SHA-256 no coincide - posible alteración');

      // Verificar tamaño
      resultados.tamanoCoincide = stats.size === evidencia.tamano_bytes;
      resultados.detalles.push(resultados.tamanoCoincide ?
        `Tamaño verificado: ${stats.size} bytes` :
        `Tamaño no coincide: esperado ${evidencia.tamano_bytes}, actual ${stats.size}`);

      // Verificar tipo (básico)
      const extensionEsperada = evidencia.nombre_original.split('.').pop()?.toLowerCase();
      const extensionActual = evidenciaPath.split('.').pop()?.toLowerCase();
      resultados.tipoCoincide = extensionEsperada === extensionActual;
      resultados.detalles.push(resultados.tipoCoincide ?
        `Tipo de archivo verificado: .${extensionActual}` :
        `Tipo no coincide: esperado .${extensionEsperada}, actual .${extensionActual}`);

    } else {
      resultados.detalles.push('Archivo no encontrado en el sistema de archivos');
    }

    // Verificación completa requiere que todos los checks pasen
    resultados.verificacionCompleta = resultados.archivoExiste &&
                                      resultados.hashValido &&
                                      resultados.tamanoCoincide &&
                                      resultados.tipoCoincide;

    const mensajeFinal = resultados.verificacionCompleta ?
      'Verificación judicial completa: Archivo íntegro y auténtico' :
      'Verificación judicial: Anomalías detectadas - requiere investigación';

    await db.runAsync(
      `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido, detalle)
       VALUES (?, ?, 'verificacion_judicial', ?, ?)`,
      [evidenciaId, req.user.id, resultados.verificacionCompleta ? 1 : 0, mensajeFinal]
    );

    res.json({
      ...resultados,
      msg: mensajeFinal
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.verifyAdvancedSignature = async (req, res) => {
  try {
    const { evidenciaId } = req.body;

    const evidencia = await db.getAsync(
      'SELECT hash_sha256, firma_avanzada, firma_usuario_nombre, firma_timestamp FROM evidencias WHERE id = ? AND eliminado = 0',
      [evidenciaId]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    if (!evidencia.firma_avanzada) {
      return res.status(400).json({ msg: 'La evidencia no tiene firma electrónica avanzada' });
    }

    const isValid = verifyHashSignature(
      evidencia.hash_sha256,
      evidencia.firma_avanzada,
      evidencia.firma_usuario_nombre,
      evidencia.firma_timestamp
    );

    await db.runAsync(
      `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido, detalle)
       VALUES (?, ?, 'verificacion_firma', ?, ?)`,
      [evidenciaId, req.user.id, isValid ? 1 : 0, `Verificado firma de ${evidencia.firma_usuario_nombre}`]
    );

    res.json({
      valido: isValid,
      usuario_firma: evidencia.firma_usuario_nombre,
      msg: isValid ? 'Firma avanzada verificada exitosamente' : 'Firma avanzada no válida'
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.generateTraceabilityPDF = async (req, res) => {
  try {
    const { evidenciaId } = req.params;

    const evidencia = await db.getAsync(
      `SELECT e.*, u.nombre as usuario_nombre
       FROM evidencias e
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE e.id = ? AND e.eliminado = 0`,
      [evidenciaId]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    const chain = await db.allAsync(
      `SELECT cc.*, u.nombre as usuario_nombre
       FROM cadena_custodia cc
       JOIN usuarios u ON cc.usuario_id = u.id
       WHERE cc.evidencia_id = ?
       ORDER BY cc.fecha DESC`,
      [evidenciaId]
    );

    const doc = new PDFDocument({ margin: 40, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="trazabilidad_${evidencia.codigo}.pdf"`);

    doc.pipe(res);

    // Encabezado
    doc.fontSize(16).font('Helvetica-Bold').text('CERTIFICADO DE INTEGRIDAD Y TRAZABILIDAD DIGITAL', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('Gestor de Evidencias Digitales de Guatemala', { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // Información de la evidencia
    doc.fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DE LA EVIDENCIA', { underline: true });
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10);
    doc.text(`Código: ${evidencia.codigo}`, { continued: true });
    doc.font('Helvetica-Bold').text(`   |   Estado: ${evidencia.estado.toUpperCase()}`);
    doc.text(`Nombre: ${evidencia.nombre_original}`);
    doc.text(`Tipo: ${evidencia.tipo}   |   Tamaño: ${(evidencia.tamano_bytes / 1024).toFixed(2)} KB`);
    doc.text(`Subido por: ${evidencia.usuario_nombre}`);
    doc.text(`Fecha de subida: ${new Date(evidencia.fecha_subida).toLocaleString('es-GT')}`);
    doc.moveDown(0.5);

    // Hash SHA-256
    doc.fontSize(11).font('Helvetica-Bold').text('VERIFICACIÓN DE INTEGRIDAD', { underline: true });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(9);
    doc.text('Hash SHA-256 (Firma Digital):');
    doc.moveDown(0.1);
    doc.fontSize(8).text(evidencia.hash_sha256, { width: 520, lineGap: 2 });
    doc.moveDown(0.4);

    // Firma Electrónica Avanzada
    if (evidencia.firma_avanzada) {
      doc.fontSize(11).font('Helvetica-Bold').text('FIRMA ELECTRÓNICA AVANZADA (RSA-SHA256)', { underline: true });
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Firmado por: ${evidencia.firma_usuario_nombre}`);
      doc.text(`Fecha de firma: ${new Date(evidencia.firma_timestamp).toLocaleString('es-GT')}`);
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(8);
      doc.text('Firma (primeros 100 caracteres):');
      doc.text(evidencia.firma_avanzada.substring(0, 100) + '...');
      doc.moveDown(0.5);
    }

    // Cadena de Custodia
    doc.fontSize(11).font('Helvetica-Bold').text('CADENA DE CUSTODIA (HISTORIAL COMPLETO)', { underline: true });
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica');
    doc.text(`Total de registros: ${chain.length}`);
    doc.moveDown(0.2);

    // Tabla de cadena
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 280;
    const col4 = 430;

    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Fecha', col1, tableTop);
    doc.text('Usuario', col2, tableTop);
    doc.text('Acción', col3, tableTop);
    doc.text('Estado', col4, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

    let y = tableTop + 20;
    const pageHeight = doc.page.height - 60;

    doc.font('Helvetica').fontSize(7);

    for (const record of chain) {
      if (y > pageHeight) {
        doc.addPage();
        y = 50;
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Fecha', col1, y);
        doc.text('Usuario', col2, y);
        doc.text('Acción', col3, y);
        doc.text('Estado', col4, y);
        doc.moveTo(40, y + 15).lineTo(555, y + 15).stroke();
        y += 25;
        doc.fontSize(7).font('Helvetica');
      }

      const fecha = new Date(record.fecha).toLocaleString('es-GT');
      const accion = record.accion.replace(/_/g, ' ').toUpperCase();
      const estado = record.hash_valido === 1 ? '✓ VÁLIDO' : record.hash_valido === 0 ? '✗ INVÁLIDO' : 'N/A';

      doc.text(fecha, col1, y, { width: 90 });
      doc.text(record.usuario_nombre, col2, y, { width: 120 });
      doc.text(accion, col3, y, { width: 140 });
      doc.text(estado, col4, y);

      y += 12;
    }

    doc.moveDown(1);

    // Nota legal
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica-Oblique');
    doc.text('NOTA LEGAL: Este certificado tiene validez legal de conformidad con el Decreto 47-2008 de Guatemala (Ley para el Reconocimiento de las Comunicaciones y Firmas Electrónicas).', { align: 'justify' });
    doc.fontSize(7).text('Los hashes SHA-256 y las firmas digitales RSA-SHA256 garantizan la integridad y autenticidad de las evidencias.', { align: 'justify' });

    doc.end();
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
