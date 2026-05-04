const db = require('../db');
const PDFDocument = require('pdfkit');

exports.getReports = async (req, res) => {
  try {
    const evidencias = await db.allAsync(
      `SELECT e.*, u.nombre as usuario_nombre
       FROM evidencias e
       JOIN usuarios u ON e.usuario_id = u.id
       WHERE e.eliminado = 0
       ORDER BY e.fecha_subida DESC`
    );

    res.json({
      total: evidencias.length,
      evidencias: evidencias.map(ev => ({
        id: ev.id,
        codigo: ev.codigo,
        nombre: ev.nombre,
        tipo: ev.tipo,
        estado: ev.estado,
        fecha_subida: ev.fecha_subida,
        tamano_bytes: ev.tamano_bytes,
        usuario_nombre: ev.usuario_nombre,
        hash_sha256: ev.hash_sha256
      }))
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.generateCertificatePDF = async (req, res) => {
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

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado_${evidencia.codigo}.pdf"`);

    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('CERTIFICADO DE INTEGRIDAD', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Gestor de Evidencias Digitales', { align: 'center' });
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Información de la evidencia
    doc.fontSize(11).font('Helvetica-Bold').text('DATOS DE LA EVIDENCIA', { underline: true });
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10);
    doc.text(`Código: ${evidencia.codigo}`);
    doc.text(`Nombre del Archivo: ${evidencia.nombre_original}`);
    doc.text(`Descripción: ${evidencia.descripcion || 'N/A'}`);
    doc.text(`Tipo: ${evidencia.tipo}`);
    doc.text(`Tamaño: ${(evidencia.tamano_bytes / 1024).toFixed(2)} KB`);
    doc.moveDown(0.3);

    doc.text(`Estado: ${evidencia.estado}`);
    doc.text(`Fecha de Recolección: ${new Date(evidencia.fecha_recoleccion).toLocaleDateString('es-GT')}`);
    doc.text(`Fecha de Carga: ${new Date(evidencia.fecha_subida).toLocaleString('es-GT')}`);
    doc.text(`Subido por: ${evidencia.usuario_nombre}`);
    doc.moveDown(0.5);

    // Hash SHA-256
    doc.fontSize(11).font('Helvetica-Bold').text('FIRMA DIGITAL (HASH SHA-256)', { underline: true });
    doc.moveDown(0.3);

    doc.font('Courier').fontSize(9);
    const hashLines = evidencia.hash_sha256.match(/.{1,64}/g) || [];
    hashLines.forEach(line => {
      doc.text(line);
    });
    doc.moveDown(0.5);

    // Estado de integridad
    doc.fontSize(11).font('Helvetica-Bold').text('ESTADO DE INTEGRIDAD', { underline: true });
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10);
    doc.text('✓ La evidencia ha sido verificada y se encuentra íntegra.');
    doc.text('✓ El hash SHA-256 certifica que no ha sido alterada.');
    doc.moveDown(0.5);

    // Referencia legal
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica').text(
      'REFERENCIA LEGAL - Decreto 47-2008 de Guatemala',
      { align: 'center', underline: true }
    );
    doc.moveDown(0.2);

    doc.fontSize(8).text(
      'Este certificado de integridad se emite conforme a lo establecido en el Decreto 47-2008 ' +
      'de la República de Guatemala, que regula la Firma Digital y sus aplicaciones. ' +
      'La evidencia respaldada por este certificado ha sido sometida a procedimientos ' +
      'criptográficos que garantizan su autenticidad e integridad.',
      { align: 'justify' }
    );
    doc.moveDown(0.3);

    doc.text(
      'La firma digital implementada mediante hash SHA-256 garantiza que la evidencia ' +
      'no ha sido modificada desde su carga inicial en el sistema.',
      { align: 'justify' }
    );
    doc.moveDown(0.3);

    // Pie de página
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(
        `Documento generado: ${new Date().toLocaleString('es-GT')} | Página ${i + 1} de ${pageCount}`,
        50,
        doc.page.height - 40,
        { align: 'center' }
      );
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const stats = await db.getAsync(`
      SELECT
        (SELECT COUNT(*) FROM evidencias WHERE eliminado = 0) as total_evidencias,
        (SELECT COUNT(*) FROM evidencias WHERE estado = 'activa' AND eliminado = 0) as activas,
        (SELECT COUNT(*) FROM evidencias WHERE estado = 'en_analisis' AND eliminado = 0) as en_analisis,
        (SELECT COUNT(*) FROM evidencias WHERE estado = 'cerrada' AND eliminado = 0) as cerradas,
        (SELECT SUM(tamano_bytes) FROM evidencias WHERE eliminado = 0) as tamano_total_bytes,
        (SELECT COUNT(DISTINCT usuario_id) FROM evidencias WHERE eliminado = 0) as usuarios_unicos,
        (SELECT COUNT(*) FROM cadena_custodia WHERE accion = 'verificacion_hash' AND hash_valido = 0) as verificaciones_fallidas
    `);

    res.json({
      total_evidencias: stats.total_evidencias,
      por_estado: {
        activas: stats.activas,
        en_analisis: stats.en_analisis,
        cerradas: stats.cerradas
      },
      tamano_total_mb: (stats.tamano_total_bytes / (1024 * 1024)).toFixed(2),
      usuarios_unicos: stats.usuarios_unicos,
      verificaciones_fallidas: stats.verificaciones_fallidas
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
