const db = require('../db');
const PDFDocument = require('pdfkit');
const { verifyHashSignature } = require('../utils/signature');

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

exports.verifyIntegrity = async (req, res) => {
  try {
    const { evidenciaId, hashProvided } = req.body;

    const evidencia = await db.getAsync(
      'SELECT hash_sha256 FROM evidencias WHERE id = ?',
      [evidenciaId]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    const isValid = evidencia.hash_sha256 === hashProvided;

    await db.runAsync(
      `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido)
       VALUES (?, ?, 'verificacion_hash', ?)`,
      [evidenciaId, req.user.id, isValid ? 1 : 0]
    );

    res.json({
      valido: isValid,
      hashEsperado: evidencia.hash_sha256,
      msg: isValid ? 'Hash verificado exitosamente' : 'Hash no coincide'
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.verifyAdvancedSignature = async (req, res) => {
  try {
    const { evidenciaId } = req.body;

    const evidencia = await db.getAsync(
      'SELECT hash_sha256, firma_avanzada FROM evidencias WHERE id = ? AND eliminado = 0',
      [evidenciaId]
    );

    if (!evidencia) {
      return res.status(404).json({ msg: 'Evidencia no encontrada' });
    }

    if (!evidencia.firma_avanzada) {
      return res.status(400).json({ msg: 'La evidencia no tiene firma electrónica avanzada' });
    }

    const usuario = await db.getAsync('SELECT nombre FROM usuarios WHERE id = ?', [req.user.id]);
    const isValid = verifyHashSignature(evidencia.hash_sha256, evidencia.firma_avanzada, usuario?.nombre || 'Sistema');

    try {
      await db.runAsync(
        `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido)
         VALUES (?, ?, 'verificacion_firma', ?)`,
        [evidenciaId, req.user.id, isValid ? 1 : 0]
      );
    } catch (error) {
      if (/CHECK|constraint/i.test(error.message)) {
        await db.runAsync(
          `INSERT INTO cadena_custodia (evidencia_id, usuario_id, accion, hash_valido)
           VALUES (?, ?, 'verificacion_hash', ?)`,
          [evidenciaId, req.user.id, isValid ? 1 : 0]
        );
      } else {
        throw error;
      }
    }

    res.json({
      valido: isValid,
      hashEsperado: evidencia.hash_sha256,
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

    doc.fontSize(16).font('Helvetica-Bold').text('CERTIFICADO DE INTEGRIDAD Y TRAZABILIDAD DIGITAL', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('Gestor de Evidencias Digitales de Guatemala', { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DE LA EVIDENCIA', { underline: true });
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10);
    doc.text(`Código: ${evidencia.codigo}`, { continued: true });
    doc.font('Helvetica-Bold').text(`   |   Estado: ${evidencia.estado.toUpperCase()}`);
    doc.text(`Nombre: ${evidencia.nombre_original}`);
    doc.text(`Tipo: ${evidencia.tipo}   |   Tamaño: ${(evidencia.tamano_bytes / 1024).toFixed(2)} KB`);
    doc.text(`Subido por: ${evidencia.usuario_nombre}`);
    doc.text(`Fecha de Carga: ${new Date(evidencia.fecha_subida).toLocaleString('es-GT')}`);
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica-Bold').text('HASH SHA-256 (FIRMA DIGITAL)', { underline: true });
    doc.moveDown(0.2);
    doc.font('Courier').fontSize(9).text(evidencia.hash_sha256, { wordWrap: true });
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica-Bold').text('FIRMA ELECTRÓNICA AVANZADA', { underline: true });
    doc.moveDown(0.2);
    
    const firmaEntry = chain.find(entry => entry.accion === 'firma_avanzada');
    if (firmaEntry) {
      doc.font('Helvetica').fontSize(9).text(`Firmado por: ${firmaEntry.usuario_nombre}`);
      doc.text(`Fecha de firma: ${new Date(firmaEntry.fecha).toLocaleString('es-GT')}`);
      doc.moveDown(0.2);
    }
    
    doc.font('Courier').fontSize(8).text(evidencia.firma_avanzada || 'No disponible', { wordWrap: true });
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica-Bold').text('HISTORIAL DE ACCESOS Y MODIFICACIONES', { underline: true });
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const col1 = 40, col2 = 140, col3 = 280, col4 = 420;
    const rowHeight = 20;

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Fecha/Hora', col1, tableTop);
    doc.text('Acción', col2, tableTop);
    doc.text('Usuario', col3, tableTop);
    doc.text('Estado', col4, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

    let currentY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    chain.forEach((entry, index) => {
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 40;
      }

      const fecha = new Date(entry.fecha).toLocaleString('es-GT');
      const accion = entry.accion.replace(/_/g, ' ').toUpperCase();
      const usuario = entry.usuario_nombre;
      const estado = entry.hash_valido === 0 && (entry.accion === 'verificacion_hash' || entry.accion === 'verificacion_firma') ? '✗ FALLIDO' : '✓ OK';

      doc.text(fecha.substring(0, 16), col1, currentY);
      doc.text(accion, col2, currentY);
      doc.text(usuario, col3, currentY);
      doc.text(estado, col4, currentY);

      if (index < chain.length - 1) {
        currentY += rowHeight;
      }
    });

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').text('VALIDACIÓN LEGAL', { underline: true });
    doc.moveDown(0.2);

    doc.font('Helvetica').fontSize(8).text(
      'Este certificado de integridad y trazabilidad se emite conforme a lo establecido en el Decreto 47-2008 ' +
      'de la República de Guatemala, que regula la Firma Digital y sus aplicaciones. La cadena de custodia ' +
      'presentada constituye evidencia legal de los accesos, modificaciones y verificaciones realizadas en el archivo.',
      { align: 'justify' }
    );

    doc.moveDown(0.3);
    doc.text(
      'El Hash SHA-256 presente en este certificado constituye la firma digital de la evidencia, ' +
      'garantizando su autenticidad e integridad según normativa guatemalteca vigente.',
      { align: 'justify' }
    );

    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').text(
        `Generado: ${new Date().toLocaleString('es-GT')} | Página ${i + 1} de ${pageCount}`,
        40,
        doc.page.height - 30,
        { align: 'center' }
      );
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

